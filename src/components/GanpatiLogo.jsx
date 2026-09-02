import React from 'react';

export function GanpatiLogo({ className = "w-11 h-11 sm:w-12 sm:h-12" }) {
  return (
    <div className={`relative shrink-0 ${className}`}>
      {/* Outer Golden Aura Border */}
      <div className="absolute -inset-0.5 bg-gradient-to-br from-[#D4AF37] via-[#FCEAA7] to-[#800020] rounded-xl opacity-90 shadow-xs"></div>
      
      {/* Image Container with Gold Border */}
      <div className="relative w-full h-full rounded-xl overflow-hidden border-1.5 border-[#D4AF37] shadow-sm bg-amber-950 flex items-center justify-center">
        <img
          src="/ganpati-logo.jpg"
          alt="श्रीमंत दगडूशेठ हलवाई गणपती"
          className="w-full h-full object-cover object-center"
          onError={(e) => {
            e.target.onerror = null;
            e.target.style.display = 'none';
          }}
        />
      </div>
    </div>
  );
}
