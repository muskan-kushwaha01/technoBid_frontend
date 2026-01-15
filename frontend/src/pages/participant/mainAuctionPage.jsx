import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { doc, onSnapshot, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../firebase";
import PlayerCard from "../../components/PlayerCard";
import Accessories from "../../components/Accessories";
import Bowler from "../../components/Bowler";
import { BACKEND_URL } from "../../config";

export default function AuctionArena() {
  const navigate = useNavigate();

  // Auction State
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [currentBid, setCurrentBid] = useState(0);
  const [highestBidder, setHighestBidder] = useState(null);
  const [timeLeft, setTimeLeft] = useState(20);
  const [auctionStatus, setAuctionStatus] = useState("ACTIVE");
  const [lastSold, setLastSold] = useState(null);

  // User/Team State
  const [participant, setParticipant] = useState(null);
  const [teamId, setTeamId] = useState(null);
  const [myTeam, setMyTeam] = useState(null); // Stores full team data (purse, players)

  // UI State
  const [feedbackMsg, setFeedbackMsg] = useState("");
  const [isPaused, setIsPaused] = useState(false);

  // 1. Session Init
  useEffect(() => {
    const stored = JSON.parse(sessionStorage.getItem("currentParticipant"));
    if (!stored) navigate("/");
    else setParticipant(stored);
  }, [navigate]);

  // 2. Fetch Team ID
  useEffect(() => {
    if (!participant?.enrollmentNumber) return;

    const fetchTeamId = async () => {
      if (participant.teamId) {
        setTeamId(participant.teamId);
        return;
      }
      try {
        const q = query(collection(db, "teams"), where("members", "array-contains", participant.enrollmentNumber));
        const snap = await getDocs(q);
        if (!snap.empty) {
          setTeamId(snap.docs[0].id);
        } else {
          console.error("Team mapping not found for user.");
        }
      } catch (err) {
        console.error("Error fetching team ID:", err);
      }
    };
    fetchTeamId();
  }, [participant]);

  // 3. Listen to My Team Data (Purse & Squad)
  useEffect(() => {
    if (!teamId) return;
    const unsub = onSnapshot(doc(db, "teams", teamId), (docSnap) => {
      if (docSnap.exists()) {
        setMyTeam(docSnap.data());
      }
    });
    return () => unsub();
  }, [teamId]);

  // 4. Listen to Global Auction State
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "auction", "current"), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setCurrentPlayer(data.player);
        setCurrentBid(data.currentBid || 0);
        setHighestBidder(data.highestBidder || null);
        setTimeLeft(data.timer !== undefined ? data.timer : 20);
        setAuctionStatus(data.status || "ACTIVE");
        setLastSold(data.lastSold || null);
      }
    });
    return () => unsub();
  }, []);

  // 5. Check Lobby Status
  useEffect(() => {
    const lobbyRef = doc(db, "settings", "lobby");
    const unsubscribe = onSnapshot(lobbyRef, (docSnap) => {
      if (docSnap.exists()) {
        const { status } = docSnap.data();
        if (status === "LOCKED") navigate("/team-card", { replace: true });
        else if (status === "OPEN") navigate("/lobby", { replace: true });
        else if (status === "ENDED" || status === "RESULTS") navigate("/results", { replace: true });
        else if (status === "PAUSED") setIsPaused(true);
        else setIsPaused(false);
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  // 6. Clear Feedback
  useEffect(() => {
    if (feedbackMsg) {
      const timer = setTimeout(() => setFeedbackMsg(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [feedbackMsg]);

  // Handlers
  const handleBid = async () => {
    if (!currentPlayer) return;
    if (timeLeft <= 0) {
      setFeedbackMsg("⏳ Time is up! Bidding closed.");
      return;
    }
    if (!teamId) {
      setFeedbackMsg("❌ Error: Team not identified.");
      return;
    }


    try {
      const res = await fetch(`${BACKEND_URL}/api/auction/bid`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId: teamId }),
      });

      const data = await res.json();
      if (!res.ok) {
        setFeedbackMsg("⚠️ " + data.message);
      } else {
        console.log("Bid success:", data);
      }
    } catch (err) {
      console.error("Bid error:", err);
      setFeedbackMsg("❌ Connection Failed");
    }
  };

  return (
    <div className="min-h-screen bg-[#02040a] text-slate-100 relative font-sans overflow-y-auto pb-20">

      {/* PAUSED OVERLAY */}
      {isPaused && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center animate-in fade-in duration-300">
          <div className="bg-amber-500/10 p-12 rounded-[3rem] border border-amber-500/20 text-center shadow-2xl shadow-amber-900/20">
            <div className="w-20 h-20 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </div>
            <h2 className="text-5xl font-black text-amber-500 uppercase tracking-widest mb-4">Auction Paused</h2>
            <p className="text-amber-200/60 font-medium text-lg uppercase tracking-widest">Please wait for the administrator to resume</p>
          </div>
        </div>
      )}

      {/* Toast */}
      {feedbackMsg && (
        <div className="fixed top-24 right-6 z-50 animate-bounce-subtle">
          <div className="bg-red-500/90 text-white px-6 py-3 rounded-full font-bold shadow-2xl backdrop-blur border border-white/10 flex items-center gap-3">
            <span className="text-xl">📣</span>
            {feedbackMsg}
          </div>
        </div>
      )}

      {/* Background */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-5%] left-[-5%] w-[60%] h-[60%] bg-[#1e40af]/15 rotate-12 blur-[120px]"></div>
        <div className="absolute bottom-[-5%] right-[-5%] w-[50%] h-[50%] bg-[#1d4ed8]/10 -rotate-12 blur-[100px]"></div>
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`, backgroundSize: '80px 80px' }}>
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8 flex flex-col">

        {/* Header */}
        <nav className="flex flex-col md:flex-row justify-between items-center mb-6 md:mb-10 bg-white/[0.03] border border-white/10 p-4 md:p-5 rounded-2xl backdrop-blur-xl shadow-2xl gap-4">
          <div className="flex w-full md:w-auto justify-between md:justify-start items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></div>
              <h1 className="text-xl font-black tracking-widest uppercase italic">
                LIVE<span className="text-blue-500">NOW</span>
              </h1>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6 w-full md:w-auto">
            {/* Purse Display - VISIBLE ON MOBILE NOW */}
            {myTeam && (
              <div className="flex flex-row md:flex-col items-center md:items-end justify-between w-full md:w-auto border-b md:border-b-0 md:border-r border-white/10 pb-2 md:pb-0 md:pr-6">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-0 md:mb-1">Purse Remaining</p>
                <p className="text-2xl font-black text-green-400">₹{myTeam.purse}</p>
              </div>
            )}

            <div className="flex items-center justify-between w-full md:w-auto gap-4 bg-black/40 px-4 py-2 rounded-xl border border-white/5">
              <div className="text-left md:text-right">
                <p className="text-[10px] text-slate-500 font-bold tracking-[0.2em] leading-none mb-1">
                  {(() => {
                    if (!myTeam?.name) return "Team";
                    let n = myTeam.name;
                    n = n.charAt(0).toUpperCase() + n.slice(1);
                    if (!n.toLowerCase().includes("team")) n += " Team";
                    return n;
                  })()}
                </p>
                <p className="text-sm font-bold text-white tracking-wide truncate max-w-[120px] md:max-w-none">
                  {participant?.name ? (participant.name.charAt(0).toUpperCase() + participant.name.slice(1)) : "Participant"}
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center font-black text-white shadow-lg shadow-blue-500/20">
                {participant?.name?.charAt(0) || "P"}
              </div>
            </div>
          </div>
        </nav>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-10 mb-12">

          {/* LEFT: Player Card */}
          <section className="col-span-12 lg:col-span-7 flex justify-center">
            {currentPlayer ? (
              <div className="w-full flex justify-center animate-fade-in">
                {currentPlayer.auctionPhase === "ACCESSORIES" || currentPlayer.forUse ? (
                  <Accessories
                    key={currentPlayer.id}
                    {...currentPlayer}
                    status={auctionStatus === 'SOLD' ? 'SOLD' : (currentPlayer.status || 'UNSOLD')}
                    soldToTeamName={auctionStatus === 'SOLD' && lastSold ? (lastSold.teamName || `Team ${lastSold.teamId}`) : null}
                    soldPrice={auctionStatus === 'SOLD' && lastSold ? lastSold.price : 0}
                    currentBid={currentBid}
                    showBidButton={false}
                    className="w-full max-w-[450px] aspect-[3/4] rounded-[40px] shadow-2xl border border-white/5"
                  />
                ) : currentPlayer.auctionPhase === "BOWLERS" ? (
                  <Bowler
                    key={currentPlayer.id}
                    bowler={{
                      ...currentPlayer,
                      status: auctionStatus === 'SOLD' ? 'SOLD' : (currentPlayer.status || 'UNSOLD'),
                      soldToTeamName: auctionStatus === 'SOLD' && lastSold ? (lastSold.teamName || `Team ${lastSold.teamId}`) : null,
                      soldPrice: auctionStatus === 'SOLD' && lastSold ? lastSold.price : 0
                    }}
                    showBidButton={false}
                    className="w-full max-w-[450px] aspect-[3/4] rounded-[40px] shadow-2xl border border-white/5"
                  />
                ) : (
                  <PlayerCard
                    key={currentPlayer.id}
                    player={{
                      ...currentPlayer,
                      status: auctionStatus === 'SOLD' ? 'SOLD' : (currentPlayer.status || 'UNSOLD'),
                      soldToTeamId: auctionStatus === 'SOLD' && lastSold ? (lastSold.teamName || `Team ${lastSold.teamId}`) : null,
                      soldPrice: auctionStatus === 'SOLD' && lastSold ? lastSold.price : 0
                    }}
                    showBidButton={false}
                    className="w-full max-w-[450px] aspect-[3/4] rounded-[40px] shadow-2xl border border-white/5"
                  />
                )}
              </div>
            ) : (
              <div className="w-full max-w-[450px] aspect-[3/4] bg-white/[0.02] border border-dashed border-white/10 rounded-[40px] flex flex-col items-center justify-center text-center p-6">
                <div className="w-12 h-12 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-4"></div>
                <p className="text-slate-500 font-black uppercase tracking-[0.3em] text-[10px]">Scanning Arena...</p>
                {lastSold && (
                  <div className="mt-4 animate-bounce-subtle">
                    <p className="text-lg font-bold text-slate-200">
                      Sold to <span className="text-emerald-400 font-black text-3xl">{lastSold.teamName || lastSold.teamId}</span>
                    </p>
                    <p className="text-sm text-slate-300">
                      with the highest bid of <span className="text-white font-bold text-xl">₹{lastSold.price}</span>
                    </p>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* RIGHT: Stats & Bidding */}
          <section className="col-span-12 lg:col-span-5 flex flex-col gap-6">

            {/* Price & Timer */}
            <div className="bg-[#0a0c14] rounded-[2.5rem] border border-white/10 p-6 md:p-10 relative overflow-hidden shadow-2xl">
              <div className="absolute top-4 right-4 md:top-8 md:right-8 flex items-center gap-3 bg-black/50 px-3 py-1.5 md:px-4 md:py-2 rounded-full border border-white/10 backdrop-blur-md">
                <div className={`w-2 h-2 rounded-full ${timeLeft <= 5 ? "bg-red-500 animate-pulse" : "bg-green-500"}`}></div>
                <span className={`font-mono font-bold text-sm md:text-base ${timeLeft <= 5 ? "text-red-500" : "text-white"}`}>
                  00:{timeLeft < 10 ? `0${timeLeft}` : timeLeft}
                </span>
              </div>

              <div className="relative z-10">
                <p className="text-blue-500 font-black text-[10px] uppercase tracking-[0.4em] mb-2 md:mb-4">Market Valuation</p>
                <div className="flex items-baseline gap-3 mb-6 md:mb-8">
                  <span className="text-5xl md:text-7xl font-black text-white tracking-tighter break-all">₹{currentBid}</span>
                </div>

                <div className="bg-white/[0.03] p-4 md:p-5 rounded-2xl border border-white/5 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Current Holder</span>
                    <span className="text-sm md:text-lg font-bold text-white uppercase truncate max-w-[150px]">
                      {highestBidder || "No Bids"}
                    </span>
                  </div>
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-500/10 rounded-xl flex items-center justify-center border border-blue-500/20">
                    <svg className="w-5 h-5 md:w-6 md:h-6 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Bidding Button */}
            <div className="p-2 bg-white/[0.02] border border-white/10 rounded-[3rem]">
              <button
                onClick={handleBid}
                disabled={!currentPlayer || timeLeft <= 0}
                className="w-full group bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-black py-6 md:py-8 rounded-[2.5rem] transition-all duration-300 shadow-xl shadow-blue-900/40 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-4"
              >
                <span className="text-lg md:text-2xl uppercase tracking-tighter italic">
                  {timeLeft <= 0 ? "Bidding Closed" : "Enter Bid"}
                </span>
                {timeLeft > 0 && (
                  <svg className="w-8 h-8 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-300" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
                )}
              </button>
            </div>

          </section>
        </div>

        {/* BOTTOM SECTION: SQUAD ONLY */}
        <div className="grid grid-cols-12 gap-6">

          {/* My Squad */}
          <div className="col-span-12 space-y-6">
            {/* PLAYERS SECTION */}
            <div className="bg-white/[0.01] border border-white/5 rounded-[2.5rem] p-8">
              <div className="flex items-center justify-between mb-6">
                <h4 className="text-xs font-black text-blue-400 uppercase tracking-widest flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span> My Squad
                </h4>
                <span className="text-xs font-bold text-slate-500">
                  {myTeam?.boughtPlayers?.filter(p => Number(p.id) <= 1000).length || 0} Players
                </span>
              </div>

              {myTeam?.boughtPlayers?.filter(p => Number(p.id) <= 1000).length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {myTeam.boughtPlayers.filter(p => Number(p.id) <= 1000).map((p, i) => (
                    <div key={i} className="bg-white/5 border border-white/5 rounded-xl p-3 flex items-center justify-between hover:bg-white/10 transition-colors">
                      <div>
                        <p className="font-bold text-white text-sm">{p.name}</p>
                        <p className="text-[10px] text-slate-400 uppercase tracking-wide">{p.role}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-green-400 text-sm">₹{p.price}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 border border-dashed border-white/10 rounded-xl">
                  <p className="text-slate-600 text-xs italic">No players purchased yet.</p>
                </div>
              )}
            </div>

            {/* ACCESSORIES SECTION */}
            {myTeam?.boughtPlayers?.some(p => Number(p.id) > 1000) && (
              <div className="bg-white/[0.01] border border-white/5 rounded-[2.5rem] p-8 animate-fade-in">
                <div className="flex items-center justify-between mb-6">
                  <h4 className="text-xs font-black text-amber-400 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-2 h-2 bg-amber-500 rounded-full"></span> Accessories
                  </h4>
                  <span className="text-xs font-bold text-slate-500">
                    {myTeam?.boughtPlayers?.filter(p => Number(p.id) > 1000).length || 0} Items
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {myTeam.boughtPlayers.filter(p => Number(p.id) > 1000).map((p, i) => (
                    <div key={i} className="bg-white/5 border border-white/5 rounded-xl p-3 flex items-center justify-between hover:bg-white/10 transition-colors border-l-4 border-l-amber-500/50">
                      <div>
                        <p className="font-bold text-white text-sm">{p.name}</p>
                        <p className="text-[10px] text-slate-400 uppercase tracking-wide">{p.role}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-amber-400 text-sm">₹{p.price}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>

      </div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fade-in 0.5s ease-out forwards; }
        
        @keyframes bounce-subtle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        .animate-bounce-subtle { animation: bounce-subtle 3s ease-in-out infinite; }

        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #1e40af; border-radius: 10px; }
      `}</style>
    </div>
  );
}