"use client";

import VoiceAssistantDemo from "@/components/elevenlabs/VoiceAssistantDemo";

/**
 * Demo page for testing ElevenLabs voice integration
 * 
 * To access: Navigate to /voice-demo
 * 
 * This page demonstrates:
 * - Voice recording and transcription
 * - Text-to-speech responses
 * - Interactive conversation flow
 * 
 * Use this as a reference for integrating voice into other pages
 */
export default function VoiceDemoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 py-12">
      <div className="container mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            ElevenLabs Voice Demo
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Test voice recording, transcription, and text-to-speech
          </p>
        </div>

        <VoiceAssistantDemo />

        {/* Usage Instructions */}
        <div className="max-w-4xl mx-auto mt-8 p-6 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-800">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            How to Use
          </h2>
          <ul className="space-y-2 text-gray-700 dark:text-gray-300">
            <li className="flex items-start gap-2">
              <span className="text-green-600 font-bold">1.</span>
              <span>
                <strong>Type</strong> your message in the text area and press Enter or click Send
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 font-bold">2.</span>
              <span>
                <strong>Or</strong> click the microphone button to record your voice
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 font-bold">3.</span>
              <span>Speak clearly and click the microphone again to stop</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 font-bold">4.</span>
              <span>Your speech will be transcribed and appear in the text box</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 font-bold">5.</span>
              <span>
                The AI response will be spoken using ElevenLabs text-to-speech
              </span>
            </li>
          </ul>

          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">
              💡 Integration Note
            </h3>
            <p className="text-sm text-blue-800 dark:text-blue-300">
              This demo uses the same ElevenLabs API that powers your soil-agent
              feature. The code in this demo can be adapted for any page that needs
              voice interaction.
            </p>
          </div>

          <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <h3 className="font-semibold text-yellow-900 dark:text-yellow-200 mb-2">
              ⚠️ Setup Required
            </h3>
            <p className="text-sm text-yellow-800 dark:text-yellow-300 mb-2">
              Make sure you have configured your environment variables:
            </p>
            <ul className="text-sm text-yellow-800 dark:text-yellow-300 list-disc list-inside space-y-1">
              <li>
                <code className="bg-yellow-100 dark:bg-yellow-900/30 px-1 rounded">
                  ELEVENLABS_API_KEY
                </code>{" "}
                - Your ElevenLabs API key
              </li>
              <li>
                <code className="bg-yellow-100 dark:bg-yellow-900/30 px-1 rounded">
                  ELEVENLABS_VOICE_ID
                </code>{" "}
                - Your chosen voice ID
              </li>
            </ul>
            <p className="text-sm text-yellow-800 dark:text-yellow-300 mt-2">
              See <code>ELEVENLABS_INTEGRATION.md</code> for detailed setup instructions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
