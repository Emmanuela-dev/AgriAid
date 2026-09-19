# AgroVoice - Voice Agent Component

## Overview

The VoiceAgent component provides voice interaction capabilities for AgriAid using ElevenLabs Conversational AI. It allows farmers to speak naturally and receive voice responses from an AI agent specialized in agricultural advice.

## Features

✅ **Microphone Permission Handling** - Graceful request and error handling  
✅ **Connection State Management** - Visual feedback for all states  
✅ **Error Handling** - User-friendly error messages  
✅ **Multiple Conversation Prevention** - Prevents simultaneous connections  
✅ **Clean Termination** - Proper cleanup on disconnect  
✅ **Animated UI** - Professional, agricultural-themed interface  
✅ **Responsive Design** - Works on mobile and desktop  
✅ **Accessibility** - ARIA labels and keyboard navigation  

## File Structure

```
components/VoiceAgent/
├── VoiceAgent.tsx       # Main component
├── VoiceAgent.css       # Styles
└── README.md            # This file
```

## Usage

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

### With Callbacks

```tsx
import VoiceAgent from "@/components/VoiceAgent/VoiceAgent";

export default function MyPage() {
  const handleTranscript = (text: string) => {
    console.log("User said:", text);
    // Log to database, analytics, etc.
  };

  const handleResponse = (text: string) => {
    console.log("Agent responded:", text);
    // Save recommendation, generate PDF, etc.
  };

  return (
    <VoiceAgent
      onTranscriptReceived={handleTranscript}
      onAgentResponse={handleResponse}
    />
  );
}
```

### Custom Agent ID

```tsx
<VoiceAgent agentId="your_custom_agent_id" />
```

### With Custom Styling

```tsx
<VoiceAgent className="my-custom-class" />
```

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `agentId` | `string` | No | From env var | ElevenLabs Agent ID |
| `onTranscriptReceived` | `(text: string) => void` | No | - | Called when user speaks |
| `onAgentResponse` | `(text: string) => void` | No | - | Called when agent responds |
| `className` | `string` | No | `""` | Additional CSS classes |

## Environment Configuration

Add to `.env.local`:

```env
# ElevenLabs Conversational AI Agent ID
NEXT_PUBLIC_ELEVENLABS_AGENT_ID=your_agent_id_here
```

**Important:** The Agent ID is safe to expose publicly. Never add `NEXT_PUBLIC_` prefix to your API key!

## States

### 1. Idle State
- **Appearance:** Microphone icon, "Talk to AgroVoice" title
- **Action:** Click to start conversation
- **Behavior:** Requests microphone permission and connects

### 2. Connecting State
- **Appearance:** Spinner animation, "Connecting to AgroVoice..."
- **Action:** Automatically transitions to connected
- **Behavior:** Establishes connection with ElevenLabs

### 3. Connected State
- **Appearance:** Pulsing microphone, "AgroVoice is listening"
- **Action:** Speak naturally; click "End Call" to stop
- **Behavior:** Active voice conversation

### 4. Error State
- **Appearance:** Error icon, error message
- **Action:** Click "Try Again" to restart
- **Behavior:** Shows user-friendly error message

## Error Handling

### Permission Denied
```
We couldn't access your microphone. 
Please allow microphone access and try again.
```

### No Microphone Found
```
No microphone found. 
Please connect a microphone and try again.
```

### Browser Not Supported
```
Your browser doesn't support microphone access. 
Please use a modern browser like Chrome or Firefox.
```

### Agent Not Configured
```
Agent ID is not configured. 
Please add NEXT_PUBLIC_ELEVENLABS_AGENT_ID to your environment variables.
```

### Connection Failed
```
Could not connect to AgroVoice. 
Please try again later.
```

## Styling

The component uses custom CSS with Tailwind-compatible classes. Colors match the AgriAid green theme:

- Primary Green: `#22c55e`
- Dark Green: `#16a34a`
- Light Green Gradient: `#f0fdf4` to `#dcfce7`

