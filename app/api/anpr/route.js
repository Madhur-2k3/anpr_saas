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



//from gemini v1 (more robust, multiple plate detection)
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
//       new PutObjectCommand({
//         Bucket: process.env.AWS_BUCKET_NAME,
//         Key: key,
//         Body: buffer,
//         ContentType: file.type,
//       })
//     );

//     // Call Rekognition
//     const rekRes = await rekognition.send(
//       new DetectTextCommand({
//         Image: {
//           S3Object: {
//             Bucket: process.env.AWS_BUCKET_NAME,
//             Name: key,
//           },
//         },
//       })
//     );

//     console.log(rekRes);

//     // Get all text lines and words from Rekognition
//     // Ensure to sort detections by their position for better concatenation attempts
//     const sortedDetections = (rekRes.TextDetections || [])
//       .filter((d) => d.Confidence > 85) // Filter by confidence first
//       .sort((a, b) => {
//         // Sort primarily by top, then by left for left-to-right reading order
//         if (Math.abs(a.Geometry.BoundingBox.Top - b.Geometry.BoundingBox.Top) < 0.05) { // Threshold for same line
//           return a.Geometry.BoundingBox.Left - b.Geometry.BoundingBox.Left;
//         }
//         return a.Geometry.BoundingBox.Top - b.Geometry.BoundingBox.Top;
//       });

//     const lines = sortedDetections
//       .filter((d) => d.Type === "LINE")
//       .map((d) => d.DetectedText.replace(/\s/g, "").toUpperCase());

//     const words = sortedDetections
//       .filter((d) => d.Type === "WORD")
//       .map((d) => d.DetectedText.replace(/\s/g, "").toUpperCase());


//     console.log("Detected lines (sorted):", lines);
//     console.log("Detected words (sorted):", words);


//     // Combine all possible candidates
//     let plateCandidates = [...lines, ...words]; // Start with individual lines and words

//     // --- More aggressive combination logic ---

//     // Combine adjacent lines
//     for (let i = 0; i < lines.length - 1; i++) {
//       plateCandidates.push(lines[i] + lines[i + 1]);
//     }

//     // Combine adjacent words
//     for (let i = 0; i < words.length - 1; i++) {
//         plateCandidates.push(words[i] + words[i+1]);
//     }

//     // New: Combine words that appear to be part of the same plate, even if not strictly adjacent
//     // This requires analyzing bounding box positions.
//     // For simplicity, let's try combining consecutive detections that are close vertically and horizontally
//     for (let i = 0; i < sortedDetections.length; i++) {
//         for (let j = i + 1; j < sortedDetections.length; j++) {
//             const det1 = sortedDetections[i];
//             const det2 = sortedDetections[j];

//             // Check if they are roughly on the same horizontal line
//             const yOverlap = Math.max(0, Math.min(det1.Geometry.BoundingBox.Top + det1.Geometry.BoundingBox.Height, det2.Geometry.BoundingBox.Top + det2.Geometry.BoundingBox.Height) - Math.max(det1.Geometry.BoundingBox.Top, det2.Geometry.BoundingBox.Top));
//             const heightAvg = (det1.Geometry.BoundingBox.Height + det2.Geometry.BoundingBox.Height) / 2;

//             if (yOverlap / heightAvg > 0.5) { // Significant vertical overlap
//                 // Check if they are horizontally close enough (e.g., within 1-2 character width)
//                 const distance = det2.Geometry.BoundingBox.Left - (det1.Geometry.BoundingBox.Left + det1.Geometry.BoundingBox.Width);
//                 const avgCharWidth = (det1.Geometry.BoundingBox.Width + det2.Geometry.BoundingBox.Width) / ((det1.DetectedText.length || 1) + (det2.DetectedText.length || 1));

//                 if (distance >= -avgCharWidth && distance <= avgCharWidth * 3) { // Allow slight overlap or small gap
//                     const combinedText = (det1.DetectedText + det2.DetectedText).replace(/\s/g, "").toUpperCase();
//                     plateCandidates.push(combinedText);
//                 }
//             }
//         }
//     }


//     // New: Handle cases like "MH34B" and "W9018" by explicitly combining common prefixes/suffixes
//     // This is more of a rule-based approach if spatial detection is not enough.
//     // For example, if we have MHXX and then YYYYY, try to combine.
//     // This can get complex and might lead to false positives if not careful.
//     // Let's stick to regex refinement and spatial combination first.


//     // Define Indian number plate regex
//     // Adjusted regex to be more flexible for the last part:
//     // - [A-Z]{1,3}: Allows 1 to 3 letters (e.g., 'A', 'AM', 'AML')
//     // - (?:[0-9]{4}|[A-Z]{1}[0-9]{4}): This is the key change for 'MH34BW9018'
//     //   - [0-9]{4}: Matches the typical 4 digits (e.g., '0154')
//     //   - | : OR
//     //   - [A-Z]{1}[0-9]{4}: Matches one letter followed by 4 digits (e.g., 'W9018')
//     const plateRegex = /^[A-Z]{2}[0-9]{1,2}[A-Z]{1,3}(?:[0-9]{4}|[A-Z]{1}[0-9]{4})$/;

