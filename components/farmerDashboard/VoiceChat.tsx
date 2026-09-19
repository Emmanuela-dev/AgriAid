import { useEffect, useRef, useState, useCallback } from "react";
import { useConversation } from "@elevenlabs/react";
import { Mic, Download, Loader2, X, Volume2 } from "lucide-react";

const AGENT_ID = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID;
if (!AGENT_ID) {
  console.warn("NEXT_PUBLIC_ELEVENLABS_AGENT_ID not configured. VoiceChat will show setup instructions.");
}

const formatTimestamp = () =>
  new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);

type ConversationMessage = {
  id: string;
  role: "farmer" | "assistant";
  text: string;
  createdAt: string;
  pending?: boolean;
};

const CHAT_STORAGE_KEY = "agriaid_voice_chat_history";

const formatTime = (isoDate: string) =>
  new Date(isoDate).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

type ConnectionStatus = "idle" | "connecting" | "connected" | "disconnected" | "error";

function VoiceChatSurface() {
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [minimized, setMinimized] = useState(false);
  const [status, setStatus] = useState<ConnectionStatus>("idle");
  const [error, setError] = useState<string>("");
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const conversationStartedRef = useRef(false);

  // ElevenLabs Conversation Hook
  const conversation = useConversation({
    onConnect: () => {
      console.log("ElevenLabs connected");
      setStatus("connected");
      setError("");
    },
    onDisconnect: () => {
      console.log("ElevenLabs disconnected");
      setStatus("disconnected");
      conversationStartedRef.current = false;
    },
    onError: (error) => {
      console.error("ElevenLabs error:", error);
      setStatus("error");
      setError(getErrorMessage(error));
      conversationStartedRef.current = false;
    },
    onMessage: (message) => {
      console.log("ElevenLabs message:", message);
      
      const createdAt = new Date().toISOString();
      
      // Handle user message
      if (message.source === "user" && message.message) {
        setMessages((current) => [
          ...current,
          {
            id: `farmer-${Date.now()}`,
            role: "farmer",
            text: message.message,
            createdAt,
          },
        ]);
      }
      
      // Handle AI response
      if (message.source === "ai" && message.message) {
        setMessages((current) => {
          // Check if last message is from assistant
          const lastMsg = current[current.length - 1];
          if (lastMsg && lastMsg.role === "assistant") {
            // Update existing assistant message
            return [
              ...current.slice(0, -1),
              {
                ...lastMsg,
                text: lastMsg.text + " " + message.message,
              },
            ];
          } else {
            // Create new assistant message
            return [
              ...current,
              {
                id: `assistant-${Date.now()}`,
                role: "assistant",
                text: message.message,
                createdAt,
              },
            ];
          }
        });
      }
    },
  });

  // Load chat history from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(CHAT_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as ConversationMessage[];
      if (Array.isArray(parsed)) {
        setMessages(parsed.filter((m) => m && m.id && m.role));
      }
    } catch (error) {
      console.error("Failed to restore chat history:", error);
    }
  }, []);

  // Save chat history to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
    } catch (error) {
      console.error("Failed to persist chat history:", error);
    }
  }, [messages]);

  // Auto-scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (conversationStartedRef.current) {
        conversation.endSession().catch(console.error);
      }
    };
  }, [conversation]);

  const startConversation = useCallback(async () => {
    if (conversationStartedRef.current || status === "connecting" || status === "connected") {
      console.warn("Conversation already started or in progress");
      return;
    }

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
      stream.getTracks().forEach(track => track.stop());

      // Start ElevenLabs conversation
      await conversation.startSession({
        agentId: AGENT_ID,
      });

    } catch (err: unknown) {
      conversationStartedRef.current = false;
      setStatus("error");
      
      if (err instanceof Error) {
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
  }, [conversation, status]);

  const endConversation = useCallback(async () => {
    try {
      await conversation.endSession();
      setStatus("idle");
      conversationStartedRef.current = false;
      setError("");
    } catch (err) {
      console.error("Failed to end conversation:", err);
      setStatus("idle");
      conversationStartedRef.current = false;
    }
  }, [conversation]);
  const saveRecommendationDocument = (content: string) => {
    if (!content.trim()) return;
    import("jspdf").then(({ jsPDF }) => {
      const doc = new jsPDF({ unit: "mm", format: "a4" });
      const margin = 15;
      const pageWidth = doc.internal.pageSize.getWidth();
      const maxWidth = pageWidth - margin * 2;

      // header
      doc.setFillColor(34, 197, 94);
      doc.rect(0, 0, pageWidth, 22, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("AgriAid Recommendation", margin, 14);

      // date
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text(new Date().toLocaleString(), pageWidth - margin, 14, { align: "right" });

      // body
      doc.setTextColor(30, 30, 30);
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      const lines = doc.splitTextToSize(content, maxWidth);
      let y = 32;
      lines.forEach((line: string) => {
        if (y > doc.internal.pageSize.getHeight() - margin) {
          doc.addPage();
          y = margin;
        }
        doc.text(line, margin, y);
        y += 6;
      });

      doc.save(`agriaid-recommendation-${formatTimestamp()}.pdf`);
    });
  };

  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    setIsOffline(!navigator.onLine);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const getStatusText = () => {
    switch (status) {
      case "connecting":
        return "Connecting...";
      case "connected":
        return "Listening";
      case "error":
        return "Error";
      default:
        return "Ready";
    }
  };

  return (
    <div className="fixed left-4 right-4 bottom-4 z-50">
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.5fr)_minmax(340px,0.9fr)] gap-4 items-end">

        {/* Chat panel */}
        <div className="bg-white/95 backdrop-blur rounded-2xl border border-green-100 shadow-xl">
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3 cursor-pointer select-none"
            onClick={() => setMinimized((v) => !v)}
          >
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-gray-900">AgroVoice Conversation</h3>
              {isOffline && (
                <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded border border-amber-200 animate-pulse">
                  OFFLINE
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs px-2 py-1 rounded-full border ${
                status === "connected" 
                  ? "border-green-200 bg-green-50 text-green-700"
                  : status === "error"
                  ? "border-red-200 bg-red-50 text-red-700"
                  : "border-gray-200 bg-gray-50 text-gray-700"
              }`}>
                {getStatusText()}
              </span>
              <span className="text-gray-400 text-lg leading-none">{minimized ? "▲" : "▼"}</span>
            </div>
          </div>

          {/* Collapsible body */}
          {!minimized && (
            <div className="px-4 pb-4">
              <div className="h-[38vh] overflow-y-auto space-y-3 mb-3">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`max-w-[92%] rounded-xl px-3 py-2 text-sm whitespace-pre-wrap ${
                      message.role === "farmer"
                        ? "ml-auto bg-blue-50 text-blue-900 border border-blue-100"
                        : "mr-auto bg-green-50 text-green-900 border border-green-100"
                    }`}
                  >
                    <p className="text-[11px] font-semibold uppercase opacity-70 mb-1">
                      {message.role === "farmer" ? "Farmer" : "AgroVoice"}
                    </p>
                    {message.text}
                    <p className="text-[10px] opacity-60 mt-2 text-right">
                      {formatTime(message.createdAt)}
                    </p>
                  </div>
                ))}

                {!messages.length && status === "idle" && (
                  <p className="text-xs text-gray-500">
                    Click "Start Conversation" below to begin talking with AgroVoice.
                  </p>
                )}

                {status === "error" && error && (
                  <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-sm text-red-900">
                    <p className="font-semibold mb-1">Error</p>
                    {error}
                  </div>
                )}

                <div ref={chatEndRef} />
              </div>

              <div className="flex items-center justify-between gap-3 flex-wrap">
                <p className="text-xs text-gray-500">Powered by ElevenLabs Conversational AI</p>
                <button
                  type="button"
                  onClick={() => {
                    const allText = messages.map(m => m.text).join("\n\n");
                    saveRecommendationDocument(allText);
                  }}
                  disabled={!messages.length}
                  className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Download size={16} />
                  Download Chat
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Control Panel */}
        <div className="bg-gray-900/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-800/50 p-4 flex flex-col items-center space-y-4 ring-1 ring-white/10 h-fit">
          <div className="text-center">
            <h2 className="text-base font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-emerald-600">
              AgroVoice
            </h2>
            <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400">
              {status === "connected" ? "Listening..." : "Voice Assistant"}
            </p>
          </div>

          {status === "connected" && (
            <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center animate-pulse">
              <Volume2 className="text-white" size={32} />
            </div>
          )}

          {status === "connecting" && (
            <div className="w-16 h-16 flex items-center justify-center">
              <Loader2 className="text-green-500 animate-spin" size={32} />
            </div>
          )}

          {(status === "idle" || status === "disconnected" || status === "error") && (
            <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center">
              <Mic className="text-gray-300" size={32} />
            </div>
          )}

          <div className="flex flex-col gap-2 w-full">
            {status === "connected" ? (
              <button
                onClick={endConversation}
                className="w-full px-4 py-3 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium transition-colors flex items-center justify-center gap-2"
              >
                <X size={20} />
                End Conversation
              </button>
            ) : (
              <button
                onClick={startConversation}
                disabled={status === "connecting"}
                className="w-full px-4 py-3 rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Mic size={20} />
                {status === "connecting" ? "Connecting..." : "Start Conversation"}
              </button>
            )}
          </div>

          <p className="text-xs text-gray-400 text-center">
            {status === "connected"
              ? "Speak naturally, I'm listening..."
              : status === "connecting"
              ? "Establishing connection..."
              : "Click to start talking with AgroVoice"}
          </p>
        </div>
      </div>
    </div>
  );
}

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

const VoiceChat = () => {
  return (
    <div>
      <VoiceChatSurface />
    </div>
  );
};

export default VoiceChat;
