# Migration: Gemini to ElevenLabs

## Overview

The AgriAid voice system has been migrated from Google Gemini Live API to ElevenLabs Conversational AI for improved voice quality, better conversation handling, and easier maintenance.

## What Changed

### Before (Gemini)
- **API**: Google Gemini Live API
- **Component**: `VoiceChat.tsx` with `ControlTray.tsx`
- **Dependencies**: Custom `LiveAPIContext`, `useLiveAPIContext`, `MultimodalLiveClient`
- **Configuration**: `NEXT_PUBLIC_GEMINI_API_KEY`
- **Features**: Real-time streaming, video support, complex state management

### After (ElevenLabs)
- **API**: ElevenLabs Conversational AI
- **Component**: `VoiceChat.tsx` (simplified)
- **Dependencies**: `@elevenlabs/react` package
- **Configuration**: `NEXT_PUBLIC_ELEVENLABS_AGENT_ID`
- **Features**: Voice-only conversations, simpler state management, better error handling

## Files Modified

### Updated
1. **`components/farmerDashboard/VoiceChat.tsx`**
   - Removed Gemini Live API integration
   - Removed LiveAPIContext dependency
   - Removed ControlTray dependency
   - Added ElevenLabs `useConversation` hook
   - Simplified connection/disconnection logic
   - Improved error handling

2. **`components/farmerDashboard/HomeComponent.tsx`**
   - Re-added floating voice button
   - Updated to toggle new VoiceChat component

3. **`app/page.tsx`**
   - Now uses AgroVoiceComponent (newer implementation)
   - Can also use updated VoiceChat

4. **`.env.local`**
   - Added `NEXT_PUBLIC_ELEVENLABS_AGENT_ID`
   - Marked `NEXT_PUBLIC_GEMINI_API_KEY` as deprecated

### Legacy Files (Not Modified)
These files are no longer used but kept for reference:

- `context/LiveAPIContext.tsx` - Gemini context
- `hooks/use-live-api.ts` - Gemini hook
- `lib/multimodal-live-client.ts` - Gemini client
- `components/control-tray/ControlTray.tsx` - Gemini control UI
- `lib/audio-streamer.ts` - Gemini audio handling
- `lib/worklets/vol-meter.ts` - Gemini volume meter

**Note:** These can be safely deleted if you don't plan to use Gemini anymore.

## Configuration Changes

### Old Environment Variables (DEPRECATED)
```env
# No longer needed
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_key
```

### New Environment Variables (REQUIRED)
```env
# Primary voice agent configuration
NEXT_PUBLIC_ELEVENLABS_AGENT_ID=your_elevenlabs_agent_id

# Optional: For standalone TTS/STT features
ELEVENLABS_API_KEY=your_api_key
ELEVENLABS_VOICE_ID=your_voice_id
```

## Migration Steps

If you're migrating from an existing Gemini setup:

### 1. Create ElevenLabs Agent

1. Go to https://elevenlabs.io/app/conversational-ai
2. Create a new agent
3. Configure system prompt for agricultural advice
4. Choose appropriate voice
5. Copy the Agent ID

### 2. Update Environment Variables

Edit `.env.local`:

```env
# Add this
NEXT_PUBLIC_ELEVENLABS_AGENT_ID=your_agent_id_here

# Remove or comment out
# NEXT_PUBLIC_GEMINI_API_KEY=old_gemini_key
```

### 3. Restart Development Server

```bash
npm run dev
```

### 4. Test the New Integration

1. Navigate to your farmer dashboard
2. Click the floating microphone button
3. Allow microphone access
4. Speak a farming question
5. Verify voice response from ElevenLabs

### 5. Clean Up (Optional)

If you're fully committed to ElevenLabs, you can remove:

```bash
# Optional: Remove unused files
rm -rf context/LiveAPIContext.tsx
rm -rf hooks/use-live-api.ts
rm -rf lib/multimodal-live-client.ts
rm -rf components/control-tray/
rm -rf lib/audio-streamer.ts
rm -rf lib/worklets/
```

