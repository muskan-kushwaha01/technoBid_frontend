export default function LobbyHeader({ totalPlayers }) {
  return (
    <div className="w-full flex flex-col items-center mb-10">
      {/* DECORATIVE TOP LINE */}
      <div className="w-32 h-1 bg-gradient-to-r from-transparent via-yellow-500 to-transparent mb-4" />

      {/* MAIN HEADING: AUCTION ARENA */}
      <div className="relative">
        <h1
          className="text-5xl sm:text-7xl font-black italic tracking-tighter mb-0"
          style={{
            color: "#ffffff",
            textShadow: "4px 4px 0px #1e40af, 8px 8px 0px rgba(0,0,0,0.2)",
            WebkitTextStroke: "1px rgba(255,255,255,0.1)"
          }}
        >
          TECHNO <span className="text-yellow-500"> BID</span>
        </h1>
        
        {/* SUBTITLE BAR */}
        <div className="absolute -bottom-2 left-0 w-full h-6 bg-blue-700 -skew-x-12 -z-10 flex items-center justify-center">
          <span className="text-[10px] font-bold tracking-[0.4em] text-blue-100 uppercase pl-4">
            Official Player Draft 2026
          </span>
        </div>
      </div>

      {/* PLAYER COUNT: STATS BAR */}
      <div className="mt-10 flex items-center gap-6">
        {/* Live Indicator */}
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 px-3 py-1 shadow-inner">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
          </span>
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Live</span>
        </div>

        {/* Counter */}
        <div className="text-center">
          <p className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-1">
            Enrolled Candidates
          </p>
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-3xl font-black text-white">{totalPlayers}</span>
            <span className="text-sm font-bold text-slate-500 italic">/ 80</span>
          </div>
        </div>

        {/* Vertical Divider */}
        <div className="h-8 w-[1px] bg-slate-800" />

        {/* Secondary Stat */}
        <div className="hidden sm:block text-left">
          <p className="text-[10px] font-bold text-yellow-500/80 uppercase tracking-tighter">
            Market Status
          </p>
          <p className="text-sm font-black text-white uppercase italic tracking-tighter">
            Bidding Open
          </p>
        </div>
      </div>

      {/* DECORATIVE BOTTOM GLOW */}
      <div className="w-full max-w-md h-[1px] bg-gradient-to-r from-transparent via-blue-500/50 to-transparent mt-6" />
    </div>
  );
}