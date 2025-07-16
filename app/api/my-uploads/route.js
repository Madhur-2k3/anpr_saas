// import { connectDB, Upload } from "@/lib/mongo";
import {Upload,connectDB} from "../../../lib/mongo"
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET(req) {
  const { userId } = getAuth(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const uploads = await Upload.find({ userId }).sort({ createdAt: -1 });

  return NextResponse.json(uploads);
}