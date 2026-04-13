import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      name,
      pincode,
      streetAddress,
      city,
      username,
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

    // Use placeholder values for missing address parts if needed
    const street = streetAddress || "";
    const city_val = city || "";
    const district_val = district || "";
    const pincode_val = pincode || "";
    const state_val = state || "";
    const country_val = country || "";

    const user_address = address || `${street}, ${city_val}, ${district_val}, ${pincode_val}, ${state_val}, ${country_val}`;

    // Use dummy email if username doesn't look like one
    const email = username.includes("@") ? username : `${username}@agriaid.com`;

    // 1. Create Supabase Auth User
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role,
          username
        }
      }
    });

    if (authError) {
      return NextResponse.json(
        { error: authError.message, success: false },
        { status: 400 }
      );
    }

    const fullAddress = user_address;

    // 2. Insert into profiles or labs table
    if (role === "soil-agent") {
      const { error: labError } = await supabase.from("labs").insert({
        id: userId,
        lab_name: labName,
        username,
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
      const { error: profileError } = await supabase.from("profiles").insert({
        id: userId,
        name,
        username,
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
    console.error("Error processing request:", error);
    return NextResponse.json(
      {
        error: (error as Error).message || "Something went wrong",
        success: false
      },
      { status: 500 }
    );
  }
}
