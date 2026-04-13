import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  try {
    const id = req.nextUrl.pathname.split("/").pop();
    if (!id) {
      return new NextResponse(
        JSON.stringify({ message: "yardId is required", success: false }),
        {
          status: 400,
        }
      );
    }

    const { data: yard, error } = await supabase
      .from("yards")
      .select("*")
      .eq("yard_id", id)
      .single();

    if (error || !yard) {
      return new NextResponse(
        JSON.stringify({ message: "yard not found", success: false }),
        {
          status: 404,
        }
      );
    }

    // Map snake_case from DB to camelCase for frontend compatibility
    const formattedYard = {
      ...yard,
      userId: yard.user_id,
      labId: yard.lab_id,
      yardId: yard.yard_id,
      yardName: yard.yard_name,
      updatedAt: yard.updated_at
    };

    return new NextResponse(JSON.stringify({ yard: formattedYard, success: true }), {
      status: 200,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return new NextResponse(
      JSON.stringify({ error: errorMessage, success: false }),
      {
        status: 500,
      }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    // Parse request body
    const body = await req.json();
    const { sampleId, status, yardId, userId } = body;

    // Validate required fields
    const requiredFields = [
      { field: sampleId, message: "Sample ID is required" },
      { field: yardId, message: "Yard ID is required" },
      { field: status, message: "Status is required" },
    ];

    for (const { field, message } of requiredFields) {
      if (!field) {
        return new NextResponse(JSON.stringify({ message, success: false }), {
          status: 400,
        });
      }
    }

    // Validate status
    const validStatuses = ["pending", "in-process", "completed"];
    if (!validStatuses.includes(status)) {
      return new NextResponse(
        JSON.stringify({
          message: "Invalid status value",
          validStatuses,
          success: false,
        }),
        { status: 400 }
      );
    }

    // Retrieve yard document from Supabase
    // Note: yardId in the request might refer to the 'yard_id' (string) or the primary key 'id'
    // Looking at the context, it's often the Firestore auto-id, which is mapping to our 'id' (UUID)
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

    // Validate samples
    if (!yardData.samples || !Array.isArray(yardData.samples)) {
      return new NextResponse(
        JSON.stringify({
          message: "No samples found in this yard",
          success: false,
        }),
        { status: 404 }
      );
    }

    // Find and update the specific sample
    const updatedSamples = yardData.samples.map((sample: any) =>
      sample.sampleId === sampleId ? { ...sample, status } : sample
    );

    // Verify sample was found
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

    // Return success response
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
    // Log and handle any unexpected errors
    console.error("Error updating sample status:", error);
    return new NextResponse(
      JSON.stringify({
        error:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
        success: false,
      }),
      { status: 500 }
    );
  }
}
