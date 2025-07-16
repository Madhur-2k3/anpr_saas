// import mongoose from "mongoose";

// const VehicleSchema = new mongoose.Schema({
//   plate: String,
//   owner: String,
//   vehicle: String,
//   visit_history: [String],
// });

// export const Vehicle =
//   mongoose.models.Vehicle || mongoose.model("Vehicle", VehicleSchema);

// export async function connectDB() {
//   if (mongoose.connection.readyState === 0) {
//     await mongoose.connect(process.env.MONGO_URI);
//   }
// }



// import mongoose from "mongoose";

// const MONGODB_URI = process.env.MONGODB_URI;

// if (!MONGODB_URI) {
//   throw new Error("Please define the MONGODB_URI environment variable");
// }

// // Global variable to reuse connection in development
// let globalWithMongoose = global;

// if (!globalWithMongoose._mongoose) {
//   globalWithMongoose._mongoose = { conn: null, promise: null };
// }

// export async function connectDB() {
//   if (globalWithMongoose._mongoose.conn) {
//     return globalWithMongoose._mongoose.conn;
//   }

//   if (!globalWithMongoose._mongoose.promise) {
//     globalWithMongoose._mongoose.promise = mongoose.connect(MONGODB_URI, {
//       bufferCommands: false,
//     });
//   }

//   globalWithMongoose._mongoose.conn = await globalWithMongoose._mongoose.promise;
//   return globalWithMongoose._mongoose.conn;
// }

// // Schema
// const vehicleSchema = new mongoose.Schema({
//   plate: { type: String, required: true, unique: true },
//   owner: String,
//   phone: String,
// });

// export const Vehicle =
//   mongoose.models.Vehicle || mongoose.model("Vehicle", vehicleSchema);




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
});

export const Upload = mongoose.models.Upload || mongoose.model("Upload", UploadSchema);

export const Vehicle =
  mongoose.models.Vehicle || mongoose.model("Vehicle", vehicleSchema);
