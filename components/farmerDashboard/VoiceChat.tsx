"use client";

import { useEffect, useRef, useState } from "react";
import { ConversationProvider, useConversation } from "@elevenlabs/react";
import { Mic, Download, Phone, PhoneOff, Settings } from "lucide-react";

const AGENT_ID = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID;

const formatTimestamp = () =>
  new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);

type ConversationMessage = {
  id: string;
  role: "farmer" | "assistant";
  text: string;
  createdAt: string;
};

const CHAT_STORAGE_KEY = "agriaid_voice_chat_history";

const formatTime = (isoDate: string) =>
  new Date(isoDate).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

// Inner component that uses the conversation hook
function VoiceInterface() {
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [minimized, setMinimized] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const [isMounted, setIsMounted] = useState(false);
  const [micPermission, setMicPermission] = useState<'prompt' | 'granted' | 'denied' | 'unsupported'>('prompt');
  const [showPermissionPrompt, setShowPermissionPrompt] = useState(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Check browser support and microphone permission on mount
  useEffect(() => {
    setIsMounted(true);
    
    const checkMicrophoneAccess = async () => {
      if (typeof window === 'undefined') return;
      
      console.log('Checking microphone access...');
      console.log('navigator.mediaDevices:', navigator.mediaDevices);
      console.log('getUserMedia available:', !!navigator.mediaDevices?.getUserMedia);
      console.log('isSecureContext:', window.isSecureContext);
      console.log('location.protocol:', window.location.protocol);
      console.log('location.hostname:', window.location.hostname);
      
      // Check if browser supports getUserMedia
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error('Browser does not support getUserMedia');
        setMicPermission('unsupported');
        return;
      }

      console.log('getUserMedia is supported!');

      // Check current permission state
      try {
        if (navigator.permissions && navigator.permissions.query) {
          const permissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });
          
          console.log('Permission status:', permissionStatus.state);
          
          if (permissionStatus.state === 'granted') {
            setMicPermission('granted');
          } else if (permissionStatus.state === 'denied') {
            setMicPermission('denied');
            setShowPermissionPrompt(true);
          } else {
            // Permission not yet requested - show prompt
            setMicPermission('prompt');
            setShowPermissionPrompt(true);
          }

          // Listen for permission changes
          permissionStatus.onchange = () => {
            setMicPermission(permissionStatus.state as 'granted' | 'denied' | 'prompt');
            if (permissionStatus.state === 'denied') {
              setShowPermissionPrompt(true);
            }
          };
        } else {
          // Permissions API not supported, will check on first call
          console.log('Permissions API not available, defaulting to prompt');
          setMicPermission('prompt');
          setShowPermissionPrompt(true);
        }
      } catch (error) {
        console.warn('Could not check microphone permission:', error);
        setMicPermission('prompt');
        setShowPermissionPrompt(true);
      }
    };

    checkMicrophoneAccess();
  }, []);

  const conversation = useConversation({
    onConnect: () => {
      console.log("Connected to AgroVoice");
    },
    onDisconnect: () => {
      console.log("Disconnected from AgroVoice");
    },
    onMessage: (message: any) => {
      const createdAt = new Date().toISOString();
      
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
      
      if (message.source === "ai" && message.message) {
        setMessages((current) => {
          const lastMsg = current[current.length - 1];
          if (lastMsg && lastMsg.role === "assistant") {
            return [
              ...current.slice(0, -1),
              {
                ...lastMsg,
                text: lastMsg.text + " " + message.message,
              },
            ];
          } else {
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
    onError: (error: any) => {
      console.error("AgroVoice error:", error);
    },
  });

  // Load chat history
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

  // Save chat history
  useEffect(() => {
    try {
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
    } catch (error) {
      console.error("Failed to persist chat history:", error);
    }
  }, [messages]);

  // Auto-scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const saveRecommendationDocument = (content: string) => {
    if (!content.trim()) return;
    import("jspdf").then(({ jsPDF }) => {
      const doc = new jsPDF({ unit: "mm", format: "a4" });
      const margin = 15;
      const pageWidth = doc.internal.pageSize.getWidth();
      const maxWidth = pageWidth - margin * 2;

      doc.setFillColor(34, 197, 94);
      doc.rect(0, 0, pageWidth, 22, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("AgriAid Recommendation", margin, 14);

      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text(new Date().toLocaleString(), pageWidth - margin, 14, { align: "right" });

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

  const handleStartCall = async () => {
    if (!AGENT_ID) {
      console.error("Agent ID not configured");
      return;
    }
    
    try {
      // Request microphone permission if not already granted
      if (micPermission !== 'granted') {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        // Stop the stream immediately - we just needed permission
        stream.getTracks().forEach(track => track.stop());
        setMicPermission('granted');
        setShowPermissionPrompt(false);
      }
      
      // Start the conversation
      await conversation.startSession({ agentId: AGENT_ID });
    } catch (error: any) {
      console.error("Failed to start conversation:", error);
      
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        setMicPermission('denied');
        setShowPermissionPrompt(true);
      } else if (error.name === 'NotFoundError') {
        alert("No microphone found. Please connect a microphone and try again.");
      } else {
        alert(`Failed to start voice call: ${error.message || 'Unknown error'}`);
      }
    }
  };

  const handleEndCall = async () => {
    try {
      await conversation.endSession();
    } catch (error) {
      console.error("Failed to end conversation:", error);
    }
  };

  const handleSendMessage = () => {
    if (!inputMessage.trim() || conversation.status !== "connected") return;
    
    // Add message to chat
    const createdAt = new Date().toISOString();
    setMessages((current) => [
      ...current,
      {
        id: `farmer-${Date.now()}`,
        role: "farmer",
        text: inputMessage,
        createdAt,
      },
    ]);
    
    setInputMessage("");
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

  const isConnected = conversation.status === "connected";
  const isConnecting = conversation.status === "connecting";

  // Request microphone access helper
  const requestMicrophoneAccess = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Stop the stream immediately - we just needed permission
      stream.getTracks().forEach(track => track.stop());
      setMicPermission('granted');
      setShowPermissionPrompt(false);
    } catch (error: any) {
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        setMicPermission('denied');
      }
      console.error('Microphone access error:', error);
    }
  };

  // Don't render until mounted (avoid SSR issues)
  if (!isMounted) {
    return null;
  }

  return (
    <>
      {/* Microphone Permission Prompt Modal */}
      {showPermissionPrompt && micPermission !== 'granted' && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
            {micPermission === 'unsupported' ? (
              <>
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 text-center">
                  Browser Not Supported
                </h3>
                <p className="text-sm text-gray-600 text-center">
                  Your browser doesn't support microphone access. Please use Chrome, Firefox, Edge, or Safari on a modern device.
                </p>
                <button
                  onClick={() => setShowPermissionPrompt(false)}
                  className="w-full py-3 bg-gray-800 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors"
                >
                  Close
                </button>
              </>
            ) : micPermission === 'denied' ? (
              <>
                <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto">
                  <Mic className="w-6 h-6 text-amber-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 text-center">
                  Microphone Access Denied
                </h3>
                <p className="text-sm text-gray-600 text-center">
                  To use AgroVoice, you need to enable microphone access:
                </p>
                <ol className="text-sm text-gray-700 space-y-2 list-decimal list-inside">
                  <li>Click the 🔒 lock icon in your browser's address bar</li>
                  <li>Find "Microphone" in the permissions list</li>
                  <li>Change it to "Allow"</li>
                  <li>Reload this page</li>
                </ol>
                <button
                  onClick={() => {
                    setShowPermissionPrompt(false);
                    window.location.reload();
                  }}
                  className="w-full py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
                >
                  Reload Page
                </button>
                <button
                  onClick={() => setShowPermissionPrompt(false)}
                  className="w-full py-2 text-gray-600 text-sm hover:text-gray-800 transition-colors"
                >
                  Close
                </button>
              </>
            ) : (
              <>
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                  <Mic className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 text-center">
                  Enable Microphone Access
                </h3>
                <p className="text-sm text-gray-600 text-center">
                  AgroVoice needs access to your microphone to have voice conversations with you about farming, crops, and soil health.
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-xs text-blue-800">
                    <strong>Privacy:</strong> Your voice is processed securely. We don't store recordings without your permission.
                  </p>
                </div>
                <button
                  onClick={requestMicrophoneAccess}
                  className="w-full py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Mic size={18} />
                  Enable Microphone
                </button>
                <button
                  onClick={() => setShowPermissionPrompt(false)}
                  className="w-full py-2 text-gray-600 text-sm hover:text-gray-800 transition-colors"
                >
                  Maybe Later
                </button>
              </>
            )}
          </div>
        </div>
      )}

      <div className="fixed left-4 right-4 bottom-4 z-50">
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.5fr)_minmax(340px,0.9fr)] gap-4 items-end">

        {/* Chat panel */}
        <div className="bg-white/95 backdrop-blur rounded-2xl border border-green-100 shadow-xl">
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
                isConnected 
                  ? "border-green-200 bg-green-50 text-green-700"
                  : "border-gray-200 bg-gray-50 text-gray-700"
              }`}>
                {isConnected ? "Active" : "Ready"}
              </span>
              <span className="text-gray-400 text-lg leading-none">{minimized ? "▲" : "▼"}</span>
            </div>
          </div>

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

                {!messages.length && !isConnected && (
                  <p className="text-xs text-gray-500">
                    Start a voice call to begin talking with AgroVoice.
                  </p>
                )}

                <div ref={chatEndRef} />
              </div>

              <div className="flex items-center gap-2 mb-3">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSendMessage();
                    }
                  }}
                  placeholder="Send a message to start a chat"
                  className="flex-1 px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  disabled={!isConnected}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!isConnected || !inputMessage.trim()}
                  className="p-2 rounded-full bg-black text-white hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12l14 0M12 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                    <Settings size={16} className="text-gray-600" />
                  </button>
                  <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                    <Mic size={16} className="text-gray-600" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const allText = messages.map(m => m.text).join("\n\n");
                    saveRecommendationDocument(allText);
                  }}
                  disabled={!messages.length}
                  className="px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Download size={14} />
                  Download
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Voice Call Interface */}
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl shadow-2xl border border-gray-200 p-6 flex flex-col items-center space-y-6 h-fit">
          
          {/* Animated Orb */}
          <div className="relative w-48 h-48 flex items-center justify-center">
            {/* Outer glow rings */}
            {isConnected && (
              <>
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-400 via-blue-500 to-cyan-300 opacity-20 animate-pulse" style={{ animationDuration: '2s' }} />
                <div className="absolute inset-2 rounded-full bg-gradient-to-br from-cyan-400 via-blue-500 to-cyan-300 opacity-30 animate-pulse" style={{ animationDuration: '2.5s', animationDelay: '0.5s' }} />
              </>
            )}
            
            {/* Main orb */}
            <div className={`relative w-40 h-40 rounded-full bg-gradient-to-br from-cyan-400 via-blue-500 to-cyan-300 shadow-2xl flex items-center justify-center transition-all duration-500 ${
              isConnected ? 'animate-spin-slow' : ''
            }`} style={{
              background: isConnected 
                ? 'conic-gradient(from 0deg, #67E8F9, #3B82F6, #06B6D4, #67E8F9)'
                : 'linear-gradient(135deg, #67E8F9 0%, #3B82F6 50%, #06B6D4 100%)'
            }}>
            </div>
          </div>

          {/* Status Text */}
          <div className="text-center space-y-1">
            <h3 className="text-lg font-semibold text-gray-900">
              {isConnected ? "Connected" : isConnecting ? "Connecting..." : "AgroVoice"}
            </h3>
            <p className="text-sm text-gray-600">
              {isConnected 
                ? "Speak naturally, I'm listening" 
                : isConnecting
                ? "Please wait..."
                : micPermission === 'granted'
                ? "Ready to start conversation"
                : micPermission === 'denied'
                ? "Microphone access denied"
                : micPermission === 'unsupported'
                ? "Browser not supported"
                : "Enable microphone to start"}
            </p>
            {micPermission !== 'granted' && micPermission !== 'unsupported' && !isConnected && (
              <button
                onClick={() => setShowPermissionPrompt(true)}
                className="text-xs text-green-600 hover:text-green-700 underline mt-2"
              >
                Enable Microphone
              </button>
            )}
          </div>

          {/* Call Action Buttons */}
          <div className="w-full space-y-2">
            {isConnected ? (
              <button
                onClick={handleEndCall}
                className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2 shadow-lg"
              >
                <PhoneOff size={20} />
                End Call
              </button>
            ) : (
              <button
                onClick={handleStartCall}
                disabled={isConnecting || micPermission === 'unsupported'}
                className={`w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2 shadow-lg ${
                  (isConnecting || micPermission === 'unsupported') ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <Phone size={20} />
                {isConnecting ? 'Connecting...' : 'Start Call'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Add custom CSS for spinning animation */}
      <style jsx>{`
        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
      `}</style>
      </div>
    </>
  );
}

// Outer component with provider
function VoiceChatSurface() {
  if (!AGENT_ID) {
    return (
      <div className="fixed left-4 right-4 bottom-4 z-50">
        <div className="bg-yellow-50 border-2 border-yellow-400 rounded-2xl p-6 shadow-xl max-w-md mx-auto">
          <h3 className="text-lg font-bold text-yellow-900 mb-2">
            ⚠️ Voice Agent Not Configured
          </h3>
          <p className="text-sm text-yellow-800 mb-4">
            To use AgroVoice, add NEXT_PUBLIC_ELEVENLABS_AGENT_ID to your .env.local file.
          </p>
          <button
            onClick={() => window.open("https://elevenlabs.io/app/conversational-ai", "_blank")}
            className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Go to ElevenLabs Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <ConversationProvider>
      <VoiceInterface />
    </ConversationProvider>
  );
}

const VoiceChat = () => {
  return (
    <div>
      <VoiceChatSurface />
    </div>
  );
};

export default VoiceChat;
