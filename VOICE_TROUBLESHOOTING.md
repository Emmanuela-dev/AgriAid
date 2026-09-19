# AgroVoice Troubleshooting Guide

## Error: "Cannot read properties of undefined (reading 'getUserMedia')"

### Root Cause
The browser's `navigator.mediaDevices` API is undefined. This happens when:

1. **Running on HTTP instead of HTTPS** (most common)
   - Modern browsers block microphone access on insecure connections
   - Exception: `localhost` and `127.0.0.1` are allowed on HTTP

2. **Server-Side Rendering (SSR)**
   - The `navigator` object doesn't exist during SSR
   - Fixed by checking `isMounted` state before rendering

3. **Unsupported Browser**
   - Very old browsers don't support `getUserMedia`
   - Rare on modern systems

---

## Solutions

### 1. Use HTTPS or Localhost (RECOMMENDED)

#### Option A: Use localhost
```bash
npm run dev
# Access at: http://localhost:3000 (NOT your IP address)
```

#### Option B: Use HTTPS in development
Install `mkcert` for local HTTPS:

```bash
# Install mkcert (Windows)
choco install mkcert

# Create certificate
mkcert -install
mkcert localhost 127.0.0.1

# Update your dev script in package.json:
"dev": "next dev --experimental-https"
```

### 2. Access via Localhost, Not IP
❌ **DON'T**: `http://172.19.0.1:3000` (IP address)
✅ **DO**: `http://localhost:3000`

Even though they point to the same server, browsers only allow microphone access on:
- `localhost`
- `127.0.0.1`
- HTTPS connections

### 3. Check Browser Permissions
1. Click the lock/info icon in the browser address bar
2. Ensure "Microphone" is set to "Allow"
3. Reload the page

### 4. Use a Supported Browser
- ✅ Chrome/Edge (recommended)
- ✅ Firefox
- ✅ Safari (macOS/iOS)
- ❌ Internet Explorer (not supported)

---

## Testing the Fix

1. **Start the dev server:**
   ```bash
   npm run dev
   ```

2. **Access the app:**
   ```
   http://localhost:3000
   ```

3. **Click the phone icon in the AgroVoice orb**

4. **Allow microphone access when prompted**

5. **Speak naturally** - AgroVoice should respond

---

## Current Implementation

The VoiceChat component now includes:

✅ Client-side mounting check (`isMounted`)
✅ Browser support detection
✅ Secure context validation
✅ Clear error messages
✅ Microphone permission handling
✅ User-friendly alerts

---

## Production Deployment

For production, you **MUST** use HTTPS:

### Vercel/Netlify (automatic HTTPS)
```bash
vercel deploy
# or
netlify deploy --prod
```

### Docker with HTTPS
Use a reverse proxy like Nginx or Caddy:

```yaml
# docker-compose.yml
services:
  agriaid:
    build: .
    ports:
      - "3000:3000"
  
  nginx:
    image: nginx:alpine
    ports:
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./certs:/etc/nginx/certs
```

---

## Verification Checklist

- [ ] App accessible at `http://localhost:3000`
- [ ] Browser is Chrome, Firefox, or Edge
- [ ] ElevenLabs Agent ID is set in `.env.local`
- [ ] Microphone permission granted
- [ ] No console errors related to `getUserMedia`
- [ ] Voice call connects successfully

---

## Still Having Issues?

1. **Check the browser console** for specific error messages
2. **Verify environment variables** are loaded correctly
3. **Test microphone** in another app (e.g., Discord, Zoom)
4. **Clear browser cache** and reload
5. **Try incognito mode** to rule out extension conflicts

---

## Technical Details

The fix involves:

```tsx
// 1. Client-side mounting
const [isMounted, setIsMounted] = useState(false);

useEffect(() => {
  setIsMounted(true);
}, []);

if (!isMounted) return null;

// 2. Browser support check
const supported = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);

// 3. Secure context check
if (!window.isSecureContext) {
  alert("Voice calls require HTTPS or localhost");
  return;
}

// 4. Request permission before starting
await navigator.mediaDevices.getUserMedia({ audio: true });
await conversation.startSession({ agentId: AGENT_ID });
```

This ensures the browser APIs are only accessed when available and in the correct context.