//     // Filter all candidates that match the plate regex
//     const detectedPlates = Array.from(new Set(plateCandidates.filter((text) => plateRegex.test(text)))); // Use Set to remove duplicates

//     if (detectedPlates.length === 0) {
//       return NextResponse.json({ status: "no_plate_detected", candidates: plateCandidates });
//     }

//     await connectDB();
//     const plateResults = [];

//     // Process each detected plate
//     for (const plate of detectedPlates) {
//       const match = await Vehicle.findOne({ plate });
//       if (match) {
//         plateResults.push({ status: "found", plate, info: match });
//       } else {
//         plateResults.push({ status: "not_found", plate });
//       }
//     }

//     return NextResponse.json({ status: "processed", plates: plateResults });

//   } catch (err) {
//     console.error("ANPR error:", err);
//     return NextResponse.json({ error: "Processing failed" }, { status: 500 });
//   }
// }




// //Gemini v2
// import { s3, rekognition } from "../../../lib/aws";
// import { connectDB, Vehicle,Upload } from "../../../lib/mongo";
// import { v4 as uuidv4 } from "uuid";
// import { NextResponse } from "next/server";
// import { PutObjectCommand } from "@aws-sdk/client-s3";
// import { RekognitionClient, DetectTextCommand } from "@aws-sdk/client-rekognition";
// import { getAuth } from "@clerk/nextjs/server";


// export async function POST(req) {
//   try {

//     const { userId } = getAuth(req);
//     if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

//     const formData = await req.formData();
//     const file = formData.get("image");

//     if (!file) return NextResponse.json({ error: "No image" }, { status: 400 });

//     const buffer = Buffer.from(await file.arrayBuffer());
//     const key = `uploads/${uuidv4()}-${file.name}`;

//     // Upload to S3
//     await s3.send(
//       new PutObjectCommand({
//         Bucket: process.env.AWS_BUCKET_NAME,
//         Key: key,
//         Body: buffer,
//         ContentType: file.type,
//       })
//     );

//     // Call Rekognition
//     const rekRes = await rekognition.send(
//       new DetectTextCommand({
//         Image: {
//           S3Object: {
//             Bucket: process.env.AWS_BUCKET_NAME,
//             Name: key,
//           },
//         },
//       })
//     );

//     console.log("Rekognition Raw Response:", JSON.stringify(rekRes, null, 2));

//     // Filter by confidence and normalize text by removing spaces and hyphens.
//     const processedDetections = (rekRes.TextDetections || [])
//       .filter((d) => d.Confidence > 75) // Lower confidence threshold further to capture more potentially valid parts
//       .map(d => ({
//         ...d,
//         DetectedText: d.DetectedText.replace(/[\s-]/g, "").toUpperCase(),
//         // Store original bounding box for spatial analysis
//         OriginalBoundingBox: d.Geometry.BoundingBox
//       }))
//       .sort((a, b) => {
//         // Sort primarily by top, then by left for left-to-right reading order
//         const verticalTolerance = 0.1; // Increased tolerance for vertical alignment
//         if (Math.abs(a.OriginalBoundingBox.Top - b.OriginalBoundingBox.Top) < verticalTolerance) {
//           return a.OriginalBoundingBox.Left - b.OriginalBoundingBox.Left;
//         }
//         return a.OriginalBoundingBox.Top - b.OriginalBoundingBox.Top;
//       });

//     const lines = processedDetections
//       .filter((d) => d.Type === "LINE")
//       .map((d) => d.DetectedText);

//     const words = processedDetections
//       .filter((d) => d.Type === "WORD")
//       .map((d) => d.DetectedText);


//     console.log("Detected lines (processed & sorted):", lines);
//     console.log("Detected words (processed & sorted):", words);


//     let plateCandidates = [...lines, ...words]; // Start with individual lines and words

//     // --- Even more aggressive combination logic ---

//     // Combine adjacent lines (already robust)
//     for (let i = 0; i < lines.length - 1; i++) {
//       plateCandidates.push(lines[i] + lines[i + 1]);
//     }

//     // Combine adjacent words (already robust)
//     for (let i = 0; i < words.length - 1; i++) {
//         plateCandidates.push(words[i] + words[i+1]);
//     }

//     // New: Iterate through ALL detections and try combining if they are spatially related
//     // This is the most crucial part for fragmented plates like MH34B and W9018
//     for (let i = 0; i < processedDetections.length; i++) {
//         for (let j = i + 1; j < processedDetections.length; j++) {
//             const det1 = processedDetections[i];
//             const det2 = processedDetections[j];

