"use client";

import { useState } from "react";
import { useElevenLabsVoice } from "./ElevenLabsVoice";
import { Mic, Volume2, Send } from "lucide-react";
import toast from "react-hot-toast";

/**
 * Demo component showing how to integrate ElevenLabs voice with a chat interface
 * This can be used as a reference for integrating into your soil-agent or other features
 */
export default function VoiceAssistantDemo() {
  const [inputText, setInputText] = useState("");
  const [conversation, setConversation] = useState<
    Array<{ role: "user" | "assistant"; content: string }>
  >([]);
  const { speakText, transcribeAudio, isSpeaking } = useElevenLabsVoice();
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);

  /**
   * Handle text submission (manual typing)
   */
  const handleSubmit = async (text: string) => {
    if (!text.trim()) return;

    // Add user message to conversation
    setConversation((prev) => [...prev, { role: "user", content: text }]);
    setInputText("");

    // Here you would normally call your AI backend
    // For demo, we'll just echo with a response
    const response = `I heard you say: "${text}". This is where your AgriAid AI response would appear.`;

    // Add assistant response
    setConversation((prev) => [...prev, { role: "assistant", content: response }]);

    // Speak the response
    try {
      await speakText(response);
    } catch (error) {
      console.error("Failed to speak response:", error);
    }
  };

  /**
   * Start voice recording
   */
  const startRecording = async () => {
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
        stream.getTracks().forEach((track) => track.stop());

        try {
          const transcribedText = await transcribeAudio(audioBlob);
          if (transcribedText) {
            setInputText(transcribedText);
            toast.success("Transcription complete!");
            // Optionally auto-submit
            // await handleSubmit(transcribedText);
          } else {
            toast.error("No speech detected");
          }
        } catch (error) {
          toast.error("Transcription failed");
        }
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      toast.success("Recording started");
    } catch (error) {
      console.error("Error starting recording:", error);
      toast.error("Microphone access denied");
    }
  };

  /**
   * Stop voice recording
   */
  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      setMediaRecorder(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            AgriAid Voice Assistant
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Powered by ElevenLabs
          </p>
        </div>

        {/* Conversation Area */}
        <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
          {conversation.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Volume2 size={48} className="mx-auto mb-4 opacity-50" />
              <p>Start a conversation by typing or recording your question</p>
            </div>
          ) : (
            conversation.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-3 ${
                    message.role === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white"
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                </div>
              </div>
            ))
          )}

          {isSpeaking && (
            <div className="flex justify-start">
              <div className="bg-green-100 dark:bg-green-900/30 border border-green-500/30 rounded-lg px-4 py-3 flex items-center gap-2">
                <Volume2 size={16} className="text-green-600 animate-pulse" />
                <span className="text-sm text-green-700 dark:text-green-400">
                  Speaking...
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-800">
          <div className="flex items-end gap-3">
            {/* Text Input */}
            <div className="flex-1">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(inputText);
                  }
                }}
                placeholder="Type your question or record your voice..."
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={2}
              />
            </div>

            {/* Voice Record Button */}
            <button
              type="button"
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isSpeaking}
              className={`p-3 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${
                isRecording
                  ? "bg-red-600 hover:bg-red-700 text-white animate-pulse"
                  : "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200"
              }`}
              aria-label={isRecording ? "Stop recording" : "Start recording"}
            >
              <Mic size={24} />
            </button>

            {/* Submit Button */}
            <button
              type="button"
              onClick={() => handleSubmit(inputText)}
              disabled={!inputText.trim() || isSpeaking}
              className="p-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Send message"
            >
              <Send size={24} />
            </button>
          </div>

          {isRecording && (
            <p className="text-xs text-red-500 mt-2 animate-pulse">
              🔴 Recording... Click the microphone again to stop
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
