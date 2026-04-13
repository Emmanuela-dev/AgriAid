import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  try {
    const id = req.nextUrl.pathname.split("/").pop();
    if (!id) {
      return new NextResponse(
        JSON.stringify({ message: "LabID is required", success: false }),
        {
          status: 400
        }
      );
    }

    const { data: lab, error } = await supabase
      .from("labs")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !lab) {
      return new NextResponse(
        JSON.stringify({ message: "Lab not found", success: false }),
        {
          status: 404
        }
      );
    }

    return new NextResponse(JSON.stringify({ lab, success: true }), {
      status: 200
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return new NextResponse(
      JSON.stringify({ error: errorMessage, success: false }),
      {
        status: 500
      }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const id = req.nextUrl.pathname.split("/").pop(); 
    if (!id) {
      return new NextResponse(
        JSON.stringify({ message: "LabID is required", success: false }),
        {
          status: 400
        }
      );
    }

    // 1. Check if lab exists
    const { data: labData, error: fetchError } = await supabase
      .from("labs")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !labData) {
      return new NextResponse(
        JSON.stringify({ message: "Lab not found", success: false }),
        {
          status: 404
        }
      );
    }

    const { username, farmName, samples } = await req.json();

    if (!username || !farmName || !samples) {
      return new NextResponse(
        JSON.stringify({ message: "Invalid data", success: false }),
        {
          status: 400
        }
      );
    }

    const samplesData = samples.map((item: string) => ({
      position: item,
      status: "pending"
    }));

    // 2. Update the users array in the lab record
    const existingUsers = labData.users || [];
    const updatedUsers = [
      ...existingUsers,
      {
        userId: username,
        farmName,
        sampleNames: samplesData
      }
    ];

    const { data: updatedLab, error: updateError } = await supabase
      .from("labs")
      .update({ users: updatedUsers })
      .eq("id", id)
      .select()
      .single();

    if (updateError) throw updateError;

    return new NextResponse(
      JSON.stringify({
        message: "Sample registered successfully",
        success: true,
        data: updatedLab
      }),
      {
        status: 201
      }
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return new NextResponse(
      JSON.stringify({ error: errorMessage, success: false }),
      {
        status: 500
      }
    );
  }
}
