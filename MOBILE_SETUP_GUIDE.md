# Mobile Setup Guide for AgroVoice

## Important: HTTPS Required for Mobile

Mobile browsers **require HTTPS** for microphone access. There are two ways to test on mobile:

---

## Option 1: Deploy to Production (Recommended)

### Quick Deploy with Vercel (Free)

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Deploy**
   ```bash
   vercel
   ```
   
3. **Follow the prompts**
   - Link to your account
   - Confirm project settings
   - Deploy!

4. **Get your HTTPS URL**
   ```
   https://your-project.vercel.app
   ```

5. **Add environment variables in Vercel Dashboard**
   - Go to your project settings
   - Add all variables from `.env.local`
   - Redeploy if needed

6. **Access on mobile**
   - Open the HTTPS URL on your phone
   - Grant microphone permission when prompted
   - Start talking to AgroVoice!

---

## Option 2: Use ngrok for Local Testing

### Setup ngrok Tunnel

1. **Install ngrok**
   ```bash
   npm install -g ngrok
   ```

2. **Start your dev server**
   ```bash
   npm run dev
   ```

3. **In another terminal, start ngrok**
   ```bash
   ngrok http 3000
   ```

4. **Copy the HTTPS URL**
   ```
   Forwarding: https://abc123.ngrok.io -> http://localhost:3000
   ```

5. **Open on your mobile device**
   - Type the `https://abc123.ngrok.io` URL in your mobile browser
   - Grant permissions when asked
   - Test the voice features!

---

## Enabling Microphone on Mobile Browsers

### Android Chrome

1. **When prompted:**
   - Tap "Allow" when the browser asks for microphone access

2. **If you accidentally denied:**
   - Tap the lock icon (🔒) in the address bar
   - Tap "Permissions"
   - Find "Microphone" and change to "Allow"
   - Refresh the page

3. **From Chrome Settings:**
   - Chrome menu (⋮) → Settings
   - Site Settings → Microphone
   - Find your site and set to "Allow"

### Android Firefox

1. **When prompted:**
   - Tap "Allow" on the permission prompt

2. **If denied:**
   - Tap the lock icon in the address bar
   - Tap the arrow (→) next to site info
   - Find "Microphone" and toggle it on
   - Refresh the page

### iOS Safari

1. **First time:**
   - When the modal appears, tap "Enable Microphone"
   - Safari will ask for permission
   - Tap "Allow"

2. **If denied:**
   - Go to iOS Settings → Safari → Microphone
   - Change to "Allow"
   - Return to the site and refresh

3. **Per-site settings:**
   - Tap "AA" or "🔒" in the address bar
   - Tap "Website Settings"
   - Change Microphone to "Allow"

### iOS Chrome

1. **First time:**
   - Grant permission when prompted

2. **If denied:**
   - Go to iOS Settings → Chrome → Microphone
   - Enable "Allow"
   - Return to the site and refresh

---

## What You'll See on Mobile

### 1. Permission Modal (On Load)
```
╔═══════════════════════════╗
║    Enable Microphone      ║
║                           ║
║  AgroVoice needs access   ║
║  to your microphone to    ║
║  have voice conversations ║
║                           ║
║  [Enable Microphone]      ║
║  [Maybe Later]            ║
╚═══════════════════════════╝
```

### 2. Browser Permission Prompt
```
Allow "your-site.com" to use
your microphone?

    [Block]  [Allow]
```

### 3. Voice Interface
- Animated cyan/blue gradient orb
- Phone icon button
- Status text below orb
- Chat panel on the side

### 4. Active Call
- Orb spins slowly
- Status: "Connected"
- "Speak naturally, I'm listening"
- Red phone icon to end call

---

## Troubleshooting Mobile Issues

### Issue: "Browser Not Supported"
**Cause:** Very old browser or WebView that doesn't support getUserMedia

**Fix:**
- Update your browser to the latest version
- Use Chrome, Firefox, or Safari (not in-app browsers)
- Don't open links from social media apps (they use WebView)

### Issue: "Microphone Access Denied"
**Cause:** Permission was denied previously

