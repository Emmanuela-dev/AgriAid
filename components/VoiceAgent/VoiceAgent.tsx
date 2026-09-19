"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useConversation } from "@elevenlabs/react";
import { Mic, MicOff, Loader2, AlertCircle } from "lucide-react";
import "./VoiceAgent.css";

/**
 * AgroVoice - Voice Agent Component
 * 
 * Connects to ElevenLabs Conversational AI Agent
 * Handles microphone access, connection state, and conversation flow
 * 
 * @param agentId - ElevenLabs Agent ID (from env or props)
 * @param onTranscriptReceived - Optional callback for when user speaks
 * @param onAgentResponse - Optional callback for agent responses
 * @param className - Optional additional CSS classes
 */

interface VoiceAgentProps {
  agentId?: string;
  onTranscriptReceived?: (text: string) => void;
  onAgentResponse?: (text: string) => void;
  className?: string;
}

type ConnectionStatus = "idle" | "connecting" | "connected" | "error";

export default function VoiceAgent({
  agentId: propAgentId,
  onTranscriptReceived,
  onAgentResponse,
  className = "",
}: VoiceAgentProps) {
  const AGENT_ID = propAgentId || (typeof window !== "undefined" ? (import.meta.env?.VITE_ELEVENLABS_AGENT_ID || process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID) : undefined);

  const [status, setStatus] = useState<ConnectionStatus>("idle");
  const [error, setError] = useState<string>("");
  const [isListening, setIsListening] = useState(false);
  const conversationStartedRef = useRef(false);

  // ElevenLabs Conversational AI hook
  const conversation = useConversation({
    onConnect: () => {
      console.log("AgroVoice connected");
      setStatus("connected");
      setIsListening(true);
      setError("");
    },
    onDisconnect: () => {
      console.log("AgroVoice disconnected");
      setStatus("idle");
      setIsListening(false);
      conversationStartedRef.current = false;
    },
    onError: (error) => {
      console.error("AgroVoice error:", error);
      setStatus("error");
      setError(getErrorMessage(error));
      conversationStartedRef.current = false;
    },
    onMessage: (message) => {
      // Handle incoming messages from the agent
      console.log("AgroVoice message:", message);
      
      // If it's a user transcript
      if (message.source === "user" && message.message) {
        onTranscriptReceived?.(message.message);
      }
      
      // If it's an agent response
      if (message.source === "ai" && message.message) {
        onAgentResponse?.(message.message);
      }
    },
  });

  /**
   * Request microphone permission and start conversation
   */
  const startConversation = useCallback(async () => {
    // Prevent multiple simultaneous connections
    if (conversationStartedRef.current || status === "connecting" || status === "connected") {
      console.warn("Conversation already started or in progress");
      return;
    }

    // Validate Agent ID
    if (!AGENT_ID) {
      setStatus("error");
      setError("Agent ID is not configured. Please add NEXT_PUBLIC_ELEVENLABS_AGENT_ID to your environment variables.");
      return;
    }

    try {
      setStatus("connecting");
      setError("");
      conversationStartedRef.current = true;

      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Clean up the test stream
      stream.getTracks().forEach(track => track.stop());

      // Start the ElevenLabs conversation
      await conversation.startSession({
        agentId: AGENT_ID,
      });

    } catch (err: unknown) {
      conversationStartedRef.current = false;
      setStatus("error");
      
      if (err instanceof Error) {
        // Handle specific errors
        if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
          setError("We couldn't access your microphone. Please allow microphone access and try again.");
        } else if (err.name === "NotFoundError") {
          setError("No microphone found. Please connect a microphone and try again.");
        } else if (err.name === "NotSupportedError") {
          setError("Your browser doesn't support microphone access. Please use a modern browser like Chrome or Firefox.");
        } else {
          setError("Failed to start conversation. Please try again.");
        }
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
      
      console.error("Failed to start conversation:", err);
    }
  }, [AGENT_ID, conversation, status]);

  /**
   * End the conversation and clean up
   */
  const endConversation = useCallback(async () => {
    try {
      await conversation.endSession();
      setStatus("idle");
      setIsListening(false);
      conversationStartedRef.current = false;
      setError("");
    } catch (err) {
      console.error("Failed to end conversation:", err);
      // Force reset even if there's an error
      setStatus("idle");
      setIsListening(false);
      conversationStartedRef.current = false;
    }
  }, [conversation]);

  /**
   * Clean up on unmount
   */
  useEffect(() => {
    return () => {
      if (conversationStartedRef.current) {
        conversation.endSession().catch(console.error);
      }
    };
  }, [conversation]);

  /**
   * Render connection status indicator
   */
  const renderStatusIndicator = () => {
    switch (status) {
      case "connecting":
        return (
          <div className="agrovoice-status agrovoice-status-connecting">
            <Loader2 className="agrovoice-spinner" size={20} />
            <span>Connecting to AgroVoice...</span>
          </div>
        );
      
      case "connected":
        return (
          <div className="agrovoice-status agrovoice-status-connected">
            <div className="agrovoice-pulse-indicator">
              <Mic size={48} className="agrovoice-mic-icon" />
            </div>
            <h3 className="agrovoice-title">AgroVoice is listening</h3>
            <p className="agrovoice-subtitle">Speak naturally in your language...</p>
            <button
              onClick={endConversation}
              className="agrovoice-button agrovoice-button-end"
              type="button"
            >
              End Call
            </button>
          </div>
        );
      
      case "error":
        return (
          <div className="agrovoice-status agrovoice-status-error">
            <AlertCircle size={48} className="agrovoice-error-icon" />
            <h3 className="agrovoice-error-title">Connection Error</h3>
            <p className="agrovoice-error-message">{error}</p>
            <button
              onClick={() => {
                setStatus("idle");
                setError("");
              }}
              className="agrovoice-button agrovoice-button-retry"
              type="button"
            >
              Try Again
            </button>
          </div>
        );
      
      default: // idle
        return (
          <div className="agrovoice-status agrovoice-status-idle">
            <div className="agrovoice-icon-container">
              <Mic size={64} className="agrovoice-mic-icon-large" />
            </div>
            <h3 className="agrovoice-title">Talk to AgroVoice</h3>
            <p className="agrovoice-subtitle">
              Ask about crops, soil, weather, or farming practices.
            </p>
            <button
              onClick={startConversation}
              className="agrovoice-button agrovoice-button-start"
              type="button"
            >
              <Mic size={20} />
              Start Conversation
            </button>
          </div>
        );
    }
  };

  return (
    <div className={`agrovoice-container ${className}`}>
      <div className="agrovoice-card">
        {renderStatusIndicator()}
      </div>
    </div>
  );
}

/**
 * Helper function to extract user-friendly error messages
 */
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    if (error.message.includes("permission") || error.message.includes("denied")) {
      return "We couldn't access your microphone. Please allow microphone access and try again.";
    }
    if (error.message.includes("network") || error.message.includes("connection")) {
      return "Network connection failed. Please check your internet and try again.";
    }
    if (error.message.includes("agent")) {
      return "Could not connect to AgroVoice. Please try again later.";
    }
    return error.message;
  }
  return "An unexpected error occurred. Please try again.";
}
