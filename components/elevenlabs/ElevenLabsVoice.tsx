"use client";

import { useCallback, useState } from "react";
import { Mic, Volume2, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

/**
 * ElevenLabs Voice Component
 * Provides text-to-speech and speech-to-text functionality using ElevenLabs API
 * 
 * This component can be used standalone or integrated into existing components
 */

interface ElevenLabsVoiceProps {
  onTranscriptReceived?: (text: string) => void;
  onSpeechComplete?: () => void;
  className?: string;
}

export default function ElevenLabsVoice({
  onTranscriptReceived,
  onSpeechComplete,
  className = "",
}: ElevenLabsVoiceProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);

  /**
   * Start recording audio from microphone
   */
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: "audio/wav" });
        await transcribeAudio(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setAudioChunks(chunks);
      setIsRecording(true);
      toast.success("Recording started");
    } catch (error) {
      console.error("Error starting recording:", error);
      toast.error("Failed to access microphone");
    }
  }, []);

  /**
   * Stop recording and process audio
   */
  const stopRecording = useCallback(() => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      setMediaRecorder(null);
    }
  }, [mediaRecorder, isRecording]);

  /**
   * Transcribe audio using ElevenLabs API
   */
  const transcribeAudio = useCallback(
    async (audioBlob: Blob) => {
      try {
        const formData = new FormData();
        formData.append("audio", audioBlob, "recording.wav");

        const response = await fetch("/api/voice/transcribe", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error("Transcription failed");
        }

        const { text } = await response.json();
        
        if (text?.trim()) {
          onTranscriptReceived?.(text.trim());
          toast.success("Transcription complete");
        } else {
          toast.error("No speech detected");
        }
      } catch (error) {
        console.error("Transcription error:", error);
        toast.error("Failed to transcribe audio");
      }
    },
    [onTranscriptReceived]
  );

  /**
   * Convert text to speech using ElevenLabs API
   */
  const speakText = useCallback(
    async (text: string) => {
      if (!text?.trim()) {
        toast.error("No text to speak");
        return;
      }

      try {
        setIsSpeaking(true);

        const response = await fetch("/api/voice/speak", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        });

        if (!response.ok) {
          throw new Error("Speech generation failed");
        }

        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);

        audio.onended = () => {
          URL.revokeObjectURL(audioUrl);
          setIsSpeaking(false);
          onSpeechComplete?.();
        };

        audio.onerror = () => {
          URL.revokeObjectURL(audioUrl);
          setIsSpeaking(false);
          toast.error("Failed to play audio");
        };

        await audio.play();
      } catch (error) {
        console.error("Speech error:", error);
        setIsSpeaking(false);
        toast.error("Failed to generate speech");
      }
    },
    [onSpeechComplete]
  );

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Recording Button */}
      <button
        type="button"
        onClick={isRecording ? stopRecording : startRecording}
        disabled={isSpeaking}
        className={`
          p-3 rounded-lg transition-all duration-300 
          flex items-center gap-2 font-medium
          disabled:opacity-50 disabled:cursor-not-allowed
          ${
            isRecording
              ? "bg-red-600 text-white hover:bg-red-700 animate-pulse"
              : "bg-blue-600 text-white hover:bg-blue-700"
          }
        `}
        aria-label={isRecording ? "Stop recording" : "Start recording"}
      >
        <Mic size={20} />
        <span className="text-sm">
          {isRecording ? "Stop" : "Record"}
        </span>
      </button>

      {/* Speaking Indicator */}
      {isSpeaking && (
        <div className="flex items-center gap-2 text-green-500">
          <Loader2 size={20} className="animate-spin" />
          <Volume2 size={20} className="animate-pulse" />
          <span className="text-sm">Speaking...</span>
        </div>
      )}
    </div>
  );
}

/**
 * Hook version for programmatic control
 */
export function useElevenLabsVoice() {
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const speakText = useCallback(async (text: string): Promise<void> => {
    if (!text?.trim()) return;

    try {
      setIsSpeaking(true);

      const response = await fetch("/api/voice/speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) throw new Error("Speech generation failed");

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);

      await new Promise<void>((resolve, reject) => {
        audio.onended = () => {
          URL.revokeObjectURL(audioUrl);
          setIsSpeaking(false);
          resolve();
        };
        audio.onerror = () => {
          URL.revokeObjectURL(audioUrl);
          setIsSpeaking(false);
          reject(new Error("Audio playback failed"));
        };
        audio.play().catch(reject);
      });
    } catch (error) {
      setIsSpeaking(false);
      throw error;
    }
  }, []);

  const transcribeAudio = useCallback(async (audioBlob: Blob): Promise<string> => {
    try {
      const formData = new FormData();
      formData.append("audio", audioBlob, "recording.wav");

      const response = await fetch("/api/voice/transcribe", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Transcription failed");

      const { text } = await response.json();
      return text?.trim() || "";
    } catch (error) {
      console.error("Transcription error:", error);
      throw error;
    }
  }, []);

  return {
    speakText,
    transcribeAudio,
    isRecording,
    isSpeaking,
    setIsRecording,
  };
}
