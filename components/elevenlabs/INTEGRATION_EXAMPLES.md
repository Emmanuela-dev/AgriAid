# ElevenLabs Integration Examples

## Quick Reference: How ElevenLabs is Connected

### 🎯 Your Current Setup (Already Working!)

Your app uses ElevenLabs through **REST API endpoints**. Here's exactly how it's connected:

## 1. API Routes (Backend)

### `/app/api/voice/speak/route.ts` - Text-to-Speech
```typescript
// Takes text, sends to ElevenLabs, returns audio
export async function POST(request: Request) {
  const { text } = await request.json();
  
  // Call ElevenLabs API
  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      headers: { "xi-api-key": elevenLabsApiKey },
      body: JSON.stringify({ text, model_id: "eleven_multilingual_v2" }),
    }
  );
  
  // Return audio to client
  return new NextResponse(await response.arrayBuffer());
}
```

### `/app/api/voice/transcribe/route.ts` - Speech-to-Text
```typescript
// Takes audio, sends to ElevenLabs, returns text
export async function POST(request: Request) {
  const formData = await request.formData();
  const audio = formData.get("audio");
  
  // Call ElevenLabs API
  const response = await fetch(
    "https://api.elevenlabs.io/v1/speech-to-text",
    {
      headers: { "xi-api-key": elevenLabsApiKey },
      body: formData,
    }
  );
  
  const { text } = await response.json();
  return NextResponse.json({ text });
}
```

## 2. Frontend Usage

### In `hooks/use-live-api.ts`

**Text-to-Speech (Line 247):**
```typescript
const speakTextViaTTS = useCallback(async (text: string) => {
  // Call your API endpoint
  const response = await fetch("/api/voice/speak", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  
  // Play the audio
  const audio = new Audio(URL.createObjectURL(await response.blob()));
  await audio.play();
}, []);
```

### In `components/control-tray/ControlTray.tsx`

**Speech-to-Text (Line 283):**
```typescript
const stopRecordingAndSubmit = async () => {
  // Create form data with recorded audio
  const formData = new FormData();
  formData.append("audio", audioRecorder.getWavBlob(), "agriaid-question.wav");
  
  // Call your API endpoint
  const response = await fetch("/api/voice/transcribe", {
    method: "POST",
    body: formData,
  });
  
  // Get transcribed text
  const { text } = await response.json();
  onUserTranscriptChange?.(text, true);
};
```

## 3. Integration Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER INTERACTION                          │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                ┌───────────────┴───────────────┐
                │                               │
         ┌──────▼──────┐               ┌───────▼────────┐
         │   SPEAK     │               │  RECORD VOICE  │
         │   (Text)    │               │   (Audio)      │
         └──────┬──────┘               └───────┬────────┘
                │                               │
                │                               │
         ┌──────▼──────────┐           ┌────────▼─────────┐
         │ POST            │           │ POST             │
         │ /api/voice/     │           │ /api/voice/      │
         │ speak           │           │ transcribe       │
         └──────┬──────────┘           └────────┬─────────┘
                │                               │
                │ {text: "..."}                │ FormData(audio)
                │                               │
         ┌──────▼─────────────────┐   ┌────────▼────────────────┐
         │  ELEVENLABS API        │   │  ELEVENLABS API         │
         │  text-to-speech        │   │  speech-to-text         │
         │  eleven_multilingual   │   │  scribe_v1              │
         └──────┬─────────────────┘   └────────┬────────────────┘
                │                               │
                │ Audio MP3                     │ {text: "..."}
                │                               │
         ┌──────▼──────────┐           ┌────────▼─────────┐
         │  PLAY AUDIO     │           │  SHOW TEXT       │
         │  new Audio()    │           │  Display to user │
         └─────────────────┘           └──────────────────┘
```

## 4. Adding Voice to a New Component

### Method 1: Use Your Existing API Routes (Recommended)

```typescript
"use client";
import { useState } from "react";

