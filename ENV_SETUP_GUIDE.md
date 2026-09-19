# Environment Variables Setup Guide

## Required Configuration

Your `.env.local` file needs several environment variables for AgriAid to work properly. Here's how to get each one:

---

## 🔴 CRITICAL - Must Have (App Won't Start Without These)

### 1. Supabase Configuration

**Purpose:** Database and authentication backend

**How to Get:**

1. Go to: https://supabase.com
2. Sign up or log in
3. Create a new project (or select existing)
4. Go to **Project Settings** → **API**
5. Copy the following:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

**⚠️ Without these, you'll get the error you're seeing now.**

### 2. JWT Secret

**Purpose:** Secure token generation for user authentication

**How to Generate:**

```bash
# Option 1: Use Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Option 2: Use OpenSSL
openssl rand -hex 64

# Option 3: Online generator
# Visit: https://generate-secret.vercel.app/64
```

Add to `.env.local`:
```env
NEXT_PUBLIC_TOKEN_SECRETE=your-generated-secret-here
```

**⚠️ Keep this secret! Never commit to git.**

---

## 🟡 Important - Needed for Full Functionality

### 3. ElevenLabs Agent ID

**Purpose:** Voice assistant (AgroVoice)

**How to Get:**

1. Go to: https://elevenlabs.io/app/conversational-ai
2. Create a new agent named "AgroVoice"
3. Copy the Agent ID

```env
NEXT_PUBLIC_ELEVENLABS_AGENT_ID=agent_abc123xyz...
```

**Status:** ✅ Already set in your `.env.local`

### 4. Domain Configuration

**Purpose:** API endpoint resolution

```env
# Development
NEXT_PUBLIC_DOMAIN=http://localhost:3000

# Production (when deploying)
NEXT_PUBLIC_DOMAIN=https://your-domain.com
```

---

## 🟢 Optional - Enhanced Features

### 5. ElevenLabs TTS/STT (Optional)

**Purpose:** Standalone text-to-speech and speech-to-text (not needed if using Conversational AI)

**How to Get:**

1. Go to: https://elevenlabs.io/app/settings/api-keys
2. Create API key
3. Go to: https://elevenlabs.io/app/voice-library
4. Choose a voice and copy Voice ID

```env
ELEVENLABS_API_KEY=sk_your_api_key_here
ELEVENLABS_VOICE_ID=your_voice_id_here
```

### 6. Cloudinary (Optional)

**Purpose:** Image uploads and storage

**How to Get:**

1. Go to: https://cloudinary.com
2. Sign up or log in
3. Go to Dashboard
4. Create upload preset:
   - Settings → Upload → Upload presets
   - Add preset (unsigned)

```env
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your-preset-name
```

### 7. News API (Optional)

**Purpose:** Agricultural news in dashboard

**How to Get:**

1. Go to: https://newsdata.io
2. Sign up for free account
3. Copy API key

```env
NEXT_PUBLIC_NEWS_API_KEY=your-newsdata-api-key
```

---

## Complete `.env.local` Template

```env
# ========================================
# CRITICAL - REQUIRED FOR APP TO START
# ========================================

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key-here

# JWT Secret (generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
NEXT_PUBLIC_TOKEN_SECRETE=your-64-char-secret-here

# Domain
NEXT_PUBLIC_DOMAIN=http://localhost:3000

# ========================================
# IMPORTANT - VOICE ASSISTANT
# ========================================

# ElevenLabs Conversational AI Agent ID
NEXT_PUBLIC_ELEVENLABS_AGENT_ID=agent_8801m2mstsf1fcyvw0kyc5h5b7ym

# ========================================
# OPTIONAL - ENHANCED FEATURES
# ========================================

# ElevenLabs TTS/STT (optional if using Conversational AI)
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
ELEVENLABS_VOICE_ID=your_voice_id_here

# Cloudinary (for image uploads)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_upload_preset

# News API (for news feed)
NEXT_PUBLIC_NEWS_API_KEY=your_newsdata_io_api_key
```

