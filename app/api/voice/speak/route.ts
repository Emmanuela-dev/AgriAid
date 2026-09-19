import { NextResponse } from "next/server";

const elevenLabsApiKey = process.env.ELEVENLABS_API_KEY;
const voiceId = process.env.ELEVENLABS_VOICE_ID;

export async function POST(request: Request) {
  if (!elevenLabsApiKey || !voiceId) {
    return NextResponse.json(
      { error: "ElevenLabs voice configuration is missing." },
      { status: 500 },
    );
  }

  const body = (await request.json()) as { text?: string };
  if (!body.text?.trim()) {
    return NextResponse.json({ error: "Text is required." }, { status: 400 });
  }

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
    {
      method: "POST",
      headers: {
        Accept: "audio/mpeg",
        "Content-Type": "application/json",
        "xi-api-key": elevenLabsApiKey,
      },
      body: JSON.stringify({
        text: body.text,
        model_id: "eleven_multilingual_v2",
        voice_settings: { stability: 0.45, similarity_boost: 0.8, speed: 1.1 },
      }),
    },
  );

  if (!response.ok) {
    const details = await response.text();
    console.error("ElevenLabs speech failed:", details);
    return NextResponse.json({ error: "ElevenLabs speech generation failed." }, { status: response.status });
  }

  return new NextResponse(await response.arrayBuffer(), {
    headers: { "Content-Type": "audio/mpeg", "Cache-Control": "no-store" },
  });
}