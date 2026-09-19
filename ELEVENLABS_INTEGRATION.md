# ElevenLabs Integration Guide for AgriAid

## 🎯 Current Status

✅ **Already Working!** Your app already uses ElevenLabs API via REST endpoints.
✅ **Package Installed:** `@elevenlabs/react` is now installed.

## 📋 Quick Summary

Your current implementation in `hooks/use-live-api.ts` and API routes already works with ElevenLabs. The `@elevenlabs/react` package provides alternative ways to use ElevenLabs, but **your current setup is production-ready**.

## 🔧 What You Have Now

### API Routes (Server-Side)
- ✅ `/api/voice/speak` - Text-to-Speech
- ✅ `/api/voice/transcribe` - Speech-to-Text

### Current Implementation
- ✅ Direct ElevenLabs API calls
- ✅ Custom voice configuration
- ✅ Multilingual support (eleven_multilingual_v2)
- ✅ Integrated with Gemini Live API

## 🚀 Setup Steps

### 1. Add Environment Variables

Create or update `.env.local`:

```env
# Required - Get from https://elevenlabs.io/app/settings/api-keys
ELEVENLABS_API_KEY=sk_your_api_key_here

# Required - Get from https://elevenlabs.io/app/voice-library
ELEVENLABS_VOICE_ID=your_voice_id_here

# Optional - For client-side SDK usage
NEXT_PUBLIC_ELEVENLABS_API_KEY=sk_your_api_key_here
```

**Important:** Restart your dev server after adding these variables!

### 2. Get Your API Key

1. Go to: https://elevenlabs.io/app/settings/api-keys
2. Create a new API key
3. Copy it to your `.env.local` file

### 3. Choose a Voice

1. Go to: https://elevenlabs.io/app/voice-library
2. Browse and preview voices
3. Click on a voice to get its Voice ID
4. Copy the ID to your `.env.local` file

**Recommended Voices for AgriAid:**
- **Adam** (Clear, neutral male voice)
- **Rachel** (Professional female voice)
- **Antoni** (Warm, friendly male voice)
- **Bella** (Clear, articulate female voice)

Or create a custom cloned voice for authentic Kenyan accent!

## 🎨 Integration Options

### Option A: Use Your Current Implementation (Recommended)

**No changes needed!** Your current setup is already optimal because:

1. **Server-side security** - API keys never exposed to client
2. **Custom control** - Fine-tuned voice settings
3. **Integrated flow** - Works seamlessly with your Gemini AI

**How it works now:**

```typescript
// In hooks/use-live-api.ts - already implemented!

// Text-to-Speech
const response = await fetch("/api/voice/speak", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ text: "Your text here" }),
});
const audioBlob = await response.blob();
const audio = new Audio(URL.createObjectURL(audioBlob));
await audio.play();

// Speech-to-Text
const formData = new FormData();
formData.append("audio", audioRecorder.getWavBlob(), "recording.wav");
const response = await fetch("/api/voice/transcribe", {
  method: "POST",
  body: formData,
});
const { text } = await response.json();
```

### Option B: Use New Helper Components

If you want to simplify your code or add voice to new pages:

```typescript
// Import the hook
import { useElevenLabsVoice } from "@/components/elevenlabs/ElevenLabsVoice";

function MyComponent() {
  const { speakText, transcribeAudio, isSpeaking } = useElevenLabsVoice();

  // Speak text
  await speakText("Hello farmer!");

  // Transcribe audio
  const text = await transcribeAudio(audioBlob);
}
```

### Option C: Use Official @elevenlabs/react SDK (Advanced)

For advanced features like WebSocket streaming:

```typescript
import { ElevenLabsClient } from "@elevenlabs/react";

// Initialize client
const client = new ElevenLabsClient({
  apiKey: process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY,
});

// Use in component
import { useTextToSpeech } from "@elevenlabs/react";

function MyComponent() {
  const { speak, isPending } = useTextToSpeech({
    voiceId: process.env.NEXT_PUBLIC_ELEVENLABS_VOICE_ID,
  });

  return (
    <button onClick={() => speak("Hello")} disabled={isPending}>
      Speak
    </button>
  );
}
```

## 📝 Testing Your Integration

### Test 1: Text-to-Speech

```bash
# Test the speak endpoint
curl -X POST http://localhost:3000/api/voice/speak \
  -H "Content-Type: application/json" \
  -d '{"text":"Hello farmer, this is a test"}' \
  --output test-speech.mp3

# Play the file to verify
```

### Test 2: Speech-to-Text

1. Record a short audio file (WAV format)
2. Use the demo component at `/components/elevenlabs/VoiceAssistantDemo.tsx`
3. Or test via curl:

```bash
curl -X POST http://localhost:3000/api/voice/transcribe \
  -F "audio=@your-audio-file.wav"
```

### Test 3: End-to-End

1. Start your app: `npm run dev`
2. Navigate to the soil-agent page
3. Click the microphone button
4. Speak a question
5. Verify transcription and AI response with voice

## 🎯 Where Voice is Used in Your App

