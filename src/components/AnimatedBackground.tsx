import React from "react";
import { motion } from "framer-motion";

const AnimatedBackground = () => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      <div className="absolute inset-0 bg-background" />
      
      {/* Aurora Blobs */}
      <div className="bg-aurora aurora-1 top-[-10%] left-[-10%]" />
      <div className="bg-aurora aurora-2 top-[20%] right-[-10%] w-[70%] h-[70%]" />
      <div className="bg-aurora aurora-3 bottom-[-10%] left-[20%] w-[50%] h-[50%]" />
      
      {/* Subtlest grid overlay */}
      <div className="absolute inset-0 opacity-[0.03] digital-grid" />
      
      {/* Scanline effect */}
      <div className="absolute inset-0 scanline opacity-20" />
    </div>
  );
};

export default AnimatedBackground;