### Custom Animations

- **Pulse** - Animated microphone indicator
- **Ripple** - Expanding circles on active state
- **Fade In** - Smooth state transitions
- **Shake** - Error state attention grabber
- **Spin** - Loading spinner

## Integration Example

### In Farmer Dashboard

```tsx
// app/page.tsx or components/Dashboard.tsx
import AgroVoiceComponent from "@/components/farmerDashboard/AgroVoiceComponent";

export default function Dashboard() {
  return (
    <main>
      {/* Your dashboard content */}
      <AgroVoiceComponent />
    </main>
  );
}
```

This provides a floating action button that opens a full-screen voice interface.

## Browser Compatibility

| Browser | Version | Support |
|---------|---------|---------|
| Chrome | 80+ | ✅ Full |
| Firefox | 75+ | ✅ Full |
| Safari | 14+ | ✅ Full |
| Edge | 80+ | ✅ Full |
| Opera | 67+ | ✅ Full |

**Note:** HTTPS is required for microphone access (localhost exempt for development).

## Troubleshooting

### Component doesn't render

**Check:**
1. Environment variable is set: `NEXT_PUBLIC_ELEVENLABS_AGENT_ID`
2. Dev server was restarted after adding env var
3. No TypeScript errors in console

### Microphone not working

**Check:**
1. Browser permissions: Settings → Privacy → Microphone
2. Using HTTPS (or localhost)
3. Microphone is connected and working
4. No other app is using the microphone

### Connection fails immediately

**Check:**
1. Internet connection is active
2. Agent ID is correct (no typos)
3. Agent is active in ElevenLabs dashboard
4. No firewall blocking WebSocket connections

### No audio from agent

**Check:**
1. Device volume is not muted
2. Speaker/headphones are connected
3. Browser audio permissions enabled
4. Agent has voice configured in dashboard

## Testing

### Manual Testing Checklist

- [ ] Click "Talk to AgroVoice" button
- [ ] Microphone permission prompt appears
- [ ] Allow microphone access
- [ ] "Connecting..." state shows briefly
- [ ] "AgroVoice is listening" appears
- [ ] Speak a farming question
- [ ] Agent responds with voice
- [ ] Click "End Call"
- [ ] Returns to idle state
- [ ] Try again - works properly

### Error Scenarios

- [ ] Deny microphone permission → Shows error
- [ ] Invalid Agent ID → Shows error
- [ ] No internet → Shows error
- [ ] Start conversation twice → Prevents duplicate

## Performance Considerations

### Optimizations

1. **Lazy Loading** - Component can be code-split
2. **Memoization** - Callbacks wrapped in `useCallback`
3. **Cleanup** - Proper cleanup on unmount
4. **State Management** - Minimal re-renders

### Best Practices

```tsx
// Use with React.lazy for code splitting
const VoiceAgent = lazy(() => import("@/components/VoiceAgent/VoiceAgent"));

// In component
<Suspense fallback={<LoadingSpinner />}>
  <VoiceAgent />
</Suspense>
```

## Future Enhancements

### Planned Features

- [ ] Client-side tools (weather, soil lookup)
- [ ] Conversation history persistence
- [ ] Multi-language UI labels
- [ ] Voice activity visualization
- [ ] Offline mode with cached responses
- [ ] Screen reader improvements
- [ ] Keyboard shortcuts

### Webhook Integration (Future)

```tsx
// Configure agent with webhooks in ElevenLabs dashboard
// Tool calls will be handled server-side
<VoiceAgent
  agentId="agent_with_tools"
  onToolCall={(toolName, args) => {
    console.log(`Tool called: ${toolName}`, args);
  }}
/>
```

## Support

For issues or questions:

- **Component Issues:** Check console logs
- **ElevenLabs Issues:** https://docs.elevenlabs.io
- **AgriAid Issues:** Contact development team

## License

Part of the AgriAid project. See project LICENSE file for details.

---

**Built with 🌾 for Kenyan farmers**
