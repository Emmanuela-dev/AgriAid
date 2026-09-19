# AgroVoice Quick Start 🚀

## Get Your Voice Assistant Running in 5 Minutes

### Step 1: Create Your ElevenLabs Agent (3 minutes)

1. **Sign up or log in** to ElevenLabs
   ```
   https://elevenlabs.io
   ```

2. **Go to Conversational AI**
   ```
   https://elevenlabs.io/app/conversational-ai
   ```

3. **Create a new agent**
   - Click "Create Agent" button
   - Name: `AgroVoice` or `AgriAid Assistant`

4. **Configure the agent**
   
   **System Prompt:**
   ```
   You are AgroVoice, an agricultural assistant for Kenyan farmers.
   
   You help with:
   - Crop recommendations
   - Soil health advice
   - Pest and disease management
   - Weather-appropriate farming tips
   - Kenyan farming best practices
   
   Speak clearly and practically. Use simple language.
   Be encouraging and supportive like a local agricultural extension officer.
   ```

   **Voice Selection:**
   - Choose: Antoni, Rachel, or Adam
   - Or clone a voice with Kenyan accent

5. **Save and copy your Agent ID**
   - After saving, copy the Agent ID
   - Format: `agent_abc123xyz...`

### Step 2: Configure Your App (1 minute)

1. **Open `.env.local`** in your project root

2. **Add your Agent ID:**
   ```env
   NEXT_PUBLIC_ELEVENLABS_AGENT_ID=paste_your_agent_id_here
   ```

3. **Save the file**

### Step 3: Restart Your Server (30 seconds)

```bash
# Stop current server (Ctrl+C or Cmd+C)
npm run dev
```

### Step 4: Test It! (30 seconds)

1. **Open your browser:**
   ```
   http://localhost:3000/agrovoice-test
   ```

2. **Verify setup** - Should show ✓ for Agent ID

3. **Click "Start Conversation"**

4. **Allow microphone access**

5. **Speak a question:**
   - "What crops grow well in sandy soil?"
   - "How do I manage aphids on tomatoes?"
   - "When should I plant maize in Kenya?"

6. **Listen to the response!** 🎉

### Step 5: Use in Your App

The floating AgroVoice button is now live on your dashboard!

**To access:**
1. Log in to AgriAid
2. Look for the green floating microphone button (bottom-right)
3. Click and start talking!

## Troubleshooting

### "Agent ID is not configured"

❌ Problem: Environment variable not loaded

✅ Solution:
1. Check `.env.local` has the Agent ID
2. Restart dev server: `npm run dev`
3. Hard refresh browser: Ctrl+F5

### "We couldn't access your microphone"

❌ Problem: Microphone permission denied

✅ Solution:
1. Browser settings → Permissions → Microphone → Allow
2. Ensure you're on localhost or HTTPS
3. Check if another app is using the microphone

### No response from agent

❌ Problem: Agent not properly configured

✅ Solution:
1. Go to ElevenLabs dashboard
2. Check agent status is "Active"
3. Verify system prompt is saved
4. Test agent directly in dashboard first

## What's Next?

### Customize Your Agent

**Add Knowledge Base:**
1. In ElevenLabs dashboard, go to your agent
2. Click "Knowledge" tab
3. Upload farming guides, crop calendars, pest control PDFs
4. Agent will use this information to answer questions!

**Adjust Voice Settings:**
- Speaking speed
- Clarity
- Interruption handling

### Add Tools (Future)

```tsx
// Client-side tools (JavaScript)
const weatherTool = {
  name: "check_weather",
  handler: async (location: string) => {
    // Fetch weather
    return weatherData;
  }
};
```

### Track Conversations

```tsx
<AgroVoiceComponent
  onTranscriptReceived={(text) => {
    // Log user questions
    logToAnalytics(text);
  }}
  onAgentResponse={(response) => {
    // Save recommendations
    saveRecommendation(response);
  }}
/>
```

## Resources

📚 **Full Documentation:**
- Setup Guide: `AGROVOICE_SETUP.md`
- Component Docs: `components/VoiceAgent/README.md`
- Integration Summary: `INTEGRATION_SUMMARY.md`

🌐 **External Links:**
- [ElevenLabs Dashboard](https://elevenlabs.io/app/conversational-ai)
- [ElevenLabs Docs](https://docs.elevenlabs.io)
- [Voice Library](https://elevenlabs.io/app/voice-library)

🧪 **Test Page:**
```
http://localhost:3000/agrovoice-test
```

## Need Help?

1. **Check test page** - `/agrovoice-test` shows diagnostics
2. **Read setup guide** - `AGROVOICE_SETUP.md` has detailed troubleshooting
3. **Check console** - Browser DevTools shows detailed errors
4. **ElevenLabs Support** - support@elevenlabs.io

---

**That's it! You're ready to help farmers with voice AI 🌾🎤**
