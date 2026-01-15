import { useState } from "react";

export default function Bowler({ bowler, showBidButton = true, className = "" }) {

  /* ✅ SAFE DEFAULT OBJECT */
  const safeBowler = bowler || {};

  /* ✅ HOOK ALWAYS AT TOP (NO CONDITION) */
  const baseNumeric = parsePrice(safeBowler?.auction?.base || "₹0");
  const [currentBid, setCurrentBid] = useState(baseNumeric);

  /* ❌ AFTER HOOK — SAFE TO RETURN */
  if (!bowler) return null;

  const increaseBid = () => {
    setCurrentBid((prev) => prev + 200000);
  };

  return (
    <div className={`relative overflow-hidden shadow-[0_30px_80px_rgba(0,0,0,0.45)] ${className || "w-[92vw] max-w-[420px] h-[88vh] rounded-[32px]"}`}>

      {/* IMAGE */}
      {bowler.image && (
        <img
          src={bowler.image}
          alt={bowler.name}
          className="absolute inset-0 h-full w-full object-cover contrast-110 brightness-110"
        />
      )}

      {/* OVERLAY */}
      <div className="absolute inset-0 bg-gradient-to-t 
        from-[#0b0f2b]/95 
        via-[#2b1a5a]/50 
        to-transparent"
      />

      {/* ROLE */}
      {bowler.role && (
        <span className="absolute top-4 left-4 z-10 rounded-full 
          bg-yellow-400/90 px-3 py-1 text-xs font-bold text-black">
          {bowler.role}
        </span>
      )}

      {/* CONTENT */}
      <div className="relative z-10 flex h-full flex-col justify-end p-5 text-white space-y-4">

        {/* NAME */}
        <div>
          <h2 className="text-2xl font-bold">{bowler.name}</h2>
          <p className="text-xs text-slate-100">
            {bowler.country} • Age {bowler.age}
          </p>
        </div>

        {/* TAGS */}
        {(bowler.bowlingStyle || bowler.auction?.overseas) && (
          <div className="flex flex-wrap gap-2">
            {bowler.battingStyle && <MiniTag text={bowler.battingStyle} />}
            {bowler.bowlingStyle && <MiniTag text={bowler.bowlingStyle} />}
            {bowler.auction?.overseas && <MiniTag text="Overseas" />}
          </div>
        )}

        {/* STATS */}
        {bowler.stats && (
          <div className="grid grid-cols-3 gap-3">
            {bowler.stats.matches && <Stat label="MATCHES" value={bowler.stats.matches} />}
            {bowler.stats.wickets && <Stat label="WKTS" value={bowler.stats.wickets} />}
            {bowler.stats.econ && <Stat label="ECON" value={bowler.stats.econ} />}
            {bowler.stats.runs && <Stat label="RUNS" value={bowler.stats.runs} />}
          </div>
        )}

        {/* STRENGTHS */}
        {bowler.strengths?.length > 0 && (
          <div>
            <p className="text-[11px] uppercase tracking-widest text-amber-400 mb-2">
              Strengths
            </p>
            <div className="flex flex-wrap gap-2">
              {bowler.strengths.map((s, i) => (
                <span
                  key={i}
                  className="rounded-full bg-black/35 px-3 py-1 text-xs text-amber-300 backdrop-blur"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* AUCTION */}
        {/* AUCTION PANEL */}
        <div className="rounded-2xl bg-black/35 backdrop-blur-md p-4 border border-white/15">
          {bowler.status === 'SOLD' ? (
            <div className="text-center py-2 relative overflow-hidden">
              <div className="absolute inset-0 bg-emerald-500/10 animate-pulse"></div>
              <p className="text-xl font-bold text-slate-200 relative z-10">
                Sold to <span className="text-emerald-400 font-black text-3xl block my-1">{bowler.soldToTeamName || "Unknown Team"}</span>
              </p>
              <p className="text-sm text-slate-300 relative z-10">
                with the highest bid of <span className="text-white font-bold text-xl">₹{bowler.soldPrice}</span>
              </p>
            </div>
          ) : (
            bowler.auction?.base && (
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-[10px] uppercase text-slate-300">Base</p>
                  <p className="font-semibold">{bowler.auction.base}</p>
                </div>
              </div>
            )
          )}
        </div>

        {/* BID BUTTON */}
        {showBidButton && (
          <button
            onClick={increaseBid}
            className="w-full rounded-xl bg-gradient-to-r 
          from-amber-400 to-yellow-300 
          py-3 text-sm font-bold text-[#1b1405]"
          >
            + BID ₹2 Lakh
          </button>
        )}
      </div>
    </div>
  );
}

/* -------- SMALL COMPONENTS -------- */

const MiniTag = ({ text }) => (
  <span className="rounded-full bg-black/35 px-3 py-1 text-[11px] text-white">
    {text}
  </span>
);

const Stat = ({ label, value }) => (
  <div className="rounded-xl bg-black/35 p-2 text-center">
    <p className="text-base font-bold text-yellow-300">{value}</p>
    <p className="text-[10px] uppercase text-slate-200">{label}</p>
  </div>
);

/* -------- HELPER -------- */
function parsePrice(price) {
  if (typeof price === 'number') return price;
  if (!price) return 0;
  if (price.toString().includes("Cr")) return parseFloat(price) * 10000000;
  if (price.toString().includes("L")) return parseFloat(price) * 100000;
  return 0;
}
