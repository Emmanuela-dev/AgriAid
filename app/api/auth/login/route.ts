import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import jwt from "jsonwebtoken";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const username = body?.username ?? body?.email;
    const email = username;
    const { password, role } = body;

    if (!email || !password || !role) {
      return new NextResponse(
        JSON.stringify({ error: "Email, password, and role are required", success: false }),
        { status: 400 }
      );
    }

    // 1. Sign in with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.user) {
      return new NextResponse(
        JSON.stringify({ error: authError?.message || "Invalid credentials", success: false }),
        { status: 400 }
      );
    }

    // 2. Validate role from user metadata
    const userRole = authData.user.user_metadata?.role;
    if (userRole !== role) {
      // Sign out if role mismatch to prevent unauthorized session
      await supabase.auth.signOut();
      return new NextResponse(
        JSON.stringify({ error: "Unauthorized role access", success: false }),
        { status: 403 }
      );
    }

    // 3. Create our custom token to maintain existing cookie-based flow
    // In a full migration, we would use Supabase's access/refresh tokens.
    // For now, we keep the custom token to avoid breaking the rest of the app.
    const tokenData = {
      id: authData.user.id,
      role: userRole
    };

    const token = jwt.sign(tokenData, process.env.NEXT_PUBLIC_TOKEN_SECRETE!, {
      expiresIn: "1d"
    });

    const response = NextResponse.json({
      message: "Login successful",
      success: true,
      role: userRole
    });

    response.cookies.set("token", token, {
      httpOnly: true
    });

    response.cookies.set("role", role, {
      httpOnly: true
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    const errorMsg = error instanceof Error ? error.message : JSON.stringify(error);
    console.error("Error details:", errorMsg);
    return new NextResponse(
      JSON.stringify({ error: errorMsg || "Internal server error", success: false }),
      { status: 500 }
    );
  }
}