//             // Define liberal criteria for combining:
//             // 1. Are they roughly on the same horizontal line?
//             const center1Y = det1.OriginalBoundingBox.Top + det1.OriginalBoundingBox.Height / 2;
//             const center2Y = det2.OriginalBoundingBox.Top + det2.OriginalBoundingBox.Height / 2;
//             const verticalCenterDistance = Math.abs(center1Y - center2Y);
//             // Allow vertical centers to be within a very generous range (e.g., 50% of the taller detection's height)
//             const maxAllowedVerticalDistance = Math.max(det1.OriginalBoundingBox.Height, det2.OriginalBoundingBox.Height) * 0.5;

//             const areVerticallyAligned = verticalCenterDistance < maxAllowedVerticalDistance;


//             // 2. Are they horizontally close enough?
//             const distance = det2.OriginalBoundingBox.Left - (det1.OriginalBoundingBox.Left + det1.OriginalBoundingBox.Width);
//             const avgCharWidth = (det1.OriginalBoundingBox.Width + det2.OriginalBoundingBox.Width) / ((det1.DetectedText.length || 1) + (det2.DetectedText.length || 1));

//             // Allow a very large gap horizontally (e.g., up to 10 character widths)
//             // or significant overlap if Rekognition splits words that are visually touching.
//             const maxAllowedHorizontalDistance = avgCharWidth * 10;
//             const minAllowedHorizontalDistance = -avgCharWidth * 5; // Allowing more overlap

//             const areHorizontallyClose = (distance >= minAllowedHorizontalDistance && distance <= maxAllowedHorizontalDistance);

//             if (areVerticallyAligned && areHorizontallyClose) {
//                 // Try combining in both directions for maximum chance, but ensure order for common plates
//                 const combinedTextForward = det1.DetectedText + det2.DetectedText;
//                 const combinedTextBackward = det2.DetectedText + det1.DetectedText; // Less common for plates, but include for robustness

//                 plateCandidates.push(combinedTextForward);
//                 plateCandidates.push(combinedTextBackward);
//             }
//         }
//     }

//     // Additionally, a hardcoded combination for known patterns if spatial fails for specific issues
//     // For example, if 'MH34B' and 'W9018' are always separate, but *always* together:
//     const specificCombinations = [];
//     // if (words.includes('MH34B') && words.includes('W9018')) {
//     //     specificCombinations.push('MH34BW9018');
//     // }
//     // Add other specific combinations as needed, but this can lead to brittle code.
//     plateCandidates.push(...specificCombinations);


//     // Define multiple Indian number plate regex patterns
//     const plateRegexes = [
//       // 1. Standard Indian plate: XXNN(A)XXXX or XXNN(A)YXXXX (Y is a letter)
//       //    This should capture MH34AM0154 and MH34BW9018 (after combinations)
//       /^[A-Z]{2}[0-9]{1,2}[A-Z]{1,3}(?:[0-9]{4}|[A-Z]{1}[0-9]{4})$/,
//       // 2. Format like AK0192 (after hyphen removal from AK-0192).
//       /^[A-Z]{2}[0-9]{4}$/,
//       // 3. Optional: Allow for a more liberal plate format for older or specific vehicle types
//       //    e.g., if just state+district+number without series letter (less common for cars/bikes)
//       //    Be careful, this can lead to more false positives.
//       // /^[A-Z]{2}[0-9]{1,2}[0-9]{4}$/, // e.g. MH123456 (no series letter)
//     ];

//     // Filter all candidates that match ANY of the plate regexes
//     let detectedPlates = new Set();
//     plateCandidates.forEach((candidate) => {
//       plateRegexes.forEach((regex) => {
//         if (regex.test(candidate)) {
//           detectedPlates.add(candidate);
//         }
//       });
//     });

//     detectedPlates = Array.from(detectedPlates); // Convert Set back to Array

//     if (detectedPlates.length === 0) {
//       return NextResponse.json({ status: "no_plate_detected", candidates: Array.from(new Set(plateCandidates)) }); // Return unique candidates
//     }

//     await connectDB();
//     await Upload.create({
//       userId,
//       imageUrl: `https://${process.env.AWS_BUCKET_NAME}.s3.amazonaws.com/${key}`,
//       detectedPlates,
//       createdAt: new Date(),
//     });

//     const plateResults = [];

//     // Process each detected plate
//     for (const plate of detectedPlates) {
//       const match = await Vehicle.findOne({ plate });
//       if (match) {
//         plateResults.push({ status: "found", plate, info: match });
//       } else {
//         plateResults.push({ status: "not_found", plate });
//       }
//     }

//     return NextResponse.json({ status: "processed", plates: plateResults });

//   } catch (err) {
//     console.error("ANPR error:", err);
//     return NextResponse.json({ error: "Processing failed" }, { status: 500 });
//   }
// }



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