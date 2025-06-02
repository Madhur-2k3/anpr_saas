// app/api/add-vehicle/route.js
// import { connectDB, Vehicle } from "./../../lib/mongo";
import { connectDB, Vehicle } from "../../../lib/mongo";

import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const data = await req.json();
    const { plate, owner, phone } = data;

    if (!plate || !owner || !phone) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    await connectDB();
    const vehicle = await Vehicle.create({ plate, owner, phone });

    return NextResponse.json({ message: "Vehicle added", vehicle });
  } catch (err) {
    console.error("Add Vehicle Error:", err);
    return NextResponse.json({ error: "Insert failed" }, { status: 500 });
  }
}
