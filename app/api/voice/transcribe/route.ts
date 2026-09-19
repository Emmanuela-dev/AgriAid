import { NextResponse } from "next/server";

const elevenLabsApiKey = process.env.ELEVENLABS_API_KEY;

export async function POST(request: Request) {
  if (!elevenLabsApiKey) {
    return NextResponse.json(
      { error: "ELEVENLABS_API_KEY is not configured." },
      { status: 500 },
    );
  }

  const incoming = await request.formData();
  const audio = incoming.get("audio");
  if (!(audio instanceof Blob)) {
    return NextResponse.json({ error: "An audio recording is required." }, { status: 400 });
  }

  const formData = new FormData();
  formData.append("file", audio, "agriaid-question.wav");
  formData.append("model_id", "scribe_v1");

  const response = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
    method: "POST",
    headers: { "xi-api-key": elevenLabsApiKey },
    body: formData,
  });

  if (!response.ok) {
    const details = await response.text();
    console.error("ElevenLabs transcription failed:", details);
    return NextResponse.json({ error: "ElevenLabs transcription failed." }, { status: response.status });
  }

  const result = (await response.json()) as { text?: string };
  return NextResponse.json({ text: result.text?.trim() || "" });
}