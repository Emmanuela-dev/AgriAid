# ElevenLabs Integration Guide

## Overview
This directory contains components and utilities for integrating ElevenLabs voice capabilities into the AgriAid application.

## Setup

### 1. Environment Variables
Add to your `.env.local`:
```env
ELEVENLABS_API_KEY=your_api_key_here
ELEVENLABS_VOICE_ID=your_voice_id_here
```

Get your API key from: https://elevenlabs.io/app/settings/api-keys

### 2. Get Voice ID
Find available voices at: https://elevenlabs.io/app/voice-library

Or use the API:
```bash
curl -X GET "https://api.elevenlabs.io/v1/voices" \
  -H "xi-api-key: YOUR_API_KEY"
```

## Usage Examples

### Option 1: Use the Component

```tsx
import ElevenLabsVoice from "@/components/elevenlabs/ElevenLabsVoice";

function MyComponent() {
  const handleTranscript = (text: string) => {
    console.log("User said:", text);
    // Process the transcribed text
  };

  return (
    <ElevenLabsVoice
      onTranscriptReceived={handleTranscript}
      onSpeechComplete={() => console.log("Finished speaking")}
    />
  );
}
```

### Option 2: Use the Hook

```tsx
import { useElevenLabsVoice } from "@/components/elevenlabs/ElevenLabsVoice";

function MyComponent() {
  const { speakText, transcribeAudio, isSpeaking } = useElevenLabsVoice();

  const handleSpeak = async () => {
    try {
      await speakText("Hello farmer, how can I help you today?");
    } catch (error) {
      console.error("Speech failed:", error);
    }
  };

  return (
    <button onClick={handleSpeak} disabled={isSpeaking}>
      {isSpeaking ? "Speaking..." : "Speak"}
    </button>
  );
}
```

### Option 3: Direct API Integration (Current Implementation)

Your current implementation in `hooks/use-live-api.ts` already uses the ElevenLabs API directly:

```typescript
// Text-to-Speech
const response = await fetch("/api/voice/speak", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ text: "Your text here" }),
});

// Speech-to-Text
const formData = new FormData();
formData.append("audio", audioBlob, "recording.wav");
const response = await fetch("/api/voice/transcribe", {
  method: "POST",
  body: formData,
});
```

## API Routes

### `/api/voice/speak` (Text-to-Speech)
**Request:**
```json
{
  "text": "Text to convert to speech"
}
```

**Response:**
Audio file (audio/mpeg)

### `/api/voice/transcribe` (Speech-to-Text)
**Request:**
FormData with `audio` file

**Response:**
```json
{
  "text": "Transcribed text from audio"
}
```

## Features

### Current Implementation Benefits:
1. ✅ Direct API control (no SDK overhead)
2. ✅ Custom voice settings (stability, similarity_boost, speed)
3. ✅ Multilingual support (eleven_multilingual_v2)
4. ✅ Works with your existing Gemini Live API integration
5. ✅ Server-side API key protection

### @elevenlabs/react SDK Benefits:
1. Simplified React integration
2. Built-in state management
3. Automatic error handling
4. WebSocket support for streaming
5. Ready-made UI components

## Recommendations

**Keep your current implementation if:**
- You need precise control over voice settings
- You want minimal dependencies
- Your current setup works well
- You prefer server-side API calls for security

**Switch to @elevenlabs/react SDK if:**
- You want pre-built React components
- You need WebSocket streaming support
- You want faster development with less boilerplate
- You need client-side voice synthesis

## Advanced: Using ElevenLabs React SDK Directly

If you want to use the official SDK components:

```tsx
import { ElevenLabsClient } from "@elevenlabs/react";

// Initialize (typically in a provider)
const client = new ElevenLabsClient({
  apiKey: process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY, // Client-side key
});

// Use in components
import { useTextToSpeech } from "@elevenlabs/react";

function MyComponent() {
  const { speak, isPending } = useTextToSpeech({
    voiceId: "your-voice-id",
  });

  return (
    <button onClick={() => speak("Hello")} disabled={isPending}>
      Speak
    </button>
  );
}
```

**Note:** For client-side usage, you'll need `NEXT_PUBLIC_ELEVENLABS_API_KEY` in your environment variables.

## Troubleshooting

### Common Issues

1. **"API key not configured"**
   - Ensure `.env.local` has `ELEVENLABS_API_KEY`
   - Restart your dev server after adding env vars

2. **"Voice ID not found"**
   - Check your voice ID at https://elevenlabs.io/app/voice-library
   - Ensure `ELEVENLABS_VOICE_ID` is set correctly

3. **"Microphone permission denied"**
   - Check browser permissions
   - Ensure HTTPS (or localhost) for mic access

4. **Audio not playing**
   - Check browser audio permissions
   - Verify audio format support (MP3)
   - Check console for CORS or network errors

## Resources

- [ElevenLabs API Docs](https://docs.elevenlabs.io/)
- [ElevenLabs React SDK](https://github.com/elevenlabs/elevenlabs-js)
- [Voice Library](https://elevenlabs.io/app/voice-library)
- [API Dashboard](https://elevenlabs.io/app/settings/api-keys)
