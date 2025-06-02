"use client";

import { useState } from "react";

export default function HomePage() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = async (e) => {
    e.preventDefault();
    const file = e.target.image.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("image", file);

    setLoading(true);
    const res = await fetch("/api/anpr", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    setResult(data);
    setLoading(false);
  };

  return (
    <main style={{ padding: "2rem" }}>
      <h1>🚗 ANPR Vehicle Lookup</h1>
      <form onSubmit={handleUpload} style={{ marginTop: "1rem" }}>
        <input type="file" name="image" accept="image/*" required />
        <button type="submit" style={{ marginLeft: "1rem" }}>
          Upload
        </button>
      </form>

      {loading && <p>Detecting plate...</p>}

      {result && (
        <div style={{ marginTop: "1rem" }}>
          <p><strong>Status:</strong> {result.status}</p>
          <p><strong>Plate:</strong> {result.plate}</p>
          {result.info && (
            <pre>{JSON.stringify(result.info, null, 2)}</pre>
          )}
        </div>
      )}
    </main>
  );
}
