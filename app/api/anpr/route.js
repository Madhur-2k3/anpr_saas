//from gemini pro v1
import { s3, rekognition } from "../../../lib/aws";
import { connectDB, Vehicle, Upload } from "../../../lib/mongo";
import { v4 as uuidv4 } from "uuid";
import { NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { DetectTextCommand } from "@aws-sdk/client-rekognition";
import { getAuth } from "@clerk/nextjs/server";

export async function POST(req) {

  const noiseWords = new Set([
  'HERO', 'HONDA', 'SPLENDOR', 'PASSION', 'GLAMOUR', 'BAJAJ',
  'PULSAR', 'PLATINA', 'TVS', 'APACHE', 'ROYALENFIELD', 'IND', 'ANCE',
  'MERO', 'MER0', 'HER0'  // 👈 Add these variants for robustness (OCR can misread 'O' as '0', etc.)
]);


  try {
    const { userId } = getAuth(req);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const formData = await req.formData();
    const file = formData.get("image");
    if (!file) return NextResponse.json({ error: "No image" }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const key = `uploads/${uuidv4()}-${file.name}`;

    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: key,
        Body: buffer,
        ContentType: file.type,
      })
    );

    const rekRes = await rekognition.send(
      new DetectTextCommand({
        Image: { S3Object: { Bucket: process.env.AWS_BUCKET_NAME, Name: key } },
      })
    );

    const noiseWords = new Set([
      'HERO', 'HONDA', 'SPLENDOR', 'PASSION', 'GLAMOUR', 'BAJAJ',
      'PULSAR', 'PLATINA', 'TVS', 'APACHE', 'ROYALENFIELD', 'IND', 'ANCE'
    ]);

    const filteredDetections = (rekRes.TextDetections || [])
      .filter(d =>
        d.Type === 'WORD' &&
        d.Confidence > 70 &&
        !noiseWords.has(d.DetectedText.replace(/[\s-]/g, "").toUpperCase())
      )
      .map(d => ({
        ...d,
        DetectedText: d.DetectedText.replace(/[\s-]/g, "").toUpperCase(),
      }));

    console.log("✅ Step 1: Filtered Detections (Unsorted):", filteredDetections.map(d => d.DetectedText));
    
    // For definitive debugging if it still fails, you can uncomment the next line to see the raw coordinates.
    // console.log("Full Detection Data:", JSON.stringify(filteredDetections, null, 2));

    // ======================= FINAL ADAPTIVE GROUPING LOGIC =======================
    const lines = [];
    const usedIndices = new Set();

    for (let i = 0; i < filteredDetections.length; i++) {
      if (usedIndices.has(i)) continue;

      // Tolerance is now adaptive, based on the height of the current word.
      const adaptiveTolerance = filteredDetections[i].Geometry.BoundingBox.Height * 0.7; // 70% of the word's height is a good tolerance.

      let currentLine = [filteredDetections[i]];
      usedIndices.add(i);

      for (let j = i + 1; j < filteredDetections.length; j++) {
        if (usedIndices.has(j)) continue;

        // Compare the vertical centers of the words for better accuracy.
        const y_center_1 = filteredDetections[i].Geometry.BoundingBox.Top + (filteredDetections[i].Geometry.BoundingBox.Height / 2);
        const y_center_2 = filteredDetections[j].Geometry.BoundingBox.Top + (filteredDetections[j].Geometry.BoundingBox.Height / 2);

        if (Math.abs(y_center_1 - y_center_2) < adaptiveTolerance) {
          currentLine.push(filteredDetections[j]);
          usedIndices.add(j);
        }
      }
      lines.push(currentLine);
    }
    
    const reconstructedLines = lines
      .sort((lineA, lineB) => {
        const topA = lineA[0].Geometry.BoundingBox.Top;
        const topB = lineB[0].Geometry.BoundingBox.Top;
        return topA - topB;
      })
      .map(line =>
        line.sort((a, b) => a.Geometry.BoundingBox.Left - b.Geometry.BoundingBox.Left)
            .map(d => d.DetectedText).join('')
      );
    // =========================================================================
    
    console.log("✅ Step 2: Reconstructed Lines:", reconstructedLines);

   // It generates all orderings of the 4 segments, joins them, and adds valid ones to reconstructedLines
    // 👇👇👇 UPDATED SNIPPET: Handle >=4 detections by trying subsets of 4
if (filteredDetections.length >= 4) {
  const segments = filteredDetections.map(d => d.DetectedText);

  // Helper to generate all combinations of 'k' items from an array
  const generateCombinations = (arr, k) => {
    const result = [];
    const combine = (current, start) => {
      if (current.length === k) {
        result.push(current.slice());
        return;
      }
      for (let i = start; i < arr.length; i++) {
        current.push(arr[i]);
        combine(current, i + 1);
        current.pop();
      }
    };
    combine([], 0);
    return result;
  };

  // Helper to generate all permutations of an array (same as before)
  const generatePermutations = (arr) => {
    const result = [];
    const permute = (current, remaining) => {
      if (remaining.length === 0) {
        result.push(current.slice());
        return;
      }
      for (let i = 0; i < remaining.length; i++) {
        current.push(remaining[i]);
        const newRemaining = remaining.slice(0, i).concat(remaining.slice(i + 1));
        permute(current, newRemaining);
        current.pop();
      }
    };
    permute([], arr);
    return result;
  };

  // Generate combinations of 4 segments (if more than 4, this skips noisy ones)
  const combos = generateCombinations(segments, 4);

  combos.forEach(combo => {
    const permutations = generatePermutations(combo);
    permutations.forEach(perm => {
      const joined = perm.join('');
      reconstructedLines.push(joined);  // Add to lines—regex will filter later
    });
  });
}


    if (reconstructedLines.length === 0) {
        return NextResponse.json({ status: "no_plate_detected", message: "No text lines reconstructed." });
    }

    const plateCandidates = new Set(reconstructedLines);
    if (reconstructedLines.length >= 2) {
        plateCandidates.add(reconstructedLines[0] + reconstructedLines[1]);
    }

    console.log("✅ Step 3: Final Candidates for Matching:", Array.from(plateCandidates));

    const plateRegex = /^[A-Z]{2}[0-9]{1,2}[A-Z]{1,3}[0-9]{4}$/;
    const detectedPlates = Array.from(plateCandidates).filter(c => plateRegex.test(c));

    if (detectedPlates.length === 0) {
      return NextResponse.json({ status: "no_plate_detected", candidates: Array.from(plateCandidates) });
    }

    await connectDB();
    await Upload.create({
      userId,
      // The full URL for storage/reference if you want it
      imageUrl: `https://${process.env.AWS_BUCKET_NAME}.s3.amazonaws.com/${key}`, 
      s3Key: key, // 👈 **SAVE THE KEY HERE**
      detectedPlates,
      createdAt: new Date(),
    });
    // await Upload.create({
    //   userId,
    //   imageUrl: `https://${process.env.AWS_BUCKET_NAME}.s3.amazonaws.com/${key}`,
    //   detectedPlates,
    //   createdAt: new Date(),
    // });

    const plateResults = [];
    for (const plate of detectedPlates) {
      const match = await Vehicle.findOne({ plate });
      plateResults.push(match ? { status: "found", plate, info: match } : { status: "not_found", plate });
    }

    return NextResponse.json({ status: "processed", plates: plateResults });

  } catch (err) {
    console.error("ANPR processing error:", err);
    return NextResponse.json({ error: "Server failed to process image." }, { status: 500 });
  }
}