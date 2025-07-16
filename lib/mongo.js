import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;
let cached = global.mongoose || { conn: null, promise: null };

export async function connectDB() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

const vehicleSchema = new mongoose.Schema({
  plate: { type: String, required: true, unique: true },
  owner: String,
  phone: String,
});

const UploadSchema = new mongoose.Schema({
  userId: String,
  imageUrl: String,
  detectedPlates: [String],
  createdAt: Date,
  s3Key: String, // Store the S3 key for the image
});

export const Upload = mongoose.models.Upload || mongoose.model("Upload", UploadSchema);

export const Vehicle =
  mongoose.models.Vehicle || mongoose.model("Vehicle", vehicleSchema);
