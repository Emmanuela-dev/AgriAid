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
  const refusalMessage =
    "Sorry, but AgriAid only provides agricultural solutions only. Please ask your agriculture question.";
  const client = useMemo(
    () => new MultimodalLiveClient({ url, apiKey }),
    [url, apiKey],
  );
  const audioStreamerRef = useRef<AudioStreamer | null>(null);
  const reconnectTimerRef = useRef<number | null>(null);
  const isConnectingRef = useRef(false);
  const shouldReconnectRef = useRef(false);

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
          text: `You are AgriAid, a farming assistant for Kenyan farmers. Be direct and concise. No thinking out loud, no meta-commentary, no "I am analyzing" phrases. Just answer the question immediately and clearly. Give practical bullet points when listing steps. You know all 47 Kenyan counties, their climates, soils, and suitable crops. Only respond to agricultural, farming, livestock, crop, soil, weather-for-farming, pest, fertilizer, irrigation, and Kenyan agriculture questions. If the user asks anything outside agriculture, refuse politely with: "Sorry, but AgriAid only provides agricultural solutions only. Please ask your agriculture question." Detect the farmer's language and respond in that same language. When speaking audio, use authentic local pronunciation, rhythm, and intonation of the detected language. For Luo (Dholuo), pronounce words using native Dholuo phonology and avoid English-like pronunciation. For Kikuyu (Gikuyu), use natural Gikuyu pronunciation and tone patterns. For Kisii (Ekegusii), use Ekegusii pronunciation without anglicizing vowels or consonants. For Kalenjin, use natural Kalenjin pronunciation and cadence. For Luhya/Luya, use natural Luhya pronunciation and cadence. Supported languages include English, Kiswahili, Kikuyu, Luo, Luhya, Luya, Kamba, Kalenjin, Meru, Mijikenda, Somali, Maasai, Turkana, Kisii, and any other Kenyan language or dialect - always match whatever language the farmer speaks.`,
        },
      ],
    },
  });
  const configRef = useRef(config);
  const [volume, setVolume] = useState(0);

  useEffect(() => {
    configRef.current = config;
  }, [config]);

  const clearReconnectTimer = useCallback(() => {
    if (reconnectTimerRef.current) {
      window.clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
  }, []);

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
              generationConfig: {
                responseMimeType: "application/json",
              },
              contents: [
                {
                  role: "user",
                  parts: [
                    {
                      text: `Identify the language of this farmer text. Return strict JSON only with keys: language, confidence. Use the most specific Kenyan language name possible, such as Luo, Kikuyu, Kisii, Kalenjin, Luhya, Luya, or Kiswahili. Text: ${text}`,
                    },
                  ],
                },
              ],
            }),
          },
        );

        const data = await res.json();
        const raw = (data.candidates?.[0]?.content?.parts?.[0]?.text || "").trim();

        if (!raw) {
          return "same language as the farmer's input";
        }

        let parsed: any = null;
        try {
          parsed = JSON.parse(raw);
        } catch {
          // Some model responses may include JSON wrapped in markdown fences.
          const fencedMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
          const candidate = fencedMatch?.[1]?.trim() || raw;
          try {
            parsed = JSON.parse(candidate);
          } catch {
            parsed = null;
          }
        }

        if (!parsed || typeof parsed !== "object") {
          return "same language as the farmer's input";
        }

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

  const isAgriculturalQuestion = useCallback(
    async (text: string) => {
      const agriculturalKeywords = /\b(farm|farming|farmer|crop|crops|soil|soils|seed|seeds|plant|planting|grow|growing|harvest|harvesting|fertilizer|manure|pest|pests|disease|diseases|irrigation|livestock|cattle|goat|goats|sheep|poultry|chicken|maize|beans|tea|coffee|banana|bananas|avocado|avocados|tomato|tomatoes|kale|sukuma|spinach|weather|rain|rainfall|county|yield|spray|spraying|greenhouse)\b/i;

      if (agriculturalKeywords.test(text)) {
        return true;
      }

      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              generationConfig: {
                responseMimeType: "application/json",
              },
              contents: [
                {
                  role: "user",
                  parts: [
                    {
                      text: `Classify whether this user message is an agricultural question. Return strict JSON only with keys: agricultural, confidence. agricultural must be true only for farming, crops, soil, livestock, pests, fertilizer, irrigation, weather-for-farming, or other Kenyan agriculture topics. Text: ${text}`,
                    },
                  ],
                },
              ],
            }),
          },
        );

        const data = await res.json();
        const raw = (data.candidates?.[0]?.content?.parts?.[0]?.text || "").trim();
        if (!raw) return false;

        let parsed: any = null;
        try {
          parsed = JSON.parse(raw);
        } catch {
          const fencedMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
          const candidate = fencedMatch?.[1]?.trim() || raw;
          try {
            parsed = JSON.parse(candidate);
          } catch {
            parsed = null;
          }
        }

        return Boolean(parsed?.agricultural);
      } catch (error) {
        console.error("Agriculture classification error:", error);
        return false;
      }
    },
    [apiKey],
  );

  const speakTextViaTTS = useCallback(
    async (text: string, voiceName: string = "Aoede") => {
      if (!audioStreamerRef.current || !text.trim()) return;

      const ttsRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text }] }],
            generationConfig: {
              responseModalities: ["AUDIO"],
              speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName } },
              },
            },
          }),
        },
      );

      const ttsData = await ttsRes.json();
      const audioB64 = ttsData.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (!audioB64 || !audioStreamerRef.current) return;

      const streamer = audioStreamerRef.current;
      if (streamer.context.state === "suspended") {
        await streamer.context.resume();
      }
      streamer.isStreamComplete = false;
      const bytes = Uint8Array.from(atob(audioB64), (c) => c.charCodeAt(0));
      streamer.addPCM16(bytes);
      setTimeout(() => streamer.complete(), 500);
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

      if (!shouldReconnectRef.current) {
        return;
      }

      clearReconnectTimer();
      reconnectTimerRef.current = window.setTimeout(async () => {
        if (isConnectingRef.current || !shouldReconnectRef.current) {
          return;
        }

        try {
          isConnectingRef.current = true;
          await client.connect(configRef.current);
          setConnected(true);
        } catch (error) {
          console.error("Reconnect failed:", error);
        } finally {
          isConnectingRef.current = false;
        }
      }, 1000);
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
      clearReconnectTimer();
      client
        .off("close", onClose)
        .off("interrupted", onInterrupted)
        .off("audio", onAudio)
        .off("content", onContent as never)
        .off("turncomplete", onTurnComplete);
    };
  }, [client, clearReconnectTimer]);

  const connect = useCallback(async () => {
    if (!configRef.current) {
      throw new Error("config has not been set");
    }

    shouldReconnectRef.current = true;
    clearReconnectTimer();

    if (isConnectingRef.current) {
      return;
    }

    if (client.ws?.readyState === WebSocket.OPEN) {
      setConnected(true);
      return;
    }

    isConnectingRef.current = true;
    try {
      await client.connect(configRef.current);
      setConnected(true);
    } finally {
      isConnectingRef.current = false;
    }
  }, [client, clearReconnectTimer, setConnected]);

  const disconnect = useCallback(async () => {
    shouldReconnectRef.current = false;
    clearReconnectTimer();
    client.disconnect();
    setConnected(false);
  }, [clearReconnectTimer, setConnected, client]);

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
        const agricultural = await isAgriculturalQuestion(text);
        if (!agricultural) {
          setLatestResponse(refusalMessage);
          await speakTextViaTTS(refusalMessage);
          return;
        }

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

        const liveSocketReady =
          connected && client.ws?.readyState === WebSocket.OPEN;

        if (liveSocketReady) {
          try {
            client.send(
              {
                text: `Respond only in ${resolvedLanguage}. When speaking, use authentic native ${resolvedLanguage} accent and pronunciation used by local Kenyan speakers. Do not anglicize pronunciations. Farmer question: ${text}`,
              },
              true,
            );
            return;
          } catch (liveSendError) {
            console.error("Live send failed, using fallback:", liveSendError);
          }
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
                    text: `You are AgriAid, a farming assistant for Kenyan farmers. Be direct and concise. No meta-commentary. Give practical bullet points. You know all 47 Kenyan counties, their climates, soils, and suitable crops. Reply in exactly this language: ${resolvedLanguage}. If the user's text mixes languages, prioritize the dominant language used by the farmer. When speaking audio, use native pronunciation for ${resolvedLanguage}. Do not anglicize local words. If ${resolvedLanguage} is Luhya or Luya, use natural Luhya/Luya pronunciation and cadence.`,
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

        if (responseText) {
          await speakTextViaTTS(responseText);
        }
      } catch (e) {
        console.error("Response error:", e);
      } finally {
        setIsResponding(false);
      }
    },
    [client, connected, detectLanguageFromText, isAgriculturalQuestion, speakTextViaTTS],
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
