import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function AuctionCountdown() {
  const [count, setCount] = useState(3);
  const navigate = useNavigate();

  useEffect(() => {
    if (count > 0) {
      const timer = setTimeout(() => setCount(count - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      navigate("/auction-arena", { replace: true });
    }
  }, [count, navigate]);

  return (
    <div className="min-h-screen bg-[#02040a] flex flex-col items-center justify-center relative overflow-hidden">

      {/* Dynamic Cobalt Background Shapes */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-indigo-600/10 rotate-45 blur-[100px]"></div>
        <div className="absolute bottom-[-10%] left-[-5%] w-96 h-96 bg-blue-700/10 -rotate-12 blur-[100px]"></div>

        {/* Technical Grid Overlay */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`, backgroundSize: '50px 50px' }}>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 text-center">

        {/* Status Header */}
        <div className="mb-12 flex flex-col items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-blue-500/20 bg-blue-500/5 backdrop-blur-md">
            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-ping"></span>
            <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.4em]">Sector Syncing</span>
          </div>
          <h2 className="text-white/40 text-sm font-bold uppercase tracking-[0.2em]">Initialising Arena</h2>
        </div>

        {/* The Countdown Number */}
        <div key={count} className="relative group cursor-default">
          {/* Decorative Backglow */}
          <div className="absolute inset-0 blur-[100px] bg-blue-600/20 scale-150 animate-pulse"></div>

          <h1 className="text-[10rem] sm:text-[16rem] font-black leading-none bg-gradient-to-b from-white via-blue-200 to-blue-700 bg-clip-text text-transparent italic tracking-tighter transition-all duration-300 animate-count-pop select-none">
            {count > 0 ? count : "GO"}
          </h1>

          {/* Floating Orbitals */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full border border-white/5 rounded-full animate-[spin_4s_linear_infinite] scale-125"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full border border-blue-500/10 rounded-full animate-[spin_6s_linear_infinite_reverse] scale-150"></div>
        </div>

        {/* Progress Indicators */}
        <div className="mt-16 flex items-center justify-center gap-6">
          {[3, 2, 1].map((i) => (
            <div key={i} className="relative group">
              <div className={`h-1.5 w-16 rounded-full transition-all duration-700 ease-out ${count <= i ? 'bg-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.8)]' : 'bg-white/5'
                }`}></div>
              {count === i && (
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-[10px] font-black text-blue-500 animate-bounce">
                  READY
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Bottom Metadata */}
        <div className="absolute bottom-[-150px] left-1/2 -translate-x-1/2 opacity-20">
          <p className="text-[9px] font-mono text-white tracking-[1em] uppercase">TechnoBid Protocol v2.0</p>
        </div>
      </div>

      <style>{`
        @keyframes count-pop {
          0% { 
            transform: scale(0.7) translateY(20px); 
            opacity: 0; 
            filter: blur(20px) brightness(2); 
          }
          40% {
            transform: scale(1.05) translateY(-5px);
            opacity: 1;
            filter: blur(0px) brightness(1.2);
          }
          100% { 
            transform: scale(1) translateY(0); 
            opacity: 1; 
            filter: blur(0px) brightness(1);
          }
        }
        .animate-count-pop {
          animation: count-pop 0.9s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
      `}</style>
    </div>
  );
}