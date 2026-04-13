import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { v4 } from "uuid";

export async function GET() {
  try {
    const { data: labsList, error } = await supabase
      .from("labs")
      .select("*");

    if (error) throw error;

    return new NextResponse(JSON.stringify({ labs: labsList, success: true }), {
      status: 200,
    });
  } catch (error) {
    return new NextResponse(JSON.stringify({ error, success: false }), {
      status: 500,
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { yardName, samples, labId, userId } = body;
    
    const generateId = () => {
      const prefix = "ST";
      const number = Math.floor(10000 + Math.random() * 90000);
      return prefix + number;
    };

    const samplesData = (samples as string[]).map((sample) => ({
      sampleId: generateId(),
      sampleName: sample,
      status: "registered",
    }));

    const yardId = v4();

    const yardData = {
      yard_name: yardName,
      samples: samplesData,
      lab_id: labId,
      user_id: userId,
      yard_id: yardId,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase.from("yards").insert(yardData).select().single();

    if (error) throw error;

    // Return camelCase for frontend compatibility
    const formattedYard = {
      ...data,
      yardName: data.yard_name,
      labId: data.lab_id,
      userId: data.user_id,
      yardId: data.yard_id,
      updatedAt: data.updated_at
    };

    return new NextResponse(
      JSON.stringify({
        message: "Yard created successfully",
        createdYard: formattedYard,
        success: true,
      }),
      { status: 201 }
    );
  } catch (error) {
    console.log(error);

    return new NextResponse(
      JSON.stringify({ message: "Internal Error", success: false }),
      {
        status: 500,
      }
    );
  }
}
