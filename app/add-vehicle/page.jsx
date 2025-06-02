// app/add-vehicle/page.jsx
"use client";
import { useState } from "react";

export default function AddVehiclePage() {
  const [form, setForm] = useState({ plate: "", owner: "", phone: "" });
  const [message, setMessage] = useState("");

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await fetch("/api/add-vehicle", {
      method: "POST",
      body: JSON.stringify(form),
      headers: { "Content-Type": "application/json" },
    });

    const data = await res.json();
    if (res.ok) {
      setMessage("✅ Vehicle added");
      setForm({ plate: "", owner: "", phone: "" });
    } else {
      setMessage("❌ " + (data.error || "Failed"));
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-4">Add Vehicle</h1>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="text"
          name="plate"
          placeholder="Plate (e.g., TS09AB1234)"
          value={form.plate}
          onChange={handleChange}
          className="border p-2 w-full"
          required
        />
        <input
          type="text"
          name="owner"
          placeholder="Owner Name"
          value={form.owner}
          onChange={handleChange}
          className="border p-2 w-full"
          required
        />
        <input
          type="tel"
          name="phone"
          placeholder="Phone Number"
          value={form.phone}
          onChange={handleChange}
          className="border p-2 w-full"
          required
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Submit
        </button>
      </form>
      {message && <p className="mt-3">{message}</p>}
    </div>
  );
}
