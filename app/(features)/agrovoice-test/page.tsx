"use client";

import { useState } from "react";
import VoiceAgent from "@/components/VoiceAgent/VoiceAgent";
import { AlertCircle, CheckCircle2, Info } from "lucide-react";

/**
 * AgroVoice Test Page
 * 
 * A dedicated page for testing the ElevenLabs Voice Agent integration
 * Use this page to verify setup and debug issues
 */

export default function AgroVoiceTestPage() {
  const [transcripts, setTranscripts] = useState<string[]>([]);
  const [responses, setResponses] = useState<string[]>([]);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [`[${timestamp}] ${message}`, ...prev]);
  };

  const handleTranscript = (text: string) => {
    setTranscripts((prev) => [text, ...prev]);
    addLog(`User spoke: "${text}"`);
  };

  const handleResponse = (text: string) => {
    setResponses((prev) => [text, ...prev]);
    addLog(`Agent responded: "${text}"`);
  };

  const agentId = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            AgroVoice Test Page
          </h1>
          <p className="text-lg text-gray-600">
            Test your ElevenLabs Voice Agent integration
          </p>
        </div>

        {/* Setup Status */}
        <div className="mb-8 bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Info size={24} className="text-blue-500" />
            Setup Status
          </h2>
          
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              {agentId ? (
                <CheckCircle2 size={20} className="text-green-500 mt-0.5 flex-shrink-0" />
              ) : (
                <AlertCircle size={20} className="text-red-500 mt-0.5 flex-shrink-0" />
              )}
              <div className="flex-1">
                <p className="font-medium text-gray-900">Agent ID Configuration</p>
                <p className="text-sm text-gray-600 mt-1">
                  {agentId ? (
                    <>
                      <code className="bg-green-50 text-green-700 px-2 py-1 rounded text-xs">
                        {agentId.substring(0, 20)}...
                      </code>
                      <span className="ml-2">✓ Configured</span>
                    </>
                  ) : (
                    <>
                      <code className="bg-red-50 text-red-700 px-2 py-1 rounded text-xs">
                        NOT SET
                      </code>
                      <span className="ml-2">
                        Add NEXT_PUBLIC_ELEVENLABS_AGENT_ID to .env.local
                      </span>
                    </>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle2 size={20} className="text-green-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-medium text-gray-900">@elevenlabs/react Package</p>
                <p className="text-sm text-gray-600 mt-1">
                  ✓ Installed and imported
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              {typeof window !== "undefined" && navigator?.mediaDevices ? (
                <CheckCircle2 size={20} className="text-green-500 mt-0.5 flex-shrink-0" />
              ) : (
                <AlertCircle size={20} className="text-yellow-500 mt-0.5 flex-shrink-0" />
              )}
              <div className="flex-1">
                <p className="font-medium text-gray-900">Browser Support</p>
                <p className="text-sm text-gray-600 mt-1">
                  {typeof window !== "undefined" && navigator?.mediaDevices
                    ? "✓ Browser supports microphone access"
                    : "⚠️ Microphone API not detected"}
                </p>
              </div>
            </div>
          </div>

          {!agentId && (
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Setup Required:</strong> To use AgroVoice, you need to:
              </p>
              <ol className="list-decimal list-inside text-sm text-yellow-800 mt-2 space-y-1">
                <li>Create an agent at https://elevenlabs.io/app/conversational-ai</li>
                <li>Copy your Agent ID</li>
                <li>Add to .env.local: NEXT_PUBLIC_ELEVENLABS_AGENT_ID=your_id</li>
                <li>Restart dev server: npm run dev</li>
              </ol>
            </div>
          )}
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Voice Agent */}
          <div>
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Voice Agent
              </h2>
              <VoiceAgent
                onTranscriptReceived={handleTranscript}
                onAgentResponse={handleResponse}
              />
            </div>

            {/* Instructions */}
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-6">
              <h3 className="font-semibold text-blue-900 mb-3">How to Test</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
                <li>Click "Start Conversation" button</li>
                <li>Allow microphone access when prompted</li>
                <li>Wait for "AgroVoice is listening" state</li>
                <li>Speak a farming question (e.g., "What crops grow well in sandy soil?")</li>
                <li>Listen to the agent's voice response</li>
                <li>Click "End Call" when finished</li>
              </ol>
            </div>
          </div>

          {/* Logs and Data */}
          <div className="space-y-6">
            {/* Transcripts */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                User Transcripts ({transcripts.length})
              </h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {transcripts.length === 0 ? (
                  <p className="text-sm text-gray-500 italic">
                    No transcripts yet. Start speaking to see them here.
                  </p>
                ) : (
                  transcripts.map((text, index) => (
                    <div
                      key={index}
                      className="bg-blue-50 border border-blue-200 rounded-lg p-3"
                    >
                      <p className="text-sm text-gray-800">{text}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Responses */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Agent Responses ({responses.length})
              </h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {responses.length === 0 ? (
                  <p className="text-sm text-gray-500 italic">
                    No responses yet. Agent will respond after you speak.
                  </p>
                ) : (
                  responses.map((text, index) => (
                    <div
                      key={index}
                      className="bg-green-50 border border-green-200 rounded-lg p-3"
                    >
                      <p className="text-sm text-gray-800">{text}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Debug Logs */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900">
                  Debug Logs
                </h3>
                {logs.length > 0 && (
                  <button
                    onClick={() => setLogs([])}
                    className="text-xs text-gray-500 hover:text-gray-700"
                  >
                    Clear
                  </button>
                )}
              </div>
              <div className="space-y-1 max-h-48 overflow-y-auto font-mono text-xs">
                {logs.length === 0 ? (
                  <p className="text-gray-500 italic">No logs yet.</p>
                ) : (
                  logs.map((log, index) => (
                    <div key={index} className="text-gray-700 py-1">
                      {log}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Resources */}
        <div className="mt-8 bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Resources & Documentation
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a
              href="https://elevenlabs.io/app/conversational-ai"
              target="_blank"
              rel="noopener noreferrer"
              className="p-4 border border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors"
            >
              <h3 className="font-semibold text-gray-900 mb-1">
                ElevenLabs Dashboard
              </h3>
              <p className="text-sm text-gray-600">
                Create and manage your AI agents
              </p>
            </a>

            <a
              href="https://docs.elevenlabs.io"
              target="_blank"
              rel="noopener noreferrer"
              className="p-4 border border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors"
            >
              <h3 className="font-semibold text-gray-900 mb-1">
                ElevenLabs Docs
              </h3>
              <p className="text-sm text-gray-600">
                API documentation and guides
              </p>
            </a>

            <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
              <h3 className="font-semibold text-gray-900 mb-1">
                Local Documentation
              </h3>
              <p className="text-sm text-gray-600">
                See AGROVOICE_SETUP.md in project root
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
