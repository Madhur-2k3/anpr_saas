// scripts/seed.js

const mongoose = require("mongoose");
require("dotenv").config();

const MONGODB_URI = process.env.MONGODB_URI;

const vehicleSchema = new mongoose.Schema({
  plate: { type: String, required: true, unique: true },
  owner: String,
  phone: String,
});

const Vehicle = mongoose.model("Vehicle", vehicleSchema);

async function seed() {
  await mongoose.connect(MONGODB_URI);

  const vehicles = [
    { plate: "TS09EX1234", owner: "Ravi Kumar", phone: "9876543210" },
    { plate: "AP16BE4567", owner: "Anusha Reddy", phone: "9845123456" },
    { plate: "MH12DE9876", owner: "Suresh Patil", phone: "9001234567" },
  ];

  await Vehicle.insertMany(vehicles);
  console.log("✅ Seed data inserted");

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("❌ Error seeding data:", err);
  process.exit(1);
});
