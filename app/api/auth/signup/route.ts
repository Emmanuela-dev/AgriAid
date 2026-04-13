import { NextRequest, NextResponse } from "next/server";
import { supabase, supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      name,
      pincode,
      streetAddress,
      city,
      password,
      role,
      country,
      state,
      district,
      latitude,
      longitude,
      labName,
      phone,
      address
    } = body;

    const username = body?.username ?? body?.email;
    const email = username;

    if (!email || !password || !role) {
      return NextResponse.json(
        { error: "Email, password and role are required", success: false },
        { status: 400 }
      );
    }

    // Use placeholder values for missing address parts if needed
    const street = streetAddress || "";
    const city_val = city || "";
    const district_val = district || "";
    const pincode_val = pincode || "";
    const state_val = state || "";
    const country_val = country || "";

    const user_address = address || `${street}, ${city_val}, ${district_val}, ${pincode_val}, ${state_val}, ${country_val}`;

    // 1. Create Supabase Auth User
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role,
          username: email
        }
      }
    });

    if (authError) {
      // Provide clear, specific error messages for common Supabase errors
      let errorMessage = authError.message;
      if (authError.message.includes("rate limit") || authError.status === 429) {
        errorMessage = "Too many signup attempts. Please wait a few minutes and try again.";
      } else if (authError.message.includes("already registered") || authError.message.includes("already exists")) {
        errorMessage = "This email is already registered. Please log in instead.";
      } else if (authError.message.includes("invalid") && authError.message.includes("email")) {
        errorMessage = "Please enter a valid email address (e.g. name@gmail.com).";
      }
      return NextResponse.json(
        { error: errorMessage, success: false },
        { status: 400 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: "User creation failed", success: false },
        { status: 400 }
      );
    }

    const userId = authData.user.id;
    const fullAddress = user_address;

    // 2. Insert into profiles or labs table using admin client to bypass RLS
    if (role === "soil-agent") {
      const { error: labError } = await supabaseAdmin.from("labs").insert({
        id: userId,
        lab_name: labName,
        username: email,
        phone,
        address: {
          country,
          state,
          district,
          fulladdress: fullAddress,
          pincode,
          city,
          streetaddress: streetAddress
        },
        position: latitude && longitude ? { latitude, longitude } : null
      });

      if (labError) throw labError;
    } else {
      const { error: profileError } = await supabaseAdmin.from("profiles").insert({
        id: userId,
        name,
        username: email,
        role,
        address: fullAddress,
      });

      if (profileError) throw profileError;
    }

    return NextResponse.json(
      { message: "User created successfully", success: true },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup error:", error);
    const errorMsg = error instanceof Error ? error.message : JSON.stringify(error);
    console.error("Error details:", errorMsg);
    return NextResponse.json(
      {
        error: errorMsg || "Something went wrong",
        success: false
      },
      { status: 500 }
    );
  }
}
