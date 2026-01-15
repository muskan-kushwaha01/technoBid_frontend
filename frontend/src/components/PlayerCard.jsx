import { useState } from "react";

export default function Player({ player, showBidButton = true, className = "" }) {
  // Handle both backend data (basePrice number) and frontend mock data (auction.base string)
  const displayBasePrice = player.basePrice ? `₹${player.basePrice}` : (player.auction?.base || "₹0");
  const baseNumeric = player.basePrice ? player.basePrice * 100000 : parsePrice(player.auction?.base || "₹0");

  const [currentBid, setCurrentBid] = useState(baseNumeric);

  const increaseBid = () => {
    setCurrentBid((prev) => prev + 200000); // +2 Lakh
  };

  return (
    <div className={`relative overflow-hidden shadow-[0_30px_80px_rgba(0,0,0,0.45)] ${className || "w-[92vw] max-w-[420px] h-[88vh] rounded-[32px]"}`}>

      {/* FULL IMAGE */}
      <img
        src={player.img || player.image}
        alt={player.name}
        className="absolute inset-0 h-full w-full object-cover contrast-110 brightness-110"
        onError={(e) => {
          e.target.onerror = null;
          e.target.src = "https://placehold.co/400x600/1e293b/FFF?text=Image+Not+Found";
        }}
      />

      {/* IPL GRADIENT OVERLAY */}
      <div className="absolute inset-0 bg-gradient-to-t 
        from-[#0b0f2b]/95 
        via-[#2b1a5a]/50 
        to-transparent"
      />

      {/* ROLE BADGE */}
      <span className="absolute top-4 left-4 z-10 rounded-full 
        bg-yellow-400/90 px-3 py-1 text-xs font-bold text-black shadow-lg">
        {player.role}
      </span>

      {/* CONTENT */}
      <div className="relative z-10 flex h-full flex-col justify-end p-5 text-white space-y-4">

        {/* NAME */}
        <div>
          <h2 className="text-2xl font-bold tracking-wide">
            {player.name}
          </h2>
          <p className="text-xs text-slate-100">
            {player.country} • Age {player.age}
          </p>
        </div>

        {/* STYLE / POSITION (ON IMAGE LIKE REFERENCE) */}
        <div className="flex flex-wrap gap-2">
          <MiniTag text={player.battingStyle || player.style} />
          <MiniTag text={player.position} />
          {(player.auction?.overseas || player.country?.includes("✈️")) && <MiniTag text="Overseas" />}
        </div>

        {/* STATS */}
        <div className="grid grid-cols-3 gap-3">
          {player.stats &&
            Object.entries(player.stats)
              .slice(0, 3)
              .map(([key, value], i) => (
                <Stat
                  key={i}
                  label={key.toUpperCase()}
                  value={value}
                />
              ))}
        </div>

        {/* STRENGTHS */}
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-amber-400">
            Strengths
          </p>

          <div className="flex flex-wrap gap-2">
            {player.strengths?.map((s, i) => (
              <span
                key={i}
                className="rounded-full bg-black/35 px-3 py-1 
                text-xs text-amber-200 backdrop-blur border border-white/10"
              >
                {s}
              </span>
            ))}
          </div>
        </div>

        {/* AUCTION PANEL */}
        <div className="rounded-2xl bg-black/35 backdrop-blur-md p-4 border border-white/15">
          {player.status === 'SOLD' ? (
            <div className="text-center py-2 relative overflow-hidden">
              <div className="absolute inset-0 bg-emerald-500/10 animate-pulse"></div>
              <p className="text-xl font-bold text-slate-200 relative z-10">
                Sold to <span className="text-emerald-400 font-black text-3xl block my-1">{player.soldToTeamId}</span>
              </p>
              <p className="text-sm text-slate-300 relative z-10">
                with the highest bid of <span className="text-white font-bold text-xl">₹{player.soldPrice}</span>
              </p>
            </div>
          ) : (
            <div className="flex justify-between items-center">
              <div>
                <p className="text-[10px] uppercase text-slate-300">
                  Base Price
                </p>
                <p className="font-semibold">
                  {displayBasePrice}
                </p>
              </div>
              {/* Removed Current Bid as requested */}
            </div>
          )}
        </div>

        {/* BID BUTTON */}
        {showBidButton && (
          <button
            onClick={increaseBid}
            className="w-full rounded-xl bg-gradient-to-r 
              from-amber-400 to-yellow-300 
              py-3 text-sm font-bold text-[#1b1405]
              shadow-lg hover:brightness-110 transition"
          >
            + BID ₹2 Lakh
          </button>
        )}
      </div>
    </div>
  );
}

/* ---------- SMALL COMPONENTS ---------- */

const MiniTag = ({ text }) => (
  <span className="rounded-full bg-black/35 px-3 py-1 text-[11px] text-white backdrop-blur">
    {text}
  </span>
);

const Stat = ({ label, value }) => (
  <div className="rounded-xl bg-black/35 backdrop-blur p-2 text-center">
    <p className="text-base font-bold text-yellow-300">{value}</p>
    <p className="text-[10px] uppercase text-slate-200">{label}</p>
  </div>
);

/* ---------- HELPER ---------- */
function parsePrice(price) {
  if (typeof price === 'number') return price;
  if (!price) return 0;
  if (price.toString().includes("Cr")) return parseFloat(price) * 10000000;
  if (price.toString().includes("L")) return parseFloat(price) * 100000;
  return 0;
}
