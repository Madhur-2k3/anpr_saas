// import { Upload, connectDB } from "../../../../lib/mongo";
// import { getAuth } from "@clerk/nextjs/server";
// import { NextResponse } from "next/server";
// import { s3 } from "../../../../lib/aws";
// import { GetObjectCommand } from "@aws-sdk/client-s3";
// import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// export async function GET(req, { params }) {
//   try {
//     const { userId } = getAuth(req);
//     if (!userId) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     const { id } = params; // Get the ID from the URL (e.g., /api/uploads/some-id)

//     await connectDB();
    
//     // Find the document by its ID AND ensure it belongs to the logged-in user
//     const upload = await Upload.findOne({ _id: id, userId }).lean();

//     if (!upload) {
//       return NextResponse.json({ error: "Upload not found." }, { status: 404 });
//     }

//     // Generate a presigned URL for the image
//     if (upload.s3Key) {
//       const command = new GetObjectCommand({
//         Bucket: process.env.AWS_BUCKET_NAME,
//         Key: upload.s3Key,
//       });
//       upload.imageUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });
//     }
    
//     // Convert ObjectId to string for serialization
//     upload._id = upload._id.toString();

//     return NextResponse.json(upload);

//   } catch (error) {
//     console.error("Failed to fetch upload:", error);
//     return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
//   }
// }



import { Upload, Vehicle, connectDB } from "../../../../lib/mongo";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { s3 } from "../../../../lib/aws";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export async function GET(req, { params }) {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    await connectDB();
    
    const upload = await Upload.findOne({ _id: id, userId }).lean();
    if (!upload) {
      return NextResponse.json({ error: "Upload not found." }, { status: 404 });
    }

    let vehicleDetails = null;
    if (upload.detectedPlates && upload.detectedPlates.length > 0) {
      const plateNumber = upload.detectedPlates[0];
      vehicleDetails = await Vehicle.findOne({ plate: plateNumber }).lean();
      if (vehicleDetails) {
        vehicleDetails._id = vehicleDetails._id.toString();
      }
    }

    if (upload.s3Key) {
      const command = new GetObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: upload.s3Key,
      });
      upload.imageUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });
    }
    
    upload._id = upload._id.toString();

    return NextResponse.json({ ...upload, vehicleDetails });

  } catch (error) {
    console.error("Failed to fetch upload:", error);
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
  }
}