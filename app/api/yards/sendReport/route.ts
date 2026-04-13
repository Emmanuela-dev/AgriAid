import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();

    const { sampleId, yardId, suggestions, fileUrl, nutrients } = body.result;

    // Validate required fields
    if (!sampleId) {
      return new NextResponse(
        JSON.stringify({ message: "Sample ID is required", success: false }),
        { status: 400 }
      );
    }

    if (!yardId) {
      return new NextResponse(
        JSON.stringify({ message: "Yard ID is required", success: false }),
        { status: 400 }
      );
    }

    // Retrieve yard document from Supabase
    const { data: yardData, error: fetchError } = await supabase
      .from("yards")
      .select("*")
      .eq("yard_id", yardId)
      .single();

    if (fetchError || !yardData) {
      return new NextResponse(
        JSON.stringify({ message: "Yard not found", success: false }),
        { status: 404 }
      );
    }

    if (!yardData.samples || !Array.isArray(yardData.samples)) {
      return new NextResponse(
        JSON.stringify({
          message: "No samples found in this yard",
          success: false,
        }),
        { status: 404 }
      );
    }

    // Update the specific sample
    const updatedSamples = yardData.samples.map((sample: any) =>
      sample.sampleId === sampleId
        ? { ...sample, pdfUrl: fileUrl, suggestions, nutrients, status: "completed" }
        : sample
    );

    const sampleFound = updatedSamples.some(
      (sample: any) => sample.sampleId === sampleId
    );

    if (!sampleFound) {
      return new NextResponse(
        JSON.stringify({ message: "Sample not found in yard", success: false }),
        { status: 404 }
      );
    }

    // Update the yard document in Supabase
    const { data: updatedYard, error: updateError } = await supabase
      .from("yards")
      .update({
        samples: updatedSamples,
        updated_at: new Date().toISOString()
      })
      .eq("yard_id", yardId)
      .select()
      .single();

    if (updateError) throw updateError;

    return new NextResponse(
      JSON.stringify({
        message: "Sample status updated successfully",
        yard: { 
          ...updatedYard,
          userId: updatedYard.user_id,
          labId: updatedYard.lab_id,
          yardId: updatedYard.yard_id,
          yardName: updatedYard.yard_name,
          updatedAt: updatedYard.updated_at
        },
        success: true,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating sample status:", error);
    return new NextResponse(
      JSON.stringify({
        error:
          error instanceof Error ? error.message : "An unknown error occurred",
        success: false,
      }),
      { status: 500 }
    );
  }
}