**Fix:**
1. Tap "Enable Microphone" button in the modal
2. Follow the instructions shown
3. Or go to browser/system settings and enable manually
4. Reload the page

### Issue: Can't hear AgroVoice
**Cause:** Volume is muted or too low

**Fix:**
- Check device volume
- Unmute if muted
- Check browser tab isn't muted (on desktop)
- Test with another audio source to confirm speaker works

### Issue: AgroVoice can't hear me
**Cause:** Microphone is blocked or not working

**Fix:**
1. Check microphone permission is granted
2. Test microphone in another app (voice recorder)
3. Make sure you're not on mute
4. Try a different browser
5. Restart your device

### Issue: Connection Failed
**Cause:** Network issues or not using HTTPS

**Fix:**
- Ensure you're using HTTPS URL (not HTTP)
- Check your internet connection
- Try switching WiFi/mobile data
- Disable VPN if enabled

---

## Testing Checklist for Mobile

- [ ] Site is deployed with HTTPS (or using ngrok)
- [ ] Permission modal appears on page load
- [ ] Can tap "Enable Microphone" button
- [ ] Browser shows permission prompt
- [ ] Can grant permission successfully
- [ ] Modal closes after granting permission
- [ ] Can tap phone icon to start call
- [ ] Animated orb starts spinning
- [ ] Can speak and AgroVoice responds
- [ ] Can hear AgroVoice's responses clearly
- [ ] Can end call with red phone icon
- [ ] Chat messages appear in the panel

---

## Network Requirements

### Minimum Requirements
- **HTTPS** (mandatory for mobile)
- **Stable internet** (WiFi or 4G/5G)
- **Open ports:** 443 (HTTPS)

### Recommended
- **Good WiFi or 4G+** for voice quality
- **Wired internet** for best experience (desktop)
- **Low latency** (<100ms ping to servers)

---

## Privacy & Security on Mobile

### What AgroVoice Can Access
- ✅ Microphone (only when call is active)
- ✅ Speaker (for voice responses)

### What AgroVoice Cannot Access
- ❌ Camera
- ❌ Contacts
- ❌ Location (unless you explicitly share)
- ❌ Files/Photos
- ❌ Other apps

### Data Handling
- Voice is processed by ElevenLabs servers
- Conversations are not permanently recorded
- Chat history stored locally on your device
- You can clear chat history anytime

### Permissions Can Be Revoked
- Microphone access can be disabled anytime
- Simply go to browser/system settings
- Or deny permission on next visit

---

## Production Deployment Recommendations

### Best Platforms for Mobile Access

1. **Vercel** (Recommended)
   - Automatic HTTPS
   - Global CDN
   - Zero config
   - Free tier available

2. **Netlify**
   - Automatic HTTPS
   - Easy deployment
   - Good mobile performance
   - Free tier available

3. **AWS Amplify**
   - Scalable
   - HTTPS included
   - Good for larger apps

### Domain Setup (Optional)

If you have a custom domain:

1. **Configure DNS**
   ```
   CNAME @ your-project.vercel.app
   ```

2. **Add domain in Vercel/Netlify**
   - Project Settings → Domains
   - Add your domain
   - Wait for SSL certificate (automatic)

3. **Update environment variables**
   ```env
   NEXT_PUBLIC_DOMAIN=https://yourdomain.com
   ```

4. **Test on mobile**
   - Access via your domain
   - Verify HTTPS is working
   - Test microphone access

---

## Quick Start (Mobile User)

**As a farmer using AgroVoice on your phone:**

1. **Open the app** in your mobile browser
   - Must be HTTPS URL
   - Chrome, Firefox, or Safari recommended

2. **Grant microphone access**
   - Tap "Enable Microphone" when prompted
   - Tap "Allow" in browser prompt

3. **Start voice call**
   - Tap the phone icon on the animated orb
   - Wait for "Connected" status

4. **Start talking!**
   - Ask about crops, soil, weather, farming
   - Speak naturally
   - AgroVoice will respond

5. **End call**
   - Tap the red phone icon when done

That's it! 🌾🎙️
