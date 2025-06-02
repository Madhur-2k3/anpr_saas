import mongoose from "mongoose";

const VehicleSchema = new mongoose.Schema({
  plate: String,
  owner: String,
  vehicle: String,
  visit_history: [String],
});

export const Vehicle =
  mongoose.models.Vehicle || mongoose.model("Vehicle", VehicleSchema);

export async function connectDB() {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGO_URI);
  }
}
