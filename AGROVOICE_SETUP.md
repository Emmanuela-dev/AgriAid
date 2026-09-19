# AgroVoice Setup Guide

## Overview

AgroVoice is AgriAid's voice assistant powered by ElevenLabs Conversational AI. This guide will help you set up and configure the voice agent properly.

## Prerequisites

1. An ElevenLabs account (sign up at https://elevenlabs.io)
2. Access to ElevenLabs Conversational AI
3. Node.js and npm installed
4. The `@elevenlabs/react` package (already installed)

## Step 1: Create Your ElevenLabs Agent

1. **Go to ElevenLabs Dashboard**
   - Visit: https://elevenlabs.io/app/conversational-ai

2. **Create a New Agent**
   - Click "Create Agent" or "New Conversational AI Agent"
   - Give it a name: "AgroVoice" or "AgriAid Assistant"

3. **Configure Agent Personality & Knowledge**
   
   **System Prompt Example:**
   ```
   You are AgroVoice, a knowledgeable agricultural assistant for Kenyan farmers. 
   You help farmers with:
   - Crop recommendations based on soil conditions
   - Weather-appropriate farming advice
   - Pest and disease identification
   - Soil health optimization
   - Farming best practices for Kenyan climate
   
   Speak in a warm, friendly, and supportive tone like a local agricultural extension officer.
   Use simple language that farmers can understand. 
   Support conversations in English, Kiswahili, and other Kenyan languages when possible.
   Be practical and action-oriented in your recommendations.
   ```

4. **Choose Voice**
   - Select a clear, professional voice
   - Consider: Adam, Rachel, Antoni, or Bella
   - Or clone a voice with authentic Kenyan accent

5. **Configure Response Settings**
   - Response Length: Medium (allows detailed but concise answers)
   - Speaking Rate: Normal to slightly faster
   - Enable interruptions: Yes (farmers can interrupt the agent)

6. **Copy Your Agent ID**
   - After creating the agent, copy the Agent ID
   - It looks like: `agent_abc123xyz456...`
   - You'll need this for your environment configuration

## Step 2: Configure Environment Variables

Add to your `.env.local` file:

```env
# ElevenLabs Conversational AI Agent ID (Client-side - safe to expose)
# This is NOT a secret - it's just an identifier for your agent
NEXT_PUBLIC_ELEVENLABS_AGENT_ID=your_agent_id_here

# Optional: If you want to use ElevenLabs TTS/STT separately (Server-side)
ELEVENLABS_API_KEY=sk_your_api_key_here
ELEVENLABS_VOICE_ID=your_voice_id_here
```

**Important Security Notes:**
- ✅ `NEXT_PUBLIC_ELEVENLABS_AGENT_ID` - Safe to expose (it's public)
- ❌ `ELEVENLABS_API_KEY` - NEVER add NEXT_PUBLIC prefix (keep server-side only)

## Step 3: Restart Your Development Server

After adding environment variables, restart:

```bash
npm run dev
```

## Step 4: Test the Integration

1. Navigate to your farmer dashboard (root page after login)
2. Look for the AgroVoice interface
3. Click "Talk to AgroVoice"
4. Allow microphone access when prompted
5. Speak your farming question
6. The agent should respond with voice

## Component Architecture

```
AgriAid Application
       │
       ├─ app/page.tsx (Main farmer dashboard)
       │   └─ Uses: <VoiceAgent />
       │
       └─ components/VoiceAgent/
           ├─ VoiceAgent.tsx (Main component)
           └─ VoiceAgent.css (Styling)
```

## Usage in Your Components

### Basic Usage

```tsx
import VoiceAgent from "@/components/VoiceAgent/VoiceAgent";

export default function MyPage() {
  return (
    <div>
      <VoiceAgent />
    </div>
  );
}
```

### Advanced Usage with Callbacks

```tsx
import VoiceAgent from "@/components/VoiceAgent/VoiceAgent";

export default function MyPage() {
  const handleUserSpeech = (transcript: string) => {
    console.log("Farmer said:", transcript);
    // Store in database, log for analytics, etc.
  };

  const handleAgentResponse = (response: string) => {
    console.log("AgroVoice responded:", response);
    // Save recommendation, generate PDF, etc.
  };

  return (
    <VoiceAgent
      onTranscriptReceived={handleUserSpeech}
      onAgentResponse={handleAgentResponse}
    />
  );
}
```

### Using Custom Agent ID

```tsx
<VoiceAgent agentId="your_custom_agent_id_here" />
```

## Features

### ✅ Implemented

- [x] Microphone permission handling
- [x] Connection state management
- [x] Error handling with user-friendly messages
- [x] Prevent multiple simultaneous conversations
- [x] Clean connection termination
- [x] Visual feedback for all states (idle, connecting, connected, error)
- [x] Animated listening indicator
- [x] Responsive design
- [x] Kenyan agricultural focus

### 🔜 Future Enhancements

- [ ] Client-side tools (weather lookup, soil analysis)
- [ ] Webhook integration with backend
- [ ] Conversation history logging
- [ ] Multi-language UI support
- [ ] Offline mode with cached responses
- [ ] Voice activity detection visualization

## Troubleshooting

### "Agent ID is not configured"

**Problem:** Environment variable not set or not loading

**Solution:**
1. Verify `.env.local` has `NEXT_PUBLIC_ELEVENLABS_AGENT_ID`
2. Restart dev server: `npm run dev`
3. Clear Next.js cache: `rm -rf .next`

### "We couldn't access your microphone"

**Problem:** Microphone permission denied

**Solution:**
1. Check browser settings → Site permissions → Microphone
2. Ensure you're using HTTPS (or localhost for development)
3. Try a different browser (Chrome and Firefox recommended)

### "Your browser doesn't support microphone access"

**Problem:** Using an outdated browser

**Solution:**
1. Update your browser to the latest version
2. Use Chrome, Firefox, Safari, or Edge

### "Could not connect to AgroVoice"

**Problem:** Network or agent configuration issue

**Solution:**
1. Check internet connection
2. Verify Agent ID is correct
3. Ensure agent is active in ElevenLabs dashboard
4. Check ElevenLabs service status

### Agent doesn't respond

**Problem:** Agent configuration or knowledge base issue

**Solution:**
1. Test agent directly in ElevenLabs dashboard
2. Verify system prompt is configured
3. Check agent's knowledge base has content
4. Ensure agent is in "Active" state

## Testing Your Agent

### Test in ElevenLabs Dashboard

Before integrating, test your agent:

1. Go to https://elevenlabs.io/app/conversational-ai
2. Select your AgroVoice agent
3. Click "Test" or "Preview"
4. Speak sample questions:
   - "What crops grow well in sandy soil?"
   - "How do I manage aphids on my tomatoes?"
   - "When is the best time to plant maize in Kenya?"
5. Verify responses are appropriate and helpful

### Test in Your App

1. Start dev server: `npm run dev`
2. Navigate to farmer dashboard
3. Click "Talk to AgroVoice"
4. Test scenarios:
   - ✅ Successful connection
   - ✅ Asking farming questions
   - ✅ Interrupting the agent mid-response
   - ✅ Ending conversation
   - ✅ Starting new conversation after ending
   - ❌ Denying microphone access (error handling)
   - ❌ Network disconnection (reconnection handling)

## Agent Configuration Best Practices

### System Prompt Tips

1. **Be Specific About Scope**
   ```
   You ONLY provide agricultural advice. 
   If asked about non-farming topics, politely redirect to farming questions.
   ```

2. **Define Your Knowledge Boundaries**
   ```
   You specialize in Kenyan agriculture, focusing on:
   - Common Kenyan crops (maize, beans, tea, coffee, vegetables)
   - Local soil types and climate conditions
   - Pest and disease common in Kenya
   - Affordable farming practices for small-scale farmers
   ```

3. **Set Response Style**
   ```
   - Keep responses under 30 seconds
   - Use simple, practical language
   - Give actionable steps
   - Be encouraging and supportive
   ```

### Voice Selection

**For Kenyan Farmers:**
- Consider voice cloning with authentic Kenyan accent
- Use clear, medium-paced voices
- Avoid overly formal or technical-sounding voices

**Recommended Voices:**
- **Antoni** - Warm and friendly
- **Rachel** - Clear and professional
- **Adam** - Authoritative yet approachable

### Knowledge Base Setup

Add documents to your agent's knowledge base:

1. **Crop Guides**
   - Maize growing calendar
   - Vegetable cultivation tips
   - Coffee and tea farming practices

2. **Soil Management**
   - Kenyan soil types
   - Fertilizer recommendations
   - Organic amendments

3. **Pest & Disease**
   - Common pests in Kenya
   - Disease identification
   - Organic pest control methods

4. **Weather & Climate**
   - Planting calendar
   - Drought management
   - Rainy season preparation

## Future Tool Integration

The architecture is ready for future enhancements:

```
                    FARMER
                       │
                       ▼
                AgroVoice Voice
                       │
                       ▼
              ElevenLabs Agent
                       │
          ┌────────────┼─────────────┐
          ▼            ▼             ▼
       Weather        Soil         Crop
         Tool          Tool    Recommendation
          │            │             │
          └────────────┼─────────────┘
                       ▼
                 AgroVoice API
                       │
                       ▼
                 Database/ML
```

**Client Tools** (JavaScript functions the agent can call):
- Weather lookup
- Crop price checker
- Planting calendar lookup

**Server Tools** (Webhooks):
- Soil analysis database queries
- Crop recommendation ML models
- Historical data analysis

## Support

For issues with:

**ElevenLabs Integration:**
- ElevenLabs Documentation: https://docs.elevenlabs.io
- ElevenLabs Support: support@elevenlabs.io

**AgriAid Application:**
- Check GitHub issues
- Contact development team

## Resources

- [ElevenLabs Dashboard](https://elevenlabs.io/app/conversational-ai)
- [ElevenLabs Documentation](https://docs.elevenlabs.io)
- [ElevenLabs React SDK](https://github.com/elevenlabs/elevenlabs-js)
- [Voice Library](https://elevenlabs.io/app/voice-library)

---

**Ready to help Kenyan farmers with AgroVoice! 🌾🎤**
