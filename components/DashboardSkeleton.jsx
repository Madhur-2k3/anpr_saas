// A single placeholder card with a shimmer effect
const SkeletonCard = () => (
  <div className="p-4 border rounded shadow bg-slate-900">
    <div className="w-full h-60 bg-slate-800 rounded mb-2"></div> {/* Image Placeholder */}
    <div className="w-3/4 h-5 bg-slate-800 rounded mb-2"></div> {/* Text Placeholder */}
    <div className="w-1/2 h-4 bg-slate-800 rounded"></div>     {/* Text Placeholder */}
  </div>
);

// The main skeleton component that repeats the card
export default function DashboardSkeleton() {
  return (
    <div className="p-6 max-w-4xl mx-auto animate-pulse"> {/* The animate-pulse class from Tailwind provides a simple shimmer */}
      <h1 className="text-3xl font-bold mb-6">Your ANPR Uploads</h1>
      <div className="grid gap-4 md:grid-cols-2">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
  );
}