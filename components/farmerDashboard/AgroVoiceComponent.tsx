"use client";

import { useState } from "react";
import VoiceAgent from "@/components/VoiceAgent/VoiceAgent";
import { Mic, X, MessageSquare, Download } from "lucide-react";

/**
 * AgroVoice Component for Farmer Dashboard
 * 
 * Provides a floating voice assistant interface that farmers can access
 * from anywhere in the dashboard
 */

interface ConversationEntry {
  id: string;
  timestamp: Date;
  userMessage?: string;
  agentMessage?: string;
}

export default function AgroVoiceComponent() {
  const [isOpen, setIsOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<ConversationEntry[]>([]);

  const handleUserSpeech = (transcript: string) => {
    // Add user message to history
    setConversationHistory((prev) => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        timestamp: new Date(),
        userMessage: transcript,
      },
    ]);
  };

  const handleAgentResponse = (response: string) => {
    // Add agent response to the last entry or create new one
    setConversationHistory((prev) => {
      const lastEntry = prev[prev.length - 1];
      
      if (lastEntry && !lastEntry.agentMessage) {
        // Update the last entry with agent response
        return [
          ...prev.slice(0, -1),
          { ...lastEntry, agentMessage: response },
        ];
      } else {
        // Create new entry
        return [
          ...prev,
          {
            id: `agent-${Date.now()}`,
            timestamp: new Date(),
            agentMessage: response,
          },
        ];
      }
    });
  };

  const downloadConversation = () => {
    const content = conversationHistory
      .map((entry) => {
        const time = entry.timestamp.toLocaleTimeString();
        let text = `[${time}]\n`;
        if (entry.userMessage) {
          text += `Farmer: ${entry.userMessage}\n`;
        }
        if (entry.agentMessage) {
          text += `AgroVoice: ${entry.agentMessage}\n`;
        }
        return text;
      })
      .join("\n---\n\n");

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `agrovoice-conversation-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      {/* Floating Action Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 group"
          aria-label="Open AgroVoice"
        >
          <div className="relative">
            {/* Pulsing background */}
            <div className="absolute inset-0 bg-primary_green rounded-full animate-ping opacity-75" />
            
            {/* Main button */}
            <div className="relative bg-primary_green hover:bg-green-700 text-white rounded-full p-4 shadow-2xl transition-all duration-300 hover:scale-110">
              <Mic className="h-7 w-7" />
            </div>
          </div>
          
          {/* Tooltip */}
          <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            Talk to AgroVoice
            <div className="absolute top-full right-6 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900" />
          </div>
        </button>
      )}

      {/* Full AgroVoice Interface */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 rounded-full p-2">
                  <Mic className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">AgroVoice</h2>
                  <p className="text-green-100 text-sm">Your Farming Assistant</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {conversationHistory.length > 0 && (
                  <button
                    onClick={() => setShowHistory(!showHistory)}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                    aria-label="Toggle conversation history"
                  >
                    <MessageSquare className="h-5 w-5 text-white" />
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  aria-label="Close AgroVoice"
                >
                  <X className="h-5 w-5 text-white" />
                </button>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6">
              {showHistory && conversationHistory.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Conversation History
                    </h3>
                    <button
                      onClick={downloadConversation}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
                    >
                      <Download className="h-4 w-4" />
                      Download
                    </button>
                  </div>
                  
                  {conversationHistory.map((entry) => (
                    <div key={entry.id} className="space-y-2">
                      {entry.userMessage && (
                        <div className="flex justify-end">
                          <div className="bg-blue-50 border border-blue-200 rounded-2xl rounded-tr-sm px-4 py-3 max-w-[80%]">
                            <p className="text-xs font-semibold text-blue-600 mb-1">
                              You
                            </p>
                            <p className="text-sm text-gray-800">
                              {entry.userMessage}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {entry.timestamp.toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      )}
                      
                      {entry.agentMessage && (
                        <div className="flex justify-start">
                          <div className="bg-green-50 border border-green-200 rounded-2xl rounded-tl-sm px-4 py-3 max-w-[80%]">
                            <p className="text-xs font-semibold text-green-600 mb-1">
                              AgroVoice
                            </p>
                            <p className="text-sm text-gray-800">
                              {entry.agentMessage}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {entry.timestamp.toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <VoiceAgent
                  onTranscriptReceived={handleUserSpeech}
                  onAgentResponse={handleAgentResponse}
                />
              )}
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
              <p className="text-xs text-gray-600 text-center">
                AgroVoice uses ElevenLabs Conversational AI to provide farming advice.
                {conversationHistory.length > 0 && (
                  <button
                    onClick={() => setShowHistory(!showHistory)}
                    className="ml-2 text-green-600 hover:text-green-700 font-medium"
                  >
                    {showHistory ? "Back to Voice Chat" : "View History"}
                  </button>
                )}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
