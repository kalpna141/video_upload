import { NextRequest, NextResponse } from "next/server";

import { connectDb } from "@/lib/db";
import User from "@/app/models/User";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    if (!email || !password) {
      return NextResponse.json(
        {
          error: "Email and passowrd are required",
        },
        { status: 400 }
      );
    }
    await connectDb();
    const isExist = await User.findOne({ email });
    if (isExist) {
      return NextResponse.json(
        {
          error: "User already registered",
        },
        { status: 400 }
      );
    }
    const user = await User.create({
      email,
      password,
    });
    return NextResponse.json(
      {
        message: "User  registered successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to register user",
      },
      { status: 400 }
    );
  }
}
