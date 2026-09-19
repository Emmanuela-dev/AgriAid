# 🚨 Quick Fix: "supabaseUrl is required" Error

## The Problem

Your app is missing Supabase environment variables, causing it to crash on startup.

## The Solution (2 Minutes)

### Step 1: Get Your Supabase Keys

1. Go to: **https://supabase.com/dashboard**
2. Select your project (or create one)
3. Click **Settings** (gear icon) → **API**
4. Copy these values:

```
Project URL: https://xxxxxxxxxxxxx.supabase.co
anon public: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
service_role: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (click "Reveal" to see)
```

### Step 2: Add to `.env.local`

Open `.env.local` and make sure you have:

```env
# Supabase (REQUIRED - App won't start without these)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# JWT Secret (REQUIRED)
NEXT_PUBLIC_TOKEN_SECRETE=generate_this_with_command_below

# Domain (REQUIRED)
NEXT_PUBLIC_DOMAIN=http://localhost:3000

# ElevenLabs (for voice - already set)
NEXT_PUBLIC_ELEVENLABS_AGENT_ID=agent_8801m2mstsf1fcyvw0kyc5h5b7ym
```

### Step 3: Generate JWT Secret

Run this command in your terminal:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Copy the output and paste it as `NEXT_PUBLIC_TOKEN_SECRETE` value.

### Step 4: Restart Server

```bash
# Stop current server (Ctrl+C)
npm run dev
```

## Still Getting Errors?

### Check These:

1. **File Location:** `.env.local` must be in project root (same folder as `package.json`)

2. **No Spaces:** 
   ```env
   # ❌ Wrong
   NEXT_PUBLIC_SUPABASE_URL = https://...
   
   # ✅ Correct
   NEXT_PUBLIC_SUPABASE_URL=https://...
   ```

3. **No Quotes:**
   ```env
   # ❌ Wrong
   NEXT_PUBLIC_SUPABASE_URL="https://..."
   
   # ✅ Correct
   NEXT_PUBLIC_SUPABASE_URL=https://...
   ```

4. **Server Restarted:** Always restart after changing `.env.local`

## Don't Have a Supabase Project?

### Create One (Free - 3 Minutes)

1. Go to: https://supabase.com
2. Click "Start your project"
3. Sign in with GitHub
4. Click "New Project"
5. Fill in:
   - **Name:** AgriAid
   - **Database Password:** (generate strong password)
   - **Region:** Choose closest to you
6. Click "Create new project"
7. Wait 2 minutes for project to initialize
8. Copy your keys (Settings → API)

## Minimal Working `.env.local`

If you just want to get it running quickly:

```env
# Supabase - Get from https://supabase.com/dashboard
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-key-here

# JWT Secret - Generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
NEXT_PUBLIC_TOKEN_SECRETE=your-generated-secret-here

# Domain
NEXT_PUBLIC_DOMAIN=http://localhost:3000

# ElevenLabs Voice (already configured)
NEXT_PUBLIC_ELEVENLABS_AGENT_ID=agent_8801m2mstsf1fcyvw0kyc5h5b7ym
```

## Full Documentation

For complete setup instructions, see:
- **ENV_SETUP_GUIDE.md** - Detailed environment setup
- **ELEVENLABS_FINAL_SETUP.md** - Voice assistant setup

---

**After fixing, your app will start successfully! 🎉**
