import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    // Sign out from Supabase Auth
    await supabase.auth.signOut();

    const response = NextResponse.json({
      message: "Logout successful",
      success: true,
    });
    
    // Clear custom JWT token cookie
    response.cookies.set("token", "", {
      httpOnly: true,
    });

    // Clear role cookie
    response.cookies.set("role", "", {
      httpOnly: true,
    });

    return response;
  } catch (error) {
    return new NextResponse(JSON.stringify(error), { status: 500 });
  }
}
