import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("farmer");
    const labId = searchParams.get("soil-agent");

    if (!userId && !labId) {
      return new NextResponse(
        JSON.stringify({
          message: "user or lab ID is required",
          success: false,
        }),
        { status: 400 }
      );
    }

    let query = supabase.from("yards").select("*");
    
    if (userId) {
      query = query.eq("user_id", userId);
    } else if (labId) {
      query = query.eq("lab_id", labId);
    }

    const { data: yardsList, error } = await query;

    if (error) {
      throw error;
    }

    if (!yardsList || yardsList.length === 0) {
      return new NextResponse(
        JSON.stringify({ message: "No yards found", success: false }),
        { status: 404 }
      );
    }

    // Map snake_case from DB to camelCase for frontend compatibility
    const formattedYards = yardsList.map(yard => ({
      ...yard,
      userId: yard.user_id,
      labId: yard.lab_id,
      yardId: yard.yard_id,
      yardName: yard.yard_name,
      updatedAt: yard.updated_at
    }));

    return new NextResponse(
      JSON.stringify({ yards: formattedYards, success: true }),
      { status: 200 }
    );
  } catch (error) {
    return new NextResponse(
      JSON.stringify({ error: (error as Error).message, success: false }),
      {
        status: 500,
      }
    );
  }
}
