# Network & Connection Troubleshooting

## Supabase Connection Timeout Error

### Error Message
```
TypeError: fetch failed
ConnectTimeoutError: Connect Timeout Error 
(attempted address: dmikshufvgdthecfmjsu.supabase.co:443, timeout: 10000ms)
code: 'UND_ERR_CONNECT_TIMEOUT'
```

### Common Causes

1. **Slow/Unstable Internet Connection**
   - Timeout occurs when connection takes >10 seconds
   - Common on mobile networks or poor WiFi

2. **Firewall/Proxy Blocking**
   - Corporate/school networks may block Supabase
   - Antivirus software may interfere with connections

3. **VPN/DNS Issues**
   - Some VPNs block or slow down external API calls
   - DNS resolution failures

4. **Supabase Service Issues** (rare)
   - Check status at: https://status.supabase.com/

---

## Quick Fixes

### 1. Check Your Internet Connection
```bash
# Test connectivity to Supabase
ping dmikshufvgdthecfmjsu.supabase.co

# Test HTTPS access
curl -I https://dmikshufvgdthecfmjsu.supabase.co
```

### 2. Restart Your Development Server
```bash
# Stop the server (Ctrl+C)
# Then restart
npm run dev
```

### 3. Clear DNS Cache
**Windows:**
```powershell
ipconfig /flushdns
```

**Mac/Linux:**
```bash
sudo dscacheutil -flushcache
sudo killall -HUP mDNSResponder
```

### 4. Try a Different Network
- Switch from WiFi to mobile hotspot (or vice versa)
- Disconnect VPN if you're using one
- Try a different WiFi network

### 5. Check Firewall Settings
- Temporarily disable antivirus/firewall
- If using Windows Defender, allow Node.js through firewall
- Check if ports 443 (HTTPS) and 3000 (dev server) are open

### 6. Update Environment Variables
Ensure `.env.local` has correct Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://dmikshufvgdthecfmjsu.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

---

## Microphone Permission Issue

### Issue
App shows "Browser doesn't support microphone" or permission denied errors.

### Solutions

#### On Mobile (Android/iOS)

**Android Chrome:**
1. Open Chrome settings (three dots)
2. Go to Settings → Site Settings → Microphone
3. Find your site (localhost or your domain)
4. Change to "Allow"

**iOS Safari:**
1. Go to iOS Settings → Safari → Microphone
2. Change to "Allow"
3. Reload the page

**Android/iOS Firefox:**
1. Visit the site
2. Tap the lock icon in address bar
3. Change Microphone permission to "Allow"

#### On Desktop

**Chrome/Edge:**
1. Click the lock icon (🔒) in the address bar
2. Find "Microphone" in permissions
3. Change to "Allow"
4. Reload the page

**Firefox:**
1. Click the lock icon in the address bar
2. Click "Clear permissions and revisit"
3. Allow microphone when prompted again

**Safari:**
1. Safari → Settings → Websites → Microphone
2. Find your site and change to "Allow"

---

## Best Practices for Mobile

### 1. Use HTTPS (Production)
For production deployment on mobile devices, you **MUST** use HTTPS.

Deploy to:
- **Vercel** (automatic HTTPS)
- **Netlify** (automatic HTTPS)
- **AWS Amplify** (automatic HTTPS)

### 2. Test on Localhost First
For development:
```
✅ http://localhost:3000 (works on desktop)
❌ http://192.168.x.x:3000 (won't work for microphone on mobile)
```

### 3. Mobile Testing with HTTPS
Use a tunneling service for mobile testing:

**Option A: ngrok**
```bash
npm install -g ngrok
npm run dev
# In another terminal:
ngrok http 3000
# Use the https://xxx.ngrok.io URL on mobile
```

**Option B: localtunnel**
```bash
npm install -g localtunnel
npm run dev
# In another terminal:
lt --port 3000
```

---

## Current Implementation Improvements

### What's Been Fixed

1. **Microphone Permission Modal**
   - Shows on page load if permission not granted
   - Clear instructions for enabling microphone
   - Different messages for different permission states

2. **Browser Support Detection**
   - Checks for getUserMedia API support
   - Shows helpful error if browser doesn't support it

3. **Permission State Tracking**
   - Monitors permission changes in real-time
   - Updates UI accordingly

4. **Better Error Messages**
   - User-friendly error explanations
   - Step-by-step instructions to fix issues

### Expected Behavior

**On First Load:**
1. Modal appears asking to enable microphone
2. User clicks "Enable Microphone"
3. Browser shows permission prompt
4. User grants permission
5. Modal closes
6. User can now start voice call

**If Permission Denied:**
1. Modal shows instructions to re-enable
2. Guides user to browser settings
3. Provides "Reload Page" button

**If Browser Unsupported:**
1. Shows clear error message
2. Suggests using modern browsers

---

## Testing Checklist

### Desktop Testing
- [ ] Access via `http://localhost:3000`
- [ ] Permission modal appears on load
- [ ] Can grant microphone permission
- [ ] Voice call starts successfully
- [ ] No Supabase timeout errors

### Mobile Testing (Production)
- [ ] Deploy to Vercel/Netlify
- [ ] Access via HTTPS URL
- [ ] Permission modal appears
- [ ] Can grant microphone on mobile browser
- [ ] Voice conversation works

### Network Testing
- [ ] Works on WiFi
- [ ] Works on mobile data
- [ ] Works with/without VPN
- [ ] Supabase connection succeeds

---

## Still Having Issues?

### Debug Steps

1. **Check Browser Console**
   - Open DevTools (F12)
   - Look for specific error messages
   - Share full error stack trace

2. **Test Supabase Connection**
   ```javascript
   // In browser console:
   fetch('https://dmikshufvgdthecfmjsu.supabase.co')
     .then(res => console.log('Connected:', res.ok))
     .catch(err => console.error('Failed:', err))
   ```

3. **Test Microphone Access**
   ```javascript
   // In browser console:
   navigator.mediaDevices.getUserMedia({ audio: true })
     .then(stream => {
       console.log('Microphone works!');
       stream.getTracks().forEach(track => track.stop());
     })
     .catch(err => console.error('Microphone error:', err))
   ```

4. **Check Environment Variables**
   ```bash
   # In terminal:
   echo $NEXT_PUBLIC_ELEVENLABS_AGENT_ID
   echo $NEXT_PUBLIC_SUPABASE_URL
   ```

5. **Verify Network Connectivity**
   - Visit https://dmikshufvgdthecfmjsu.supabase.co in browser
   - Should show Supabase API response
   - If it doesn't load, network/firewall issue

---

## Quick Summary

| Issue | Solution |
|-------|----------|
| Supabase timeout | Check internet, restart dev server, flush DNS |
| Microphone denied | Check browser permissions, use localhost/HTTPS |
| Browser unsupported | Use Chrome, Firefox, Edge, or Safari |
| Mobile not working | Deploy to HTTPS (Vercel/Netlify) or use ngrok |
| Network blocked | Disable VPN/firewall, try different network |

---

## Contact & Resources

- **Supabase Status**: https://status.supabase.com/
- **ElevenLabs Status**: https://status.elevenlabs.io/
- **Test Microphone**: https://www.onlinemictest.com/
- **Test Network**: https://fast.com/