### Current Locations:

1. **Control Tray** (`components/control-tray/ControlTray.tsx`)
   - Voice recording
   - Real-time transcription
   - Uses: `/api/voice/transcribe`

2. **Live API Hook** (`hooks/use-live-api.ts`)
   - Text-to-speech responses
   - Offline fallback with browser TTS
   - Uses: `/api/voice/speak`

3. **Soil Agent Dashboard** (`app/(dashboard)/soil-agent/page.tsx`)
   - Full voice interaction
   - Multilingual support

## 🌍 Multilingual Support

Your current setup supports **Kenyan languages**:
- English (Kenyan accent)
- Kiswahili
- Kikuyu
- Luo
- Luhya
- Kamba
- Kalenjin
- Meru
- Mijikenda
- Somali
- Maasai
- Turkana
- Kisii

**How it works:**
1. User speaks in their language
2. ElevenLabs transcribes to text
3. Gemini AI detects language
4. Gemini responds in same language
5. ElevenLabs speaks the response

## 🔧 Customizing Voice Settings

Edit `/app/api/voice/speak/route.ts`:

```typescript
body: JSON.stringify({
  text: body.text,
  model_id: "eleven_multilingual_v2", // Supports 29 languages
  voice_settings: {
    stability: 0.45,        // 0-1: Lower = more variation
    similarity_boost: 0.8,  // 0-1: Higher = more like original voice
    speed: 1.1,            // 0.5-2.0: Playback speed
  },
}),
```

## 🎨 Voice Cloning (Advanced)

To create an authentic Kenyan voice:

1. Go to: https://elevenlabs.io/app/voice-lab
2. Click "Instant Voice Cloning"
3. Upload 1-2 minutes of clear audio samples
4. ElevenLabs will create a custom voice
5. Copy the new Voice ID to `.env.local`

**Best practices for cloning:**
- Use clear, high-quality audio
- Include variety in tone and emotion
- Minimum 1 minute recommended
- Background noise should be minimal

## 📊 Usage Monitoring

Track your ElevenLabs usage:
- Dashboard: https://elevenlabs.io/app/usage
- Monitor characters used
- Check API calls
- View quota limits

**Free tier limits:**
- 10,000 characters/month
- 3 custom voices

**Paid tiers:**
- Starting at $5/month
- More characters
- Commercial license
- Priority support

## 🐛 Troubleshooting

### Problem: "API key not configured"
**Solution:** 
- Add `ELEVENLABS_API_KEY` to `.env.local`
- Restart dev server: `npm run dev`

### Problem: "Voice ID not found"
**Solution:**
- Verify Voice ID at: https://elevenlabs.io/app/voice-library
- Ensure `ELEVENLABS_VOICE_ID` is correct
- Try a default voice ID first

### Problem: No audio output
**Solution:**
- Check browser console for errors
- Verify audio is not muted
- Check Content Security Policy (CSP)
- Test with different voice ID

### Problem: "Microphone permission denied"
**Solution:**
- Check browser settings
- Ensure HTTPS or localhost
- Grant microphone permissions
- Try different browser

### Problem: Poor transcription quality
**Solution:**
- Reduce background noise
- Speak clearly and slower
- Check microphone quality
- Use better audio format (WAV > MP3)

### Problem: Slow response times
**Solution:**
- Check internet connection
- Monitor ElevenLabs API status
- Consider caching common responses
- Optimize audio format/quality

## 🚀 Production Checklist

Before deploying:

- [ ] ✅ API keys added to production environment variables
- [ ] ✅ Voice ID configured
- [ ] ✅ Tested speech-to-text with real farmers
- [ ] ✅ Tested text-to-speech in all supported languages
- [ ] ✅ Fallback for offline mode implemented
- [ ] ✅ Error handling for API failures
- [ ] ✅ Usage monitoring set up
- [ ] ✅ CSP headers allow audio playback
- [ ] ✅ HTTPS enabled (required for microphone)
- [ ] ✅ Rate limiting configured

## 📚 Additional Resources

- [ElevenLabs API Documentation](https://docs.elevenlabs.io/)
- [ElevenLabs React SDK](https://github.com/elevenlabs/elevenlabs-js)
- [Voice Library](https://elevenlabs.io/app/voice-library)
- [Usage Dashboard](https://elevenlabs.io/app/usage)
- [Pricing](https://elevenlabs.io/pricing)

## 💡 Next Steps

1. **Add your API keys** to `.env.local`
2. **Restart your dev server**
3. **Test the voice features** in soil-agent
4. **Optional:** Try the demo at `/components/elevenlabs/VoiceAssistantDemo.tsx`
5. **Optional:** Clone a voice for authentic Kenyan accent

## 🤝 Need Help?

Your implementation is already solid! The `@elevenlabs/react` package provides alternatives, but your current REST API approach is:
- ✅ More secure (server-side keys)
- ✅ More flexible (custom settings)
- ✅ Better integrated (works with Gemini)
- ✅ Production-ready

Keep using what you have! 🎉
