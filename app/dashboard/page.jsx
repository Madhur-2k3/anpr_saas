"use client";
import { useEffect, useState } from "react";
import DashboardSkeleton from "../../components/DashboardSkeleton"; // 👈 Import the skeleton component

export default function Dashboard() {
  const [uploads, setUploads] = useState([]);
  const [isLoading, setIsLoading] = useState(true); // 👈 1. Add loading state, true by default
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUploads = async () => {
      setIsLoading(true); // Set loading to true before the fetch
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
        setIsLoading(false); // 👈 2. Set loading to false after fetch completes (in both success and error cases)
      }
    };

    fetchUploads();
  }, []);

  // 👇 3. Render the skeleton component while loading
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
              <img src={upload.imageUrl} alt="Uploaded plate" className="mb-2 w-full max-h-60 object-cover rounded" />
              <p className="text-slate-400"><strong className="text-slate-300">Detected Plates:</strong> {upload.detectedPlates.join(", ")}</p>
              <p className="text-sm text-gray-500">{new Date(upload.createdAt).toLocaleString()}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}