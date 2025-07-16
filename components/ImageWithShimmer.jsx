"use client";

import { useState } from 'react';

export default function ImageWithShimmer({ src, alt, className }) {
  const [isLoaded, setIsLoaded] = useState(false);
  console.log("isLoaded:", isLoaded);

  return (
    <div className={`relative ${className}`}>
      {/* Shimmer Placeholder */}
      <div
        className={`absolute inset-0 bg-slate-800  rounded
                   transition-opacity duration-300
                   ${isLoaded ? 'opacity-0' : 'opacity-100 animate-pulse'}`}
      />

      {/* Actual Image */}
      <img
        src={src}
        alt={alt}
        className={`w-full h-full object-cover rounded
                   transition-opacity duration-300
                   ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
        onLoad={() => setIsLoaded(true)} // This event fires when the image has loaded
      />
    </div>
  );
}




// "use client";

// import { useState, useRef, useEffect } from 'react';

// export default function ImageWithShimmer({ src, alt, className }) {
//   const [isLoaded, setIsLoaded] = useState(false);
//   const imageRef = useRef(null); // 1. Create a ref to access the img element

//   useEffect(() => {
//     // 2. Check if the image is already loaded (e.g., from cache)
//     //    The ref connects us to the <img> DOM node
//     if (imageRef.current?.complete) {
//       setIsLoaded(true);
//     }
//   }, [src]); // Rerun this effect if the image src changes

//   return (
//     <div className={`relative ${className} overflow-hidden`}>
//       {/* Shimmer Placeholder */}
//       <div
//         className={`absolute inset-0 bg-slate-800 animate-pulse
//                    transition-opacity duration-500
//                    ${isLoaded ? 'opacity-0' : 'opacity-100'}`}
//       />

//       {/* Actual Image */}
//       <img
//         ref={imageRef} // 3. Attach the ref to the img element
//         src={src}
//         alt={alt}
//         className={`w-full h-full object-cover
//                    transition-opacity duration-500
//                    ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
//         onLoad={() => setIsLoaded(true)} // This handles images loading from the network
//       />
//     </div>
//   );
// }