import { Upload, connectDB } from "../../../lib/mongo";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { s3 } from "../../../lib/aws"; // 👈 Import your S3 client
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export async function GET(req) {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const uploads = await Upload.find({ userId }).sort({ createdAt: -1 }).lean();

    const uploadsWithPresignedUrls = await Promise.all(
      uploads.map(async (upload) => {
        // 👇 **FIX STARTS HERE: Check if s3Key exists**
        if (!upload.s3Key) {
          // If there's no key, we can't generate a URL, so we skip it.
          return null; 
        }
        
        const command = new GetObjectCommand({
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: upload.s3Key,
        });

        const presignedUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });

        return {
          ...upload,
          _id: upload._id.toString(),
          imageUrl: presignedUrl,
        };
      })
    );

    // 👇 **Filter out any null results from the check above**
    const validUploads = uploadsWithPresignedUrls.filter(upload => upload !== null);

    return NextResponse.json(validUploads);

  } catch (error) {
    console.error("Failed to fetch uploads:", error);
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
  }
}