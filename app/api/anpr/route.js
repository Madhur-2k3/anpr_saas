// // import { connectDB, Vehicle } from "@/lib/mongo";
// import { connectDB, Vehicle } from "../../../lib/mongo";
// import { NextResponse } from "next/server";
// import FormData from "form-data";
// import axios from "axios";

// export async function POST(request) {
//   try {
//     const formData = await request.formData();
//     const file = formData.get("image");

//     if (!file) {
//       return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
//     }

//     // Read file into buffer directly
//     const buffer = Buffer.from(await file.arrayBuffer());

//     // Send to Plate Recognizer directly
//     const form = new FormData();
//     form.append("upload", buffer, {
//       filename: file.name,
//       // contentType: file.type || "image/jpeg",
//       contentType: file.type?.toLowerCase().includes("jpeg") ? "image/jpeg" : "image/jpg"

//     });

//     const plateRes = await axios.post(
//       "https://api.platerecognizer.com/v1/plate-reader/",
//       form,
//       {
//         headers: {
//           ...form.getHeaders(),
//           Authorization: `Token ${process.env.PLATE_API_KEY}`,
//         },
//       }
//     );

//     const results = plateRes.data.results;
//     if (!results.length) {
//       return NextResponse.json({ status: "no_plate_detected" });
//     }

//     const plate = results[0].plate.toUpperCase();

//     await connectDB();
//     const match = await Vehicle.findOne({ plate });

//     if (match) {
//       return NextResponse.json({ status: "found", plate, info: match });
//     } else {
//       return NextResponse.json({ status: "not_found", plate });
//     }
//   } catch (err) {
//     console.error("ANPR error:", err);
//     return NextResponse.json({ error: "Processing failed" }, { status: 500 });
//   }
// }


import { s3, rekognition } from "../../../lib/aws";
import { connectDB, Vehicle } from "../../../lib/mongo";
import { v4 as uuidv4 } from "uuid";
import { NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { RekognitionClient, DetectTextCommand } from "@aws-sdk/client-rekognition";

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get("image");

    if (!file) return NextResponse.json({ error: "No image" }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const key = `uploads/${uuidv4()}-${file.name}`;

    // Upload to S3
    await s3.send(
  new PutObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: file.type, // Optional, but good for browser compatibility
  })
);

    // Call Rekognition
    const rekRes = await rekognition.send(
  new DetectTextCommand({
    Image: {
      S3Object: {
        Bucket: process.env.AWS_BUCKET_NAME,
        Name: key,
      },
    },
  })
);

console.log(rekRes);

//     const plateRegexes = [
//   /^[A-Z]{2}[0-9]{2}[A-Z]{1,2}[0-9]{4}$/,   // MH12AB1234
//   /^[A-Z]{2}[0-9]{1,2}[A-Z]{0,2}[0-9]{4}$/  // TS9AB1234 (looser)
// ];

// const candidates = (rekRes.TextDetections || [])
//   .filter(d => d.Type === "LINE" && d.DetectedText)
//   .map(d => d.DetectedText.replace(/\s/g, "").toUpperCase())
//   .filter(text => plateRegexes.some(regex => regex.test(text)));

// const plate = candidates[0] || null;

const textLines = (rekRes.TextDetections || [])
  .filter(d => d.Type === "LINE" && d.DetectedText)
  .map(d => d.DetectedText.replace(/\s/g, "").toUpperCase());

// Try single lines
let candidates = [...textLines];

// Try combining pairs of lines (like 2-line plates)
for (let i = 0; i < textLines.length - 1; i++) {
  candidates.push(textLines[i] + textLines[i + 1]);
}

// Filter only realistic plates
const plateRegexes = [
  /^[A-Z]{2}[0-9]{2}[A-Z]{1,2}[0-9]{4}$/, // TS06EC9104
];

const validPlates = candidates.filter(text =>
  plateRegexes.some(regex => regex.test(text))
);

const plate = validPlates[0] || null;



    if (!plate) return NextResponse.json({ status: "no_plate_detected" });

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
