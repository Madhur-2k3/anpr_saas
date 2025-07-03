// "use client";

// import Link from "next/link";
// import { useState } from "react";
// import imageCompression from "browser-image-compression";

// export default function ANPRPage() {
//   const [file, setFile] = useState(null);
//   const [result, setResult] = useState(null);
//   const [loading, setLoading] = useState(false);

//   const handleUpload = async () => {
//     if (!file) return;
//     setLoading(true);

//     const formData = new FormData();
//     formData.append("image", file);

//     try {
//       const res = await fetch("/api/anpr", {
//         method: "POST",
//         body: formData,
//       });

//       const data = await res.json();
//       setResult(data);
//     } catch (error) {
//       setResult({ error: "Something went wrong." });
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="p-6 max-w-md mx-auto">
//       <h1 className="text-2xl font-bold mb-4">Live Camera Upload</h1>

//       <input
//         type="file"
//         accept="image/*"
//         capture="environment"
//         onChange={(e) => setFile(e.target.files?.[0])}
//         className="mb-4 block"
//       />

//       {file && (
//         <img
//           src={URL.createObjectURL(file)}
//           alt="Preview"
//           className="mb-4 w-full h-auto rounded border"
//         />
//       )}

//       <button
//         onClick={handleUpload}
//         disabled={!file || loading}
//         className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
//       >
//         {loading ? "Checking..." : "Upload & Detect"}
//       </button>

//       {result && (
//         <div className="mt-6 p-4 bg-gray-100 rounded">
//           <pre className=" text-black">{JSON.stringify(result, null, 2)}</pre>
//         </div>
//       )}
//       <br />
//       <br />

//       <Link href="/add-vehicle" className=" text-white">Add Vehicle</Link>
//     </div>
//   );
// }


"use client";

// import Link from "next/link";
// import { useState } from "react";
// import imageCompression from "browser-image-compression";

// export default function ANPRPage() {
//   const [file, setFile] = useState(null);
//   const [previewURL, setPreviewURL] = useState(null);
//   const [result, setResult] = useState(null);
//   const [loading, setLoading] = useState(false);

//   const handleUpload = async () => {
//     if (!file) return;
//     setLoading(true);

//     try {
//       // Compress the file before uploading
//       const options = {
//         maxSizeMB: 5,
//         maxWidthOrHeight: 1024,
//         useWebWorker: true,
//       };
//       const compressedFile = await imageCompression(file, options);

//       const formData = new FormData();
//       formData.append("image", compressedFile);

//       const res = await fetch("/api/anpr", {
//         method: "POST",
//         body: formData,
//       });

//       const data = await res.json();
//       setResult(data);
//     } catch (error) {
//       setResult({ error: "Something went wrong." });
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleFileChange = (e) => {
//     const selected = e.target.files?.[0];
//     if (selected) {
//       setFile(selected);
//       setPreviewURL(URL.createObjectURL(selected));
//     }
//   };

//   return (
//     <div className="p-6 max-w-md mx-auto">
//       <h1 className="text-2xl font-bold mb-4">Live Camera Upload</h1>

//       <input
//         type="file"
//         accept="image/*"
//         capture="environment"
//         onChange={handleFileChange}
//         className="mb-4 block"
//       />

//       {previewURL && (
//         <img
//           src={previewURL}
//           alt="Preview"
//           className="mb-4 w-full h-auto rounded border"
//         />
//       )}

//       <button
//         onClick={handleUpload}
//         disabled={!file || loading}
//         className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
//       >
//         {loading ? "Checking..." : "Upload & Detect"}
//       </button>

//       {result && (
//         <div className="mt-6 p-4 bg-gray-100 rounded">
//           <pre className="text-black">{JSON.stringify(result, null, 2)}</pre>
//         </div>
//       )}

//       <br />
//       <br />

//       <Link href="/add-vehicle" className="text-white">
//         Add Vehicle
//       </Link>
//     </div>
//   );
// }


import Link from "next/link";
import { useState } from "react";
import imageCompression from "browser-image-compression";

export default function ANPRPage() {
  const [file, setFile] = useState(null);
  const [previewURL, setPreviewURL] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);

    try {
      // --- START: Optimized Compression Options ---
      const options = {
        maxSizeMB: 5,       // Keep the 5MB limit
        maxWidthOrHeight: 1920, // Increase resolution significantly
        useWebWorker: true,
        // You can also consider setting a `quality` option, though `maxSizeMB` often handles this implicitly.
        // If you still have issues, you might try quality: 0.9 (0.7-1.0 range)
        // quality: 0.9,
      };
      // --- END: Optimized Compression Options ---

      const compressedFile = await imageCompression(file, options);

      console.log('Original file size:', file.size / 1024 / 1024, 'MB');
      console.log('Compressed file size:', compressedFile.size / 1024 / 1024, 'MB');
      console.log('Compressed file dimensions:', compressedFile.width, 'x', compressedFile.height);


      const formData = new FormData();
      formData.append("image", compressedFile);

      const res = await fetch("/api/anpr", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      setResult(data);
    } catch (error) {
      console.error("Upload error:", error); // Log the actual error
      setResult({ error: "Something went wrong during upload or processing." });
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setPreviewURL(URL.createObjectURL(selected));
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Live Camera Upload</h1>

      <input
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="mb-4 block"
      />

      {previewURL && (
        <img
          src={previewURL}
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
          <pre className="text-black">{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}

      <br />
      <br />

      <Link href="/add-vehicle" className="text-white">
        Add Vehicle
      </Link>
    </div>
  );
}