**Warning:** Only do this if you're 100% sure you won't need Gemini again!

## Feature Comparison

| Feature | Gemini Live API | ElevenLabs AI | Winner |
|---------|----------------|---------------|--------|
| Voice Quality | Good | Excellent | ElevenLabs |
| Setup Complexity | High | Low | ElevenLabs |
| Conversation Flow | Manual management | Built-in | ElevenLabs |
| Multilingual | Good | Excellent | ElevenLabs |
| Video Support | Yes | No | Gemini |
| Cost | Pay per use | Pay per use | Tie |
| Error Handling | Manual | Built-in | ElevenLabs |
| State Management | Complex | Simple | ElevenLabs |
| Interruption Handling | Manual | Automatic | ElevenLabs |
| Knowledge Base | Manual | Built-in | ElevenLabs |

## Benefits of ElevenLabs

### 1. Simplified Codebase
- **Before:** 500+ lines of context, hooks, and client code
- **After:** Direct use of `@elevenlabs/react` hook

### 2. Better Voice Quality
- Natural-sounding voices
- Support for voice cloning (Kenyan accents)
- Multiple language support built-in

### 3. Easier Configuration
- Just one Agent ID needed
- Agent configuration in dashboard
- No complex API setup

### 4. Built-in Features
- Conversation management
- Interruption handling
- Error recovery
- Connection state management

### 5. Knowledge Base Integration
- Upload farming documents to agent
- Agent automatically references them
- No need to implement RAG yourself

## Troubleshooting

### "VoiceChat not working"

**Check:**
1. `NEXT_PUBLIC_ELEVENLABS_AGENT_ID` is set in `.env.local`
2. Dev server was restarted after adding env var
3. Agent is active in ElevenLabs dashboard
4. Microphone permissions are granted

### "Agent not responding"

**Check:**
1. Agent has a system prompt configured
2. Agent status is "Active" in dashboard
3. Network connection is working
4. Browser console for errors

### "Missing audio output"

**Check:**
1. Agent has a voice selected
2. Device volume is not muted
3. Browser audio permissions enabled
4. No other app using audio

## Rollback Plan

If you need to rollback to Gemini (not recommended):

1. Revert `components/farmerDashboard/VoiceChat.tsx`
2. Re-add `NEXT_PUBLIC_GEMINI_API_KEY` to `.env.local`
3. Uncomment LiveAPIContext in imports
4. Restart dev server

**Note:** The old Gemini implementation is preserved in git history if needed.

## Next Steps

### Enhance Your ElevenLabs Agent

1. **Add Knowledge Base**
   - Upload farming guides
   - Add crop calendars
   - Include pest management docs

2. **Configure Voice**
   - Clone a voice with Kenyan accent
   - Adjust speaking speed
   - Set interruption behavior

3. **Add Client Tools** (Future)
   - Weather lookup
   - Crop price checker
   - Planting calendar

4. **Add Server Webhooks** (Future)
   - Soil analysis queries
   - ML crop recommendations
   - Historical data access

## Support

**ElevenLabs Issues:**
- Docs: https://docs.elevenlabs.io
- Support: support@elevenlabs.io
- Dashboard: https://elevenlabs.io/app/conversational-ai

**Migration Questions:**
- See `AGROVOICE_SETUP.md` for setup guide
- See `INTEGRATION_SUMMARY.md` for technical details
- Check `/agrovoice-test` page for diagnostics

## Summary

✅ **Voice system migrated from Gemini to ElevenLabs**  
✅ **Simpler codebase and configuration**  
✅ **Better voice quality and conversation handling**  
✅ **Easier to maintain and extend**  
✅ **Ready for production use**  

**Action Required:** Add your ElevenLabs Agent ID to `.env.local` and restart the server!

---

**Migration completed successfully! 🎉**
