// import { connectDB, Vehicle } from "@/lib/mongo";
import { connectDB, Vehicle } from "../../../lib/mongo";
import { NextResponse } from "next/server";
import FormData from "form-data";
import axios from "axios";

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get("image");

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Read file into buffer directly
    const buffer = Buffer.from(await file.arrayBuffer());

    // Send to Plate Recognizer directly
    const form = new FormData();
    form.append("upload", buffer, {
      filename: file.name,
      contentType: file.type || "image/jpeg",
    });

    const plateRes = await axios.post(
      "https://api.platerecognizer.com/v1/plate-reader/",
      form,
      {
        headers: {
          ...form.getHeaders(),
          Authorization: `Token ${process.env.PLATE_API_KEY}`,
        },
      }
    );

    const results = plateRes.data.results;
    if (!results.length) {
      return NextResponse.json({ status: "no_plate_detected" });
    }

    const plate = results[0].plate.toUpperCase();

    await connectDB();
    const match = await Vehicle.findOne({ plate });

    if (match) {
      return NextResponse.json({ status: "found", plate, info: match });
    } else {
      return NextResponse.json({ status: "not_found", plate });
    }
  } catch (err) {
    console.error("ANPR error:", err);
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}
