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
  latestUserTranscript: string;
  detectedInputLanguage: string;
  isResponding: boolean;
  clearLatestResponse: () => void;
  clearLatestUserTranscript: () => void;
  sendTextAndGetResponse: (text: string, preferredLanguage?: string) => Promise<void>;
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
  const [latestUserTranscript, setLatestUserTranscript] = useState("");
  const [detectedInputLanguage, setDetectedInputLanguage] = useState("Auto");
  const [isResponding, setIsResponding] = useState(false);
  const [config, setConfig] = useState<LiveConfig>({
    model: "models/gemini-2.5-flash-native-audio-latest",
    inputAudioTranscription: {},
    outputAudioTranscription: {},
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
          text: `You are AgriAid, a farming assistant for Kenyan farmers. Be direct and concise. No thinking out loud, no meta-commentary, no "I am analyzing" phrases. Just answer the question immediately and clearly. Give practical bullet points when listing steps. You know all 47 Kenyan counties, their climates, soils, and suitable crops. Detect the farmer's language and respond in that same language. Supported languages include English, Kiswahili, Kikuyu, Luo, Luhya, Kamba, Kalenjin, Meru, Mijikenda, Somali, Maasai, Turkana, Kisii, and any other Kenyan language or dialect - always match whatever language the farmer speaks.`,
        },
      ],
    },
  });
  const [volume, setVolume] = useState(0);

  const detectLanguageFromText = useCallback(
    async (text: string) => {
      if (!text.trim()) {
        return "same language as the farmer's input";
      }

      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                {
                  role: "user",
                  parts: [
                    {
                      text: `Identify the language of this farmer text. Return strict JSON only with keys: language, confidence. Text: ${text}`,
                    },
                  ],
                },
              ],
            }),
          },
        );

        const data = await res.json();
        const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
        const parsed = JSON.parse(raw);
        const language =
          typeof parsed?.language === "string" ? parsed.language.trim() : "";

        if (language) {
          setDetectedInputLanguage(language);
          return language;
        }
      } catch (error) {
        console.error("Language detection error:", error);
      }

      return "same language as the farmer's input";
    },
    [apiKey],
  );

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
      const incomingUserTranscript =
        data.inputTranscription?.text ||
        data.input_transcription?.text ||
        data.serverContent?.inputTranscription?.text ||
        data.serverContent?.input_transcription?.text ||
        "";
      if (incomingUserTranscript) {
        setLatestUserTranscript(incomingUserTranscript.trim());
      }

      const parts = data.modelTurn?.parts || [];
      const text = parts.map((p: any) => p.text || "").join("").trim();
      if (text) {
        setLatestResponse((current) => (current ? `${current} ${text}` : text));
      }

      const transcript =
        data.outputTranscription?.text ||
        data.output_transcription?.text ||
        data.serverContent?.outputTranscription?.text ||
        data.serverContent?.output_transcription?.text ||
        "";
      if (transcript) {
        setLatestResponse((current) =>
          current ? `${current} ${transcript}` : transcript,
        );
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

  useEffect(() => {
    if (!latestUserTranscript.trim()) {
      setDetectedInputLanguage("Auto");
      return;
    }

    const timeoutId = window.setTimeout(() => {
      detectLanguageFromText(latestUserTranscript);
    }, 350);

    return () => window.clearTimeout(timeoutId);
  }, [latestUserTranscript, detectLanguageFromText]);

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

  const clearLatestUserTranscript = useCallback(() => {
    setLatestUserTranscript("");
    setDetectedInputLanguage("Auto");
  }, []);

  const sendTextAndGetResponse = useCallback(
    async (text: string, preferredLanguage?: string) => {
      setLatestResponse("");
      setIsResponding(true);
      try {
        const resolvedLanguage =
          preferredLanguage && preferredLanguage.trim().length > 0
            ? preferredLanguage
            : await detectLanguageFromText(text);

        if (
          resolvedLanguage &&
          resolvedLanguage !== "same language as the farmer's input"
        ) {
          setDetectedInputLanguage(resolvedLanguage);
        }

        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              system_instruction: {
                parts: [
                  {
                    text: `You are AgriAid, a farming assistant for Kenyan farmers. Be direct and concise. No meta-commentary. Give practical bullet points. You know all 47 Kenyan counties, their climates, soils, and suitable crops. Reply in exactly this language: ${resolvedLanguage}. If the user's text mixes languages, prioritize the dominant language used by the farmer.`,
                  },
                ],
              },
              contents: [{ role: "user", parts: [{ text }] }],
            }),
          },
        );
        const data = await res.json();
        const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
        setLatestResponse(responseText);

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
                  speechConfig: {
                    voiceConfig: { prebuiltVoiceConfig: { voiceName: "Aoede" } },
                  },
                },
              }),
            },
          );
          const ttsData = await ttsRes.json();
          const audioB64 =
            ttsData.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
          if (audioB64 && audioStreamerRef.current) {
            const streamer = audioStreamerRef.current;
            if (streamer.context.state === "suspended") {
              await streamer.context.resume();
            }
            streamer.isStreamComplete = false;
            const bytes = Uint8Array.from(atob(audioB64), (c) => c.charCodeAt(0));
            streamer.addPCM16(bytes);
            setTimeout(() => streamer.complete(), 500);
          }
        }
      } catch (e) {
        console.error("Response error:", e);
      } finally {
        setIsResponding(false);
      }
    },
    [apiKey, detectLanguageFromText],
  );

  return {
    client,
    config,
    setConfig,
    connected,
    connect,
    disconnect,
    volume,
    latestResponse,
    latestUserTranscript,
    detectedInputLanguage,
    isResponding,
    clearLatestResponse,
    clearLatestUserTranscript,
    sendTextAndGetResponse,
  };
}
