import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ message: "API routing works!" });
}

export async function POST(req: Request) {
  const body = await req.json();
  return NextResponse.json({ 
    message: "POST API works!", 
    received: body 
  });
}
