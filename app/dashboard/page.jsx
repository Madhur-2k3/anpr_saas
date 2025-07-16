"use client";
import { useEffect, useState } from "react";
import DashboardSkeleton from "../../components/DashboardSkeleton";
import ImageWithShimmer from "../../components/ImageWithShimmer"; 

export default function Dashboard() {
  const [uploads, setUploads] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUploads = async () => {
      // ... (your existing fetch logic remains the same)
      setIsLoading(true);
      try {
        const res = await fetch("/api/my-uploads");
        if (!res.ok) {
          throw new Error("Failed to fetch uploads from the server.");
        }
        const data = await res.json();
        setUploads(data);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUploads();
  }, []);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return <div className="p-6 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Your ANPR Uploads</h1>

      {uploads.length === 0 ? (
        <p>No uploads yet.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {uploads.map((upload) => (
            <div key={upload._id} className="p-4 border rounded shadow bg-slate-900 ">
              {/* 👇 2. Replace the img tag with the new component */}
              <ImageWithShimmer
                src={upload.imageUrl}
                alt="Uploaded plate"
                className="mb-2 w-full h-60" // Note: height is now on the container
              />
              <p className="text-slate-400"><strong className="text-slate-300">Detected Plates:</strong> {upload.detectedPlates.join(", ")}</p>
              <p className="text-sm text-gray-500">{new Date(upload.createdAt).toLocaleString()}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}