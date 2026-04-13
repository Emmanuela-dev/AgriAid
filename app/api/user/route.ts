import { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("token")?.value || "";
    const role = req.cookies.get("role")?.value || "";

    if (!token) {
      return new NextResponse(
        JSON.stringify({ message: "User not authenticated", success: false }),
        { status: 401 }
      );
    }
    const decodedToken = jwt.verify(
      token,
      process.env.NEXT_PUBLIC_TOKEN_SECRETE!
    );

    if (typeof decodedToken !== "string" && "id" in decodedToken) {
      const { data, error } = await supabase
        .from(role === "soil-agent" ? "labs" : "profiles")
        .select("*")
        .eq("id", decodedToken.id)
        .single();

      if (error || !data) {
        return new NextResponse(
          JSON.stringify({ message: "User not found", success: false }),
          { status: 404 }
        );
      }

      const user = { ...data };
      // Passwords are not stored in our profiles/labs tables anymore, 
      // they are managed by Supabase Auth, so no need to delete sensitive fields.
      
      return new NextResponse(
        JSON.stringify({
          message: "User authenticated",
          success: true,
          user: user
        }),
        { status: 200 }
      );
    } else {
      throw new Error("Invalid token payload");
    }
  } catch (error) {
    return new NextResponse(JSON.stringify(error), { status: 500 });
  }
}
