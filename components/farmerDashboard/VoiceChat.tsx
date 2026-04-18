import { LiveAPIProvider } from "@/context/LiveAPIContext";
import { useLiveAPIContext } from "@/context/LiveAPIContext";
import { RefObject, useEffect, useRef, useState } from "react";
import ControlTray from "../control-tray/ControlTray";

const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY as string;
if (
  typeof API_KEY !== "string" ||
  API_KEY.trim().length === 0 ||
  API_KEY.includes("replace_with")
) {
  throw new Error("Set NEXT_PUBLIC_GEMINI_API_KEY in .env with a valid key.");
}

const host = "generativelanguage.googleapis.com";
const uri = `wss://${host}/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent`;

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

function VoiceChatSurface({
  videoRef,
  setVideoStream,
}: {
  videoRef: RefObject<HTMLVideoElement | null>;
  setVideoStream: (stream: MediaStream | null) => void;
}) {
  const { latestResponse, isResponding } = useLiveAPIContext();
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [liveTranscript, setLiveTranscript] = useState("");
  const [minimized, setMinimized] = useState(false);
  const assistantMessageIdRef = useRef<string | null>(null);
  const lastDownloadedRef = useRef("");
  const chatEndRef = useRef<HTMLDivElement | null>(null);

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

  useEffect(() => {
    try {
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
    } catch (error) {
      console.error("Failed to persist chat history:", error);
    }
  }, [messages]);

  const handleUserTranscriptChange = (text: string, isFinal: boolean) => {
    if (isFinal) {
      const finalText = text.trim();
      setLiveTranscript("");

      if (!finalText) {
        return;
      }

      const createdAt = new Date().toISOString();
      const assistantId = `assistant-${Date.now()}`;

      setMessages((current) => [
        ...current,
        {
          id: `farmer-${Date.now()}`,
          role: "farmer",
          text: finalText,
          createdAt,
        },
        {
          id: assistantId,
          role: "assistant",
          text: "",
          createdAt: new Date().toISOString(),
          pending: true,
        },
      ]);

      assistantMessageIdRef.current = assistantId;
      return;
    }

    setLiveTranscript(text);
  };

  useEffect(() => {
    if (!latestResponse) return;

    setMessages((current) => {
      if (!assistantMessageIdRef.current) {
        const newId = `assistant-${Date.now()}`;
        assistantMessageIdRef.current = newId;
        return [
          ...current,
          {
            id: newId,
            role: "assistant",
            text: latestResponse,
            createdAt: new Date().toISOString(),
            pending: isResponding,
          },
        ];
      }
      return current.map((message) =>
        message.id === assistantMessageIdRef.current
          ? { ...message, text: latestResponse, pending: isResponding }
          : message
      );
    });

    if (!isResponding && lastDownloadedRef.current !== latestResponse) {
      saveRecommendationDocument(latestResponse);
      lastDownloadedRef.current = latestResponse;
    }
  }, [latestResponse, isResponding]);

  // mark assistant message done when turn completes even if no text came
  useEffect(() => {
    if (!isResponding && assistantMessageIdRef.current) {
      setMessages((current) =>
        current.map((m) =>
          m.id === assistantMessageIdRef.current ? { ...m, pending: false } : m
        )
      );
      assistantMessageIdRef.current = null;
    }
  }, [isResponding]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, liveTranscript]);

  return (
    <div className="fixed left-4 right-4 bottom-4 z-50">
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.5fr)_minmax(340px,0.9fr)] gap-4 items-end">

        {/* Chat panel */}
        <div className="bg-white/95 backdrop-blur rounded-2xl border border-green-100 shadow-xl">
          {/* Header — always visible */}
          <div
            className="flex items-center justify-between px-4 py-3 cursor-pointer select-none"
            onClick={() => setMinimized((v) => !v)}
          >
            <h3 className="text-sm font-semibold text-gray-900">AgriAid Voice Conversation</h3>
            <div className="flex items-center gap-2">
              <span className="text-xs px-2 py-1 rounded-full border border-green-200 bg-green-50 text-green-700">
                {isResponding ? "Responding..." : "Ready"}
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
                      {message.role === "farmer" ? "Farmer" : "AgriAid"}
                    </p>
                    {message.text || (message.pending ? "🔊 AgriAid is speaking..." : "✓ Response delivered via voice")}
                    <p className="text-[10px] opacity-60 mt-2 text-right">
                      {formatTime(message.createdAt)}
                    </p>
                  </div>
                ))}

                {liveTranscript && (
                  <div className="ml-auto max-w-[92%] rounded-xl px-3 py-2 text-sm bg-blue-50/70 text-blue-900 border border-blue-100 border-dashed whitespace-pre-wrap">
                    <p className="text-[11px] font-semibold uppercase opacity-70 mb-1">Farmer (Speaking)</p>
                    {liveTranscript}
                  </div>
                )}

                {!messages.length && !liveTranscript && (
                  <p className="text-xs text-gray-500">
                    Start recording and speak. Your words and AgriAid recommendations will appear here.
                  </p>
                )}
                <div ref={chatEndRef} />
              </div>

              <div className="flex items-center justify-between gap-3 flex-wrap">
                <p className="text-xs text-gray-500">Latest recommendation is auto-saved as a PDF.</p>
                <button
                  type="button"
                  onClick={() => latestResponse && saveRecommendationDocument(latestResponse)}
                  disabled={!latestResponse}
                  className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  Download Document
                </button>
              </div>
            </div>
          )}
        </div>

        <ControlTray
          videoRef={videoRef}
          supportsVideo={true}
          onVideoStreamChange={setVideoStream}
          onUserTranscriptChange={handleUserTranscriptChange}
          containerClassName="
            bg-gray-900/90
            backdrop-blur-xl
            rounded-2xl
            shadow-2xl
            border
            border-gray-800/50
            p-4
            w-full
            flex
            flex-col
            items-center
            space-y-4
            ring-1
            ring-white/10
            h-fit
          "
        />
      </div>
    </div>
  );
}

const VoiceChat = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  return (
    <div>
      <LiveAPIProvider apiKey={API_KEY} url={uri}>
        <div>
          <div className="main-app-area">
            <video
              hidden={!videoRef.current || !videoStream}
              ref={videoRef}
              autoPlay
              playsInline
            />
          </div>
          <VoiceChatSurface
            videoRef={videoRef}
            setVideoStream={setVideoStream}
          />
        </div>
      </LiveAPIProvider>
    </div>
  );
};

export default VoiceChat;