---

## Quick Setup Steps

### 1. Supabase Setup (5 minutes)

```bash
# 1. Create Supabase project
# 2. Copy URL and keys
# 3. Add to .env.local
# 4. Set up database tables (if needed)
```

**Database Tables Needed:**
- `users` - User accounts
- `yards` - Farm yards
- `samples` - Soil samples
- `labs` - Laboratory information

### 2. Generate JWT Secret (30 seconds)

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Copy output to `NEXT_PUBLIC_TOKEN_SECRETE`

### 3. Domain Configuration (30 seconds)

```env
NEXT_PUBLIC_DOMAIN=http://localhost:3000
```

### 4. Restart Server

```bash
npm run dev
```

---

## Verification Checklist

After adding environment variables:

- [ ] `.env.local` file exists in project root
- [ ] Supabase URL is set
- [ ] Supabase keys are set
- [ ] JWT secret is generated and set
- [ ] Domain is configured
- [ ] ElevenLabs Agent ID is set (for voice)
- [ ] Server restarted after changes
- [ ] No error on startup
- [ ] Can access http://localhost:3000

---

## Troubleshooting

### Error: "supabaseUrl is required"

**Problem:** Missing Supabase configuration

**Solution:**
1. Add `NEXT_PUBLIC_SUPABASE_URL` to `.env.local`
2. Add `NEXT_PUBLIC_SUPABASE_ANON_KEY` to `.env.local`
3. Add `SUPABASE_SERVICE_ROLE_KEY` to `.env.local`
4. Restart server

### Error: "Set NEXT_PUBLIC_TOKEN_SECRETE"

**Problem:** Missing JWT secret

**Solution:**
1. Generate secret: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`
2. Add to `.env.local`: `NEXT_PUBLIC_TOKEN_SECRETE=generated-secret`
3. Restart server

### Error: "Agent ID is not configured"

**Problem:** Missing ElevenLabs Agent ID

**Solution:**
1. Create agent at https://elevenlabs.io/app/conversational-ai
2. Copy Agent ID
3. Add to `.env.local`: `NEXT_PUBLIC_ELEVENLABS_AGENT_ID=your-agent-id`
4. Restart server

### Environment Variables Not Loading

**Problem:** Changes to `.env.local` not taking effect

**Solution:**
1. Stop dev server (Ctrl+C)
2. Delete `.next` folder: `rm -rf .next` (or manually)
3. Restart: `npm run dev`

---

## Security Best Practices

### ✅ DO:
- Keep `.env.local` in `.gitignore` (already done)
- Use `NEXT_PUBLIC_` prefix only for client-side variables
- Generate strong, random JWT secrets
- Rotate secrets periodically
- Use different secrets for dev/staging/production

### ❌ DON'T:
- Commit `.env.local` to git
- Share secrets in chat/email
- Use simple or guessable secrets
- Expose server-side keys with `NEXT_PUBLIC_` prefix
- Use production keys in development

---

## Production Deployment

When deploying to production:

1. **Vercel/Netlify/etc:**
   - Add environment variables in dashboard
   - Use production values
   - Keep secrets secure

2. **Update Domain:**
   ```env
   NEXT_PUBLIC_DOMAIN=https://your-production-domain.com
   ```

3. **Supabase:**
   - Use production project
   - Update connection strings
   - Configure RLS policies

4. **Generate New Secrets:**
   - Don't reuse dev secrets
   - Generate new JWT secret
   - Create production API keys

---

## Need Help?

**Missing Information:**
- Supabase: https://supabase.com/docs
- ElevenLabs: https://docs.elevenlabs.io
- JWT: https://jwt.io

**Still Stuck?**
1. Check all required variables are set
2. Verify no typos in variable names
3. Ensure server was restarted
4. Check browser console for specific errors
5. Review Supabase dashboard for project status

---

**Your `.env.local` is now properly configured! 🎉**

Restart your server and the error should be gone.
