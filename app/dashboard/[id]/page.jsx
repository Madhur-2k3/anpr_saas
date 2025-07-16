"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from 'next/link';
import { ArrowLeft, User, Phone } from 'lucide-react'; // Changed icons
import ImageWithShimmer from "../../../components/ImageWithShimmer";

// Skeleton loader remains the same, it's generic enough
const DetailSkeleton = () => (
  <div className="p-6 max-w-5xl mx-auto animate-pulse">
    <div className="h-8 w-48 bg-slate-800 rounded mb-8"></div>
    <div className="grid md:grid-cols-5 gap-8">
      <div className="md:col-span-3">
        <div className="w-full h-96 bg-slate-800 rounded-lg"></div>
      </div>
      <div className="md:col-span-2 space-y-4">
        <div className="w-full h-32 bg-slate-800 rounded-lg"></div>
        <div className="w-full h-40 bg-slate-800 rounded-lg"></div>
      </div>
    </div>
  </div>
);

export default function UploadDetailPage() {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const params = useParams();
  const { id } = params;

  useEffect(() => {
    if (!id) return;

    const fetchUpload = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/uploads/${id}`);
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "Failed to fetch upload details.");
        }
        const fetchedData = await res.json();
        setData(fetchedData);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUpload();
  }, [id]);

  if (isLoading) return <DetailSkeleton />;
  if (error) return <div className="p-6 text-center text-red-500">Error: {error}</div>;
  if (!data) return <div className="p-6 text-center">Upload not found.</div>;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <Link href="/dashboard" className="flex items-center text-blue-500 hover:underline mb-6">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Dashboard
      </Link>

      <div className="grid md:grid-cols-5 gap-8">
        <div className="md:col-span-3">
          <ImageWithShimmer
            src={data.imageUrl}
            alt="Uploaded vehicle"
            className="w-full h-auto max-h-[70vh] object-contain rounded-lg border"
          />
        </div>
        <div className="md:col-span-2 space-y-6">
          {/* Analysis Details Card */}
          <div className="bg-slate-900 p-6 rounded-lg">
            <h2 className="text-2xl font-bold mb-4 text-white">Analysis Details</h2>
            <div className="space-y-4 text-lg">
              <div>
                <p className="text-sm font-medium text-gray-400">Detected Plate</p>
                <p className="font-mono text-2xl bg-gray-800 px-3 py-1 rounded-md inline-block text-green-400">
                  {data.detectedPlates.join(', ')}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-400">Upload Date</p>
                <p className="text-gray-300">{new Date(data.createdAt).toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* ✨ Owner Information Card - Updated with correct fields */}
          {data.vehicleDetails ? (
            <div className="bg-slate-900 p-6 rounded-lg">
              <h2 className="text-2xl font-bold mb-4 text-white">Owner Details</h2>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <User className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-400">Owner Name</p>
                    <p className="text-lg text-gray-200">{data.vehicleDetails.owner}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Phone className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-400">Phone Number</p>
                    <p className="text-lg text-gray-200">{data.vehicleDetails.phone}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 p-6 rounded-lg text-center">
              <p className="text-gray-400">No vehicle owner information found in the database for this plate.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}