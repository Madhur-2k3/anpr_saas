// "use client";

// import { useState } from "react";

// export default function HomePage() {
//   const [result, setResult] = useState(null);
//   const [loading, setLoading] = useState(false);

//   const handleUpload = async (e) => {
//     e.preventDefault();
//     const file = e.target.image.files[0];
//     if (!file) return;

//     const formData = new FormData();
//     formData.append("image", file);

//     setLoading(true);
//     const res = await fetch("/api/anpr", {
//       method: "POST",
//       body: formData,
//     });

//     const data = await res.json();
//     setResult(data);
//     setLoading(false);
//   };

//   return (
//     <main style={{ padding: "2rem" }}>
//       <h1>🚗 ANPR Vehicle Lookup</h1>
//       <form onSubmit={handleUpload} style={{ marginTop: "1rem" }}>
//         <input type="file" name="image" accept="image/*" required />
//         <button type="submit" style={{ marginLeft: "1rem" }}>
//           Upload
//         </button>
//       </form>

//       {loading && <p>Detecting plate...</p>}

//       {result && (
//         <div style={{ marginTop: "1rem" }}>
//           <p><strong>Status:</strong> {result.status}</p>
//           <p><strong>Plate:</strong> {result.plate}</p>
//           {result.info && (
//             <pre>{JSON.stringify(result.info, null, 2)}</pre>
//           )}
//         </div>
//       )}
//     </main>
//   );
// }


"use client";

import { useState } from "react";

export default function ANPRPage() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);

    const formData = new FormData();
    formData.append("image", file);

    try {
      const res = await fetch("/api/anpr", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      setResult(data);
    } catch (error) {
      setResult({ error: "Something went wrong." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Live Camera Upload</h1>

      <input
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(e) => setFile(e.target.files?.[0])}
        className="mb-4 block"
      />

      {file && (
        <img
          src={URL.createObjectURL(file)}
          alt="Preview"
          className="mb-4 w-full h-auto rounded border"
        />
      )}

      <button
        onClick={handleUpload}
        disabled={!file || loading}
        className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {loading ? "Checking..." : "Upload & Detect"}
      </button>

      {result && (
        <div className="mt-6 p-4 bg-gray-100 rounded">
          <pre className=" text-black">{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
