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



//from gpt for single plate detection
// import { s3, rekognition } from "../../../lib/aws";
// import { connectDB, Vehicle } from "../../../lib/mongo";
// import { v4 as uuidv4 } from "uuid";
// import { NextResponse } from "next/server";
// import { PutObjectCommand } from "@aws-sdk/client-s3";
// import { RekognitionClient, DetectTextCommand } from "@aws-sdk/client-rekognition";

// export async function POST(req) {
//   try {
//     const formData = await req.formData();
//     const file = formData.get("image");

//     if (!file) return NextResponse.json({ error: "No image" }, { status: 400 });

//     const buffer = Buffer.from(await file.arrayBuffer());
//     const key = `uploads/${uuidv4()}-${file.name}`;

//     // Upload to S3
//     await s3.send(
//   new PutObjectCommand({
//     Bucket: process.env.AWS_BUCKET_NAME,
//     Key: key,
//     Body: buffer,
//     ContentType: file.type, // Optional, but good for browser compatibility
//   })
// );

//     // Call Rekognition
//     const rekRes = await rekognition.send(
//   new DetectTextCommand({
//     Image: {
//       S3Object: {
//         Bucket: process.env.AWS_BUCKET_NAME,
//         Name: key,
//       },
//     },
//   })
// );

// console.log(rekRes);

// // Get all text lines from Rekognition
// const lines = (rekRes.TextDetections || [])
//   .filter((d) => d.Type === "LINE" && d.Confidence > 85)
//   .map((d) => d.DetectedText.replace(/\s/g, "").toUpperCase());

// console.log("Detected lines:", lines);

// // Combine all possible pairs (including individual lines)
// let plateCandidates = [...lines];
// for (let i = 0; i < lines.length - 1; i++) {
//   plateCandidates.push(lines[i] + lines[i + 1]); // combine adjacent lines
// }

// // Define Indian number plate regex (example: TS06EC9104)
// const plateRegex = /^[A-Z]{2}[0-9]{2}[A-Z]{1,3}[0-9]{4}$/;

// const plate = plateCandidates.find((text) => plateRegex.test(text));

// if (!plate) {
//   return NextResponse.json({ status: "no_plate_detected", candidates: plateCandidates });
// }

//     if (!plate) return NextResponse.json({ status: "no_plate_detected" });

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


//from gemini
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
        ContentType: file.type,
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

    // Get all text lines and words from Rekognition
    // Ensure to sort detections by their position for better concatenation attempts
    const sortedDetections = (rekRes.TextDetections || [])
      .filter((d) => d.Confidence > 85) // Filter by confidence first
      .sort((a, b) => {
        // Sort primarily by top, then by left for left-to-right reading order
        if (Math.abs(a.Geometry.BoundingBox.Top - b.Geometry.BoundingBox.Top) < 0.05) { // Threshold for same line
          return a.Geometry.BoundingBox.Left - b.Geometry.BoundingBox.Left;
        }
        return a.Geometry.BoundingBox.Top - b.Geometry.BoundingBox.Top;
      });

    const lines = sortedDetections
      .filter((d) => d.Type === "LINE")
      .map((d) => d.DetectedText.replace(/\s/g, "").toUpperCase());

    const words = sortedDetections
      .filter((d) => d.Type === "WORD")
      .map((d) => d.DetectedText.replace(/\s/g, "").toUpperCase());


    console.log("Detected lines (sorted):", lines);
    console.log("Detected words (sorted):", words);


    // Combine all possible candidates
    let plateCandidates = [...lines, ...words]; // Start with individual lines and words

    // --- More aggressive combination logic ---

    // Combine adjacent lines
    for (let i = 0; i < lines.length - 1; i++) {
      plateCandidates.push(lines[i] + lines[i + 1]);
    }

    // Combine adjacent words
    for (let i = 0; i < words.length - 1; i++) {
        plateCandidates.push(words[i] + words[i+1]);
    }

    // New: Combine words that appear to be part of the same plate, even if not strictly adjacent
    // This requires analyzing bounding box positions.
    // For simplicity, let's try combining consecutive detections that are close vertically and horizontally
    for (let i = 0; i < sortedDetections.length; i++) {
        for (let j = i + 1; j < sortedDetections.length; j++) {
            const det1 = sortedDetections[i];
            const det2 = sortedDetections[j];

            // Check if they are roughly on the same horizontal line
            const yOverlap = Math.max(0, Math.min(det1.Geometry.BoundingBox.Top + det1.Geometry.BoundingBox.Height, det2.Geometry.BoundingBox.Top + det2.Geometry.BoundingBox.Height) - Math.max(det1.Geometry.BoundingBox.Top, det2.Geometry.BoundingBox.Top));
            const heightAvg = (det1.Geometry.BoundingBox.Height + det2.Geometry.BoundingBox.Height) / 2;

            if (yOverlap / heightAvg > 0.5) { // Significant vertical overlap
                // Check if they are horizontally close enough (e.g., within 1-2 character width)
                const distance = det2.Geometry.BoundingBox.Left - (det1.Geometry.BoundingBox.Left + det1.Geometry.BoundingBox.Width);
                const avgCharWidth = (det1.Geometry.BoundingBox.Width + det2.Geometry.BoundingBox.Width) / ((det1.DetectedText.length || 1) + (det2.DetectedText.length || 1));

                if (distance >= -avgCharWidth && distance <= avgCharWidth * 3) { // Allow slight overlap or small gap
                    const combinedText = (det1.DetectedText + det2.DetectedText).replace(/\s/g, "").toUpperCase();
                    plateCandidates.push(combinedText);
                }
            }
        }
    }


    // New: Handle cases like "MH34B" and "W9018" by explicitly combining common prefixes/suffixes
    // This is more of a rule-based approach if spatial detection is not enough.
    // For example, if we have MHXX and then YYYYY, try to combine.
    // This can get complex and might lead to false positives if not careful.
    // Let's stick to regex refinement and spatial combination first.


    // Define Indian number plate regex
    // Adjusted regex to be more flexible for the last part:
    // - [A-Z]{1,3}: Allows 1 to 3 letters (e.g., 'A', 'AM', 'AML')
    // - (?:[0-9]{4}|[A-Z]{1}[0-9]{4}): This is the key change for 'MH34BW9018'
    //   - [0-9]{4}: Matches the typical 4 digits (e.g., '0154')
    //   - | : OR
    //   - [A-Z]{1}[0-9]{4}: Matches one letter followed by 4 digits (e.g., 'W9018')
    const plateRegex = /^[A-Z]{2}[0-9]{1,2}[A-Z]{1,3}(?:[0-9]{4}|[A-Z]{1}[0-9]{4})$/;

    // Filter all candidates that match the plate regex
    const detectedPlates = Array.from(new Set(plateCandidates.filter((text) => plateRegex.test(text)))); // Use Set to remove duplicates

    if (detectedPlates.length === 0) {
      return NextResponse.json({ status: "no_plate_detected", candidates: plateCandidates });
    }

    await connectDB();
    const plateResults = [];

    // Process each detected plate
    for (const plate of detectedPlates) {
      const match = await Vehicle.findOne({ plate });
      if (match) {
        plateResults.push({ status: "found", plate, info: match });
      } else {
        plateResults.push({ status: "not_found", plate });
      }
    }

    return NextResponse.json({ status: "processed", plates: plateResults });

  } catch (err) {
    console.error("ANPR error:", err);
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}