export default function MyVoiceComponent() {
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Speak text using ElevenLabs
  const speakText = async (text: string) => {
    setIsSpeaking(true);
    try {
      const response = await fetch("/api/voice/speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      
      const audioBlob = await response.blob();
      const audio = new Audio(URL.createObjectURL(audioBlob));
      await audio.play();
    } catch (error) {
      console.error("Speech failed:", error);
    } finally {
      setIsSpeaking(false);
    }
  };

  return (
    <button 
      onClick={() => speakText("Hello farmer!")}
      disabled={isSpeaking}
    >
      {isSpeaking ? "Speaking..." : "Speak"}
    </button>
  );
}
```

### Method 2: Use the Helper Hook

```typescript
"use client";
import { useElevenLabsVoice } from "@/components/elevenlabs/ElevenLabsVoice";

export default function MyVoiceComponent() {
  const { speakText, isSpeaking } = useElevenLabsVoice();

  return (
    <button 
      onClick={() => speakText("Hello farmer!")}
      disabled={isSpeaking}
    >
      {isSpeaking ? "Speaking..." : "Speak"}
    </button>
  );
}
```

### Method 3: Recording Audio

```typescript
"use client";
import { useState } from "react";

export default function VoiceRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    const chunks: Blob[] = [];

    recorder.ondataavailable = (e) => chunks.push(e.data);
    
    recorder.onstop = async () => {
      const audioBlob = new Blob(chunks, { type: "audio/wav" });
      
      // Send to ElevenLabs for transcription
      const formData = new FormData();
      formData.append("audio", audioBlob, "recording.wav");
      
      const response = await fetch("/api/voice/transcribe", {
        method: "POST",
        body: formData,
      });
      
      const { text } = await response.json();
      console.log("User said:", text);
      
      stream.getTracks().forEach(track => track.stop());
    };

    recorder.start();
    setMediaRecorder(recorder);
    setIsRecording(true);
  };

  const stopRecording = () => {
    mediaRecorder?.stop();
    setIsRecording(false);
  };

  return (
    <button onClick={isRecording ? stopRecording : startRecording}>
      {isRecording ? "Stop Recording" : "Start Recording"}
    </button>
  );
}
```

## 5. Environment Configuration

Your `.env.local` file should have:

```env
# Get from https://elevenlabs.io/app/settings/api-keys
ELEVENLABS_API_KEY=sk_your_api_key_here

# Get from https://elevenlabs.io/app/voice-library
ELEVENLABS_VOICE_ID=your_voice_id_here
```

**Important:** After adding/changing env vars, restart your dev server!

```powershell
# Stop current server (Ctrl+C), then:
npm run dev
```

## 6. Testing Checklist

### ✅ Test Text-to-Speech
1. Go to soil-agent page
2. Type a message or use the AI
3. Should hear voice response

### ✅ Test Speech-to-Text
1. Click microphone button
2. Speak clearly
3. Should see transcribed text

### ✅ Test Demo Page
1. Navigate to `/voice-demo`
2. Try both typing and recording
3. Verify responses are spoken

## 7. Common Integration Points

### Add Voice to a Chat Component

```typescript
import { useElevenLabsVoice } from "@/components/elevenlabs/ElevenLabsVoice";

export default function ChatComponent() {
  const { speakText } = useElevenLabsVoice();
  const [messages, setMessages] = useState([]);

  const handleAIResponse = async (response: string) => {
    // Add to chat
    setMessages([...messages, { role: "ai", content: response }]);
    
    // Speak it
    await speakText(response);
  };

  return (/* Your chat UI */);
}
```

### Add Voice to a Form

```typescript
export default function VoiceForm() {
  const [transcript, setTranscript] = useState("");

  const handleTranscript = (text: string) => {
    // Auto-fill form with transcribed text
    setTranscript(text);
  };

  return (
    <form>
      <textarea value={transcript} onChange={e => setTranscript(e.target.value)} />
      <VoiceRecorder onTranscriptReceived={handleTranscript} />
    </form>
  );
}
```

### Add Voice to Notifications

```typescript
const { speakText } = useElevenLabsVoice();

// Speak notification
await speakText("Your soil test results are ready!");
```

## 8. Advanced: Custom Voice Settings

Edit `/app/api/voice/speak/route.ts` to customize:

```typescript
body: JSON.stringify({
  text: body.text,
  model_id: "eleven_multilingual_v2", // Supports 29 languages
  voice_settings: {
    stability: 0.45,        // 0-1: Consistency of voice
    similarity_boost: 0.8,  // 0-1: How close to original voice
    speed: 1.1,            // 0.5-2.0: Speaking speed
    style: 0.5,            // 0-1: Exaggeration of emotion (v2 only)
    use_speaker_boost: true // Enhance voice clarity
  },
}),
```

## 9. Multilingual Support

Your setup already supports multiple languages! ElevenLabs `eleven_multilingual_v2` supports:

✅ English (all accents)
✅ Kiswahili
✅ Plus 27 other languages

**The voice will automatically match the text language!**

## 10. Production Considerations

### Security
- ✅ API keys are server-side only (not exposed to client)
- ✅ No CORS issues (using your own API routes)
- ✅ Rate limiting possible on your routes

### Performance
- Cache common responses
- Consider audio format (MP3 vs WAV)
- Optimize audio quality vs file size

### Cost Optimization
- Monitor usage at https://elevenlabs.io/app/usage
- Cache frequently used audio
- Use appropriate voice quality settings

## 🎉 Summary

**You're already connected!** Your implementation:
1. ✅ Uses ElevenLabs API via secure server routes
2. ✅ Supports both speech-to-text and text-to-speech
3. ✅ Integrated with Gemini AI for smart responses
4. ✅ Supports multiple Kenyan languages
5. ✅ Production-ready with proper error handling

**No major changes needed** - just add your API keys and you're good to go! 🚀
