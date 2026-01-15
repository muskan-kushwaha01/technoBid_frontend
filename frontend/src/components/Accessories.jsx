import { useState } from "react";

export default function Accessories({
  name,
  forUse,
  purpose = [],
  basePrice,
  importanceScore = 5,
  image,
  currentBid,
  status,
  soldToTeamName,
  soldPrice,
  showBidButton = false,
  className = ""
}) {
  const displayBasePrice = `₹${basePrice}`;
  const displayCurrentBid = currentBid ? `₹${currentBid}` : displayBasePrice;

  return (
    <div className={`bg-gradient-to-br from-violet-900/30 to-black p-[1px] shadow-xl mx-auto ${className || "w-[92vw] max-w-[420px] md:w-[320px] rounded-[28px]"}`}>
      <div className="relative rounded-[26px] bg-[#0e0e15] text-slate-100 overflow-hidden h-full flex flex-col">

        {/* IMAGE */}
        <div className="relative h-[240px] w-full overflow-hidden shrink-0">
          <img src={image} alt={name} className="h-full w-full object-cover contrast-110 brightness-110" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
          <div className="absolute top-4 right-4 rounded-full bg-black/70 px-3 py-1 text-[11px] font-semibold text-amber-400 border border-amber-400/40">
            ⭐ {importanceScore}/10
          </div>
        </div>

        {/* CONTENT */}
        <div className="p-5 flex-1 flex flex-col">
          <h2 className="text-xl font-bold tracking-wide text-white">{name}</h2>
          <p className="text-xs text-slate-400 mt-1">{forUse} Accessory</p>

          <div className="mt-4 flex-1">
            <p className="text-[10px] uppercase tracking-widest text-amber-400 mb-2">Purpose</p>
            <ul className="space-y-1.5 text-[13px] text-slate-300">
              {purpose.map((p, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-amber-400">•</span>
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* AUCTION PANEL */}
          <div className="mt-6 rounded-xl border border-slate-800 bg-black/50 p-4">
            {status === "SOLD" ? (
              <div className="text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-emerald-500/10 animate-pulse"></div>
                <p className="text-emerald-400 font-bold text-sm uppercase tracking-widest mb-1 relative z-10">Sold To</p>
                <p className="text-white font-black text-3xl relative z-10 uppercase">{soldToTeamName || "Unknown"}</p>
                <p className="text-slate-400 text-sm mt-1 relative z-10">for <span className="text-white font-bold text-xl">₹{soldPrice}</span></p>
              </div>
            ) : (
              <div className="flex justify-center text-sm">
                <div className="text-center">
                  <p className="text-[10px] uppercase text-slate-400">Base Price</p>
                  <p className="text-lg font-black text-white">{displayBasePrice}</p>
                </div>
              </div>
            )}
          </div>

          {
            showBidButton && (
              <button className="mt-4 w-full bg-amber-500 text-black font-bold py-2 rounded-xl">Bid</button>
            )
          }
        </div >
      </div >
    </div >
  );
}

/* ================= SMALL INFO BLOCK ================= */
const Info = ({ label, value }) => (
  <div>
    <p className="text-[10px] uppercase text-slate-400">{label}</p>
    <p className="text-sm font-semibold">{value}</p>
  </div>
);
