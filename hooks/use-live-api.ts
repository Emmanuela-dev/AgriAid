import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  MultimodalLiveAPIClientConnection,
  MultimodalLiveClient,
} from "../lib/multimodal-live-client";
import { AudioStreamer } from "../lib/audio-streamer";
import VolMeterWorket from "../lib/worklets/vol-meter";
import { LiveConfig } from "@/types/multimodal-live-types";
import { audioContext } from "@/utils/utils";

export type UseLiveAPIResults = {
  client: MultimodalLiveClient;
  setConfig: (config: LiveConfig) => void;
  config: LiveConfig;
  connected: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  volume: number;
  latestResponse: string;
  isResponding: boolean;
  clearLatestResponse: () => void;
  sendTextAndGetResponse: (text: string) => Promise<void>;
};

export function useLiveAPI({
  url,
  apiKey,
}: MultimodalLiveAPIClientConnection): UseLiveAPIResults {
  const client = useMemo(
    () => new MultimodalLiveClient({ url, apiKey }),
    [url, apiKey],
  );
  const audioStreamerRef = useRef<AudioStreamer | null>(null);

  const [connected, setConnected] = useState(false);
  const [latestResponse, setLatestResponse] = useState("");
  const [isResponding, setIsResponding] = useState(false);
  const [config, setConfig] = useState<LiveConfig>({
    model: "models/gemini-2.5-flash-native-audio-latest",
    generationConfig: {
      responseModalities: ["AUDIO"] as any,
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: {
            voiceName: "Aoede",
          },
        },
      },
      thinkingConfig: { thinkingBudget: 0 },
    } as any,
    systemInstruction: {
      parts: [
        {
          text: `You are AgriAid, a farming assistant for Kenyan farmers. Be direct and concise. No thinking out loud, no meta-commentary, no "I am analyzing" phrases. Just answer the question immediately and clearly. Give practical bullet points when listing steps. You know all 47 Kenyan counties, their climates, soils, and suitable crops. Detect the farmer's language and respond in that same language. Supported languages include English, Kiswahili, Kikuyu, Luo, Luhya, Kamba, Kalenjin, Meru, Mijikenda, Somali, Maasai, Turkana, Kisii, and any other Kenyan language or dialect — always match whatever language the farmer speaks.`,
        },
      ],
    },
  });
  const [volume, setVolume] = useState(0);

  // register audio for streaming server -> speakers
  useEffect(() => {
    if (!audioStreamerRef.current) {
      audioContext({ id: "audio-out" }).then((audioCtx: AudioContext) => {
        audioStreamerRef.current = new AudioStreamer(audioCtx);
        audioStreamerRef.current
          .addWorklet<any>("vumeter-out", VolMeterWorket, (ev: any) => {
            setVolume(ev.data.volume);
          })
          .then(() => {
            // Successfully added worklet
          });
      });
    }
  }, [audioStreamerRef]);

  useEffect(() => {
    const onClose = () => {
      setConnected(false);
      setIsResponding(false);
    };

    const stopAudioStreamer = () => audioStreamerRef.current?.stop();

    const onAudio = async (data: ArrayBuffer) => {
      const streamer = audioStreamerRef.current;
      if (!streamer) return;
      if (streamer.context.state === "suspended") {
        await streamer.context.resume();
      }
      streamer.isStreamComplete = false;
      streamer.addPCM16(new Uint8Array(data));
      setIsResponding(true);
    };

    const onContent = (data: any) => {
      // capture text from regular parts
      const parts = data.modelTurn?.parts || [];
      const text = parts.map((p: any) => p.text || "").join("").trim();
      if (text) {
        setLatestResponse((current) => current ? `${current} ${text}` : text);
      }
      // capture output audio transcription
      const transcript = data.outputTranscription?.text || data.serverContent?.outputTranscription?.text || "";
      if (transcript) {
        setLatestResponse((current) => current ? `${current} ${transcript}` : transcript);
      }
    };

    const onTurnComplete = () => {
      setTimeout(() => {
        audioStreamerRef.current?.complete();
      }, 500);
      setIsResponding(false);
    };

    const onInterrupted = () => {
      audioStreamerRef.current?.stop();
      setIsResponding(false);
    };

    client
      .on("close", onClose)
      .on("interrupted", onInterrupted)
      .on("audio", onAudio)
      .on("content", onContent as never)
      .on("turncomplete", onTurnComplete);

    return () => {
      client
        .off("close", onClose)
        .off("interrupted", onInterrupted)
        .off("audio", onAudio)
        .off("content", onContent as never)
        .off("turncomplete", onTurnComplete);
    };
  }, [client]);

  const connect = useCallback(async () => {
    if (!config) {
      throw new Error("config has not been set");
    }
    client.disconnect();
    await client.connect(config);
    setConnected(true);
  }, [client, setConnected, config]);

  const disconnect = useCallback(async () => {
    client.disconnect();
    setConnected(false);
  }, [setConnected, client]);

  const clearLatestResponse = useCallback(() => {
    setLatestResponse("");
  }, []);

  const sendTextAndGetResponse = useCallback(async (text: string) => {
    setLatestResponse("");
    setIsResponding(true);
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            system_instruction: {
              parts: [{ text: `You are AgriAid, a farming assistant for Kenyan farmers. Be direct and concise. No meta-commentary. Give practical bullet points. You know all 47 Kenyan counties, their climates, soils, and suitable crops. Detect the farmer's language and respond in that same language. Supported languages include English, Kiswahili, Kikuyu, Luo, Luhya, Kamba, Kalenjin, Meru, Mijikenda, Somali, Maasai, Turkana, Kisii, and any other Kenyan language.` }],
            },
            contents: [{ role: "user", parts: [{ text }] }],
          }),
        }
      );
      const data = await res.json();
      const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      setLatestResponse(responseText);

      // play audio via TTS
      if (responseText && audioStreamerRef.current) {
        const ttsRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: responseText }] }],
              generationConfig: {
                responseModalities: ["AUDIO"],
                speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: "Aoede" } } },
              },
            }),
          }
        );
        const ttsData = await ttsRes.json();
        const audioB64 = ttsData.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (audioB64 && audioStreamerRef.current) {
          const streamer = audioStreamerRef.current;
          if (streamer.context.state === "suspended") await streamer.context.resume();
          streamer.isStreamComplete = false;
          const bytes = Uint8Array.from(atob(audioB64), c => c.charCodeAt(0));
          streamer.addPCM16(bytes);
          setTimeout(() => streamer.complete(), 500);
        }
      }
    } catch (e) {
      console.error("Response error:", e);
    } finally {
      setIsResponding(false);
    }
  }, [apiKey]);

  return {
    client,
    config,
    setConfig,
    connected,
    connect,
    disconnect,
    volume,
    latestResponse,
    isResponding,
    clearLatestResponse,
    sendTextAndGetResponse,
  };
}
