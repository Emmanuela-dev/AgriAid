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
    model: "models/gemini-2.0-flash-live-001",
    generationConfig: {
      responseModalities: ["AUDIO", "TEXT"],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: {
            voiceName: "Aoede",
          },
        },
      },
    },
    systemInstruction: {
      parts: [
        {
          text: `You are AgriAid, a powerful, professional, and friendly multilingual agricultural assistant. 
          Your mission is to empower farmers worldwide with real-time, accurate, and actionable agricultural advice.
          
          Key Capabilities:
          1. Multilingual Communication: You MUST detect the user's language automatically and respond fluently in that same language. Supported languages include English, Swahili, French, Spanish, Hindi, Odia, and any other regional dialects.
          2. Expert Advice: Provide information on weather forecasts, crop recommendations, soil health, market prices, and government schemes.
          3. Accessibility: Use simple, clear language that is easy for farmers (including those who are semi-literate) to understand.
          4. Empathy: Be encouraging and supportive of the challenges farmers face.
          
          Always start by greeting the user and asking how you can help them with their farming today. If they speak in a specific language, switch to that language immediately.`
        }
      ]
    }
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

    const onAudio = (data: ArrayBuffer) =>
      audioStreamerRef.current?.addPCM16(new Uint8Array(data));

    const onContent = (data: { modelTurn?: { parts?: Array<{ text?: string }> } }) => {
      const parts = data.modelTurn?.parts || [];
      const text = parts
        .map((part) => part.text || "")
        .join("")
        .trim();

      if (text) {
        setLatestResponse((current) => {
          if (!current) {
            return text;
          }

          return `${current}\n${text}`;
        });
        setIsResponding(true);
      }
    };

    const onTurnComplete = () => {
      setIsResponding(false);
    };

    client
      .on("close", onClose)
      .on("interrupted", stopAudioStreamer)
      .on("audio", onAudio)
      .on("content", onContent as never)
      .on("turncomplete", onTurnComplete);

    return () => {
      client
        .off("close", onClose)
        .off("interrupted", stopAudioStreamer)
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
  };
}
