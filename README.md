# GIW - Soil Testing and Farmer Support Platform

GIW is a Next.js application that supports farmers and soil labs with soil sample registration, test progress tracking, report viewing, and smart recommendations.

## Overview

The app includes:

- Farmer and lab authentication flows
- Soil sample registration and status tracking
- Test result and report views
- Soil agent dashboard features
- Voice and multimodal assistant utilities
- News and learning resources for farmers

## Tech Stack

- Framework: Next.js 15 (App Router)
- Language: TypeScript
- UI: React 19, Tailwind CSS 4, Radix UI
- Data and auth: Supabase
- Integrations: Gemini API, Google Maps, Cloudinary, News API

## Prerequisites

- Node.js 20+
- npm 10+

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Create your environment file:

```bash
cp .env.example .env
```

If `.env.example` is not present, create `.env` manually with the variables listed below.

3. Run the development server:

```bash
npm run dev
```

4. Open http://localhost:3000

## Environment Variables

Set these values in `.env`:

```dotenv
# App base URL
NEXT_PUBLIC_DOMAIN=http://localhost:3000

# Auth
NEXT_PUBLIC_TOKEN_SECRETE=replace_with_a_strong_random_secret

# Gemini
NEXT_PUBLIC_GEMINI_API_KEY=replace_with_gemini_api_key

# Google Maps / Routes
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=replace_with_google_maps_api_key

# News API
NEXT_PUBLIC_NEWS_API_KEY=replace_with_news_api_key

# Supabase
NEXT_PUBLIC_SUPABASE_URL=replace_with_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=replace_with_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=replace_with_supabase_service_role_key

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=replace_with_cloudinary_upload_preset
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=replace_with_cloudinary_cloud_name
```

Notes:

- Do not commit real keys or secrets.
- `SUPABASE_SERVICE_ROLE_KEY` must only be used server-side.
- Keep `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` enabled (not commented out) when map features are needed.

## Available Scripts

- `npm run dev` - Start local dev server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Run production build
- `npm run lint` - Run lint checks

## Project Structure

```
app/
	(auth)/             # Login and signup pages
	(dashboard)/        # Dashboard routes
	(features)/         # Feature pages (sample registration, results, reports)
	(static)/           # Static pages (landing/how-to/soil-testing)
	api/                # Route handlers

components/
	auth/               # Auth forms
	farmerDashboard/    # Farmer dashboard UI blocks
	soilAgent/          # Soil agent dashboard components
	soilTestingRegistration/
	common/
	ui/

context/              # React context providers and state containers
lib/                  # Shared utilities and clients
models/               # Data model definitions
```

## Deployment

1. Set the same environment variables in your hosting provider.
2. Run `npm run build` to verify the app builds.
3. Deploy using a Next.js-compatible platform (for example, Vercel).

## Contributing

1. Create a branch: `git checkout -b feature/your-feature`
2. Commit your changes: `git commit -m "feat: add your feature"`
3. Push and open a pull request

## License

This project is licensed under the MIT License.
