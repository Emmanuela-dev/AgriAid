import AudioRecordingWorklet from "./worklets/audio-processing";
import VolMeterWorket from "./worklets/vol-meter";

import { createWorketFromSrc } from "./audioworklet-registry";
import EventEmitter from "eventemitter3";
import { audioContext } from "@/utils/utils";

function arrayBufferToBase64(buffer: ArrayBuffer) {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

export class AudioRecorder extends EventEmitter {
  stream: MediaStream | undefined;
  audioContext: AudioContext | undefined;
  source: MediaStreamAudioSourceNode | undefined;
  recording: boolean = false;
  recordingWorklet: AudioWorkletNode | undefined;
  vuWorklet: AudioWorkletNode | undefined;

  private starting: Promise<void> | null = null;
  private pcmChunks: Uint8Array[] = [];

  constructor(public sampleRate = 16000) {
    super();
  }

  async start() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error("Could not request user media");
    }

    if (this.starting) {
      return this.starting;
    }

    this.starting = (async () => {
      this.pcmChunks = [];
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: false, // Disable aggressive noise suppression for better clarity
          autoGainControl: true,
          sampleRate: this.sampleRate,
        },
      });
      this.audioContext = await audioContext({ sampleRate: this.sampleRate });
      this.source = this.audioContext.createMediaStreamSource(this.stream);

      const workletName = "audio-recorder-worklet";
      const src = createWorketFromSrc(workletName, AudioRecordingWorklet);

      await this.audioContext.audioWorklet.addModule(src);
      this.recordingWorklet = new AudioWorkletNode(
        this.audioContext,
        workletName
      );

      this.recordingWorklet.port.onmessage = async (ev: MessageEvent) => {
        // worklet processes recording floats and messages converted buffer
        const arrayBuffer = ev.data.data.int16arrayBuffer;

        if (arrayBuffer) {
          const arrayBufferString = arrayBufferToBase64(arrayBuffer);
          this.pcmChunks.push(new Uint8Array(arrayBuffer.slice(0)));
          this.emit("data", arrayBufferString);
        }
      };
      this.source.connect(this.recordingWorklet);

      // vu meter worklet
      const vuWorkletName = "vu-meter";
      await this.audioContext.audioWorklet.addModule(
        createWorketFromSrc(vuWorkletName, VolMeterWorket)
      );
      this.vuWorklet = new AudioWorkletNode(this.audioContext, vuWorkletName);
      this.vuWorklet.port.onmessage = (ev: MessageEvent) => {
        this.emit("volume", ev.data.volume);
      };

      this.source.connect(this.vuWorklet);
      this.recording = true;
    })();

    try {
      await this.starting;
    } finally {
      this.starting = null;
    }
  }

  getWavBlob() {
    const pcmLength = this.pcmChunks.reduce((length, chunk) => length + chunk.length, 0);
    const wav = new ArrayBuffer(44 + pcmLength);
    const view = new DataView(wav);
    const writeText = (offset: number, text: string) => {
      for (let index = 0; index < text.length; index += 1) {
        view.setUint8(offset + index, text.charCodeAt(index));
      }
    };

    writeText(0, "RIFF");
    view.setUint32(4, 36 + pcmLength, true);
    writeText(8, "WAVE");
    writeText(12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, this.sampleRate, true);
    view.setUint32(28, this.sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeText(36, "data");
    view.setUint32(40, pcmLength, true);

    const pcm = new Uint8Array(wav, 44);
    let offset = 0;
    for (const chunk of this.pcmChunks) {
      pcm.set(chunk, offset);
      offset += chunk.length;
    }

    return new Blob([wav], { type: "audio/wav" });
  }

  async flush() {
    if (!this.recordingWorklet) return;
    const flushed = new Promise<void>((resolve) => {
      const handleData = () => {
        this.off("data", handleData);
        resolve();
      };
      this.on("data", handleData);
      this.recordingWorklet?.port.postMessage("flush");
      window.setTimeout(() => {
        this.off("data", handleData);
        resolve();
      }, 100);
    });
    await flushed;
  }

  stop() {
    // its plausible that stop would be called before start completes
    // such as if the websocket immediately hangs up
    const handleStop = () => {
      this.source?.disconnect();
      this.stream?.getTracks().forEach((track) => track.stop());
      this.stream = undefined;
      this.recordingWorklet = undefined;
      this.vuWorklet = undefined;
    };
    if (this.starting) {
      this.starting.then(handleStop);
      return;
    }
    handleStop();
  }
}
