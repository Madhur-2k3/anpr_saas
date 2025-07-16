"use client";
import { useEffect, useState } from "react";
import DashboardSkeleton from "../../components/DashboardSkeleton";
import ImageWithShimmer from "../../components/ImageWithShimmer";
import Link from 'next/link'; // 👈 1. Import Link

export default function Dashboard() {
  // ... (all your existing state and useEffect logic remains the same)
    const [uploads, setUploads] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUploads = async () => {
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
            // 👇 2. Wrap the card in a Link component
            <Link href={`/dashboard/${upload._id}`} key={upload._id}>
              <div className="p-4 border rounded-lg shadow bg-slate-900 h-full transition-shadow duration-200 hover:shadow-lg hover:shadow-blue-600/20">
                <ImageWithShimmer
                  src={upload.imageUrl}
                  alt="Uploaded plate"
                  className="mb-4 w-full h-60" 
                />
                <p className="text-slate-400 truncate"><strong className="text-slate-300">Detected Plates:</strong> {upload.detectedPlates.join(", ")}</p>
                <p className="text-sm text-gray-500 mt-2">{new Date(upload.createdAt).toLocaleString()}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}