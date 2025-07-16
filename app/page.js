"use client";
import Link from "next/link";
import { useState } from "react";
import imageCompression from "browser-image-compression";
import { Camera } from "lucide-react";
import { useRef } from "react";

export default function ANPRPage() {
  const [file, setFile] = useState(null);
  const [previewURL, setPreviewURL] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const fileInputRef = useRef(null); //  create a ref

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const options = {
        maxSizeMB: 5,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      };
      const compressedFile = await imageCompression(file, options);

      const formData = new FormData();
      formData.append("image", compressedFile);

      const res = await fetch("/api/anpr", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      setResult(data);
    } catch (error) {
      console.error("Upload error:", error);
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

  const openCamera = () => {
    fileInputRef.current?.click(); // 👈 programmatically open input
  };

  return (
    <>
      <section className="container mx-auto px-4 py-16 text-center bg-gray-950/80">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-5xl font-bold text-gray-400 mb-6 leading-tight">
            Extract License Plate Data
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600"> Instantly</span>
          </h2>
          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            Upload images or capture photos to automatically extract license plate numbers with AI-powered recognition technology.
          </p>

          {/* Action Card */}
          <div className="flex max-w-lg mx-auto mb-12">
            <div
              onClick={openCamera} // 👈 trigger hidden input
              className="cursor-pointer hover:shadow-lg transition-all duration-300 border-2 hover:border-blue-200 group rounded-xl"
            >
              <div className="text-center px-4 py-6">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Camera className="w-8 h-8 text-white" />
                </div>
                <p className="text-xl text-gray-400">Capture Photo</p>
                <p className="text-gray-600">Use your device camera to capture license plates in real-time</p>
              </div>
            </div>
          </div>

          {/* Hidden input for camera capture */}
          <input
            type="file"
            accept="image/*"
            capture="environment"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
          />

          {/* Preview and Upload */}
          {previewURL && (
            <div className="p-6 max-w-md mx-auto">
              <img
                src={previewURL}
                alt="Preview"
                className="mb-4 w-full h-auto rounded border"
              />
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
              <Link href="/add-vehicle" className="text-white">Add Vehicle</Link>
            </div>
          )}
        </div>
      </section>
    </>
  );
}

