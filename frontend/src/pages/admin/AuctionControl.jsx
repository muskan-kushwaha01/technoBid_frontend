import { useEffect, useState, useRef, useCallback } from "react";
import PlayerCard from "../../components/PlayerCard";
import Accessories from "../../components/Accessories";
import Bowler from "../../components/Bowler";
import { doc, updateDoc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "../../firebase";
import {
  Play,
  Pause,
  RotateCcw,
  Gavel,
  ChevronRight,
  LayoutGrid,
  Zap,
  AlertTriangle,
  Info
} from "lucide-react";

import { BACKEND_URL } from "../../config";

const API = `${BACKEND_URL}/api/admin`;

export default function AuctionControl() {
  const [status, setStatus] = useState("IDLE"); // IDLE | LIVE
  const [rawStatus, setRawStatus] = useState("");
  const [phase, setPhase] = useState("BATTERS");
  const [players, setPlayers] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [message, setMessage] = useState("");
  const [liveAuctionData, setLiveAuctionData] = useState(null);

  const currentPlayerIdRef = useRef(null);

  const currentIndexRef = useRef(currentIndex);
  currentIndexRef.current = currentIndex;

  const currentPlayer = players[currentIndex];

  // Keep Ref updated with latest ID to combat stale closures in useEffect
  currentPlayerIdRef.current = currentPlayer?.id;

  /* ================= LOGIC ================= */
  /* ================= LOGIC ================= */
  const fetchPlayers = useCallback(async (selectedPhase, shouldResetIndex = true) => {
    // Capture ID from Ref (Current State)
    const savedId = currentPlayerIdRef.current;

    try {
      const res = await fetch(`${API}/players?phase=${selectedPhase}`);
      const data = await res.json();
      const newPlayers = data.players || [];
      setPlayers(newPlayers);

      if (shouldResetIndex) {
        setCurrentIndex(0);
      } else if (savedId) {
        // Restore position of the same player
        const newIndex = newPlayers.findIndex(p => p.id === savedId);
        if (newIndex !== -1) {
          setCurrentIndex(newIndex);
        } else if (currentIndexRef.current >= newPlayers.length) {
          // Safety fallback if player gone and index out of bounds
          setCurrentIndex(0);
        }
      }
    } catch (err) {
      console.error(err);
      setMessage("❌ Failed to load players");
    }
  }, []);

  useEffect(() => {
    fetchPlayers(phase, true);
  }, [phase, fetchPlayers]);

  // Listen to Lobby Settings
  useEffect(() => {
    const lobbyRef = doc(db, "settings", "lobby");
    const unsubscribe = onSnapshot(lobbyRef, (docSnap) => {
      if (docSnap.exists()) {
        const lobbyData = docSnap.data();
        setRawStatus(lobbyData.status || "");
        if (lobbyData.status === "STARTING" || lobbyData.status === "LIVE") {
          setStatus("LIVE");
        } else if (lobbyData.status === "PAUSED") {
          setStatus("PAUSED");
        } else if (lobbyData.status === "RESULTS" || lobbyData.status === "ENDED") {
          setStatus("ENDED");
        } else {
          setStatus("IDLE");
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // Listen to Live Auction Data & Refresh List on End
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "auction", "current"), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setLiveAuctionData(data);

        // Refresh player list if auction just finished
        if (data.status === "SOLD" || data.status === "UNSOLD") {
          fetchPlayers(phase, false);
        }
      }
    });
    return () => unsub();
  }, [fetchPlayers, phase]);

  const callAPI = async (url, body = null) => {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : null,
      });
      const data = await res.json();
      setMessage(data.message || "Action completed");
      return res.ok;
    } catch {
      setMessage("❌ Backend not reachable");
      return false;
    }
  };

  const togglePause = async () => {
    try {
      if (status === "PAUSED") {
        await fetch(`${API}/resume-auction`, { method: "POST" });
      } else {
        await fetch(`${API}/pause-auction`, { method: "POST" });
      }
    } catch (err) {
      console.error(err);
      setMessage("Failed to toggle pause");
    }
  };

  const endAuction = async () => {
    if (!window.confirm("⚠️ Are you sure you want to END the auction? This will move all participants to the Results page.")) return;
    try {
      await updateDoc(doc(db, "settings", "lobby"), { status: "RESULTS" });
    } catch (err) {
      console.error("Failed to end auction", err);
    }
  };

  const startAuction = async () => {
    try {
      if (rawStatus !== "LOCKED") {
        setMessage("⚠️ Please LOCK the lobby first (in Lobby Management)");
        return;
      }
      const lobbyRef = doc(db, "settings", "lobby");
      await updateDoc(lobbyRef, { status: "STARTING" });
      const success = await callAPI(`${API}/start-auction`);
      if (success) {
        setStatus("LIVE");
        setMessage("✅ Auction Started successfully!");
      }
    } catch (err) {
      setMessage("❌ Error: " + err.message);
    }
  };

  const sendPlayerToAuction = async () => {
    if (!currentPlayer) return;

    try {
      const success = await callAPI(`${API}/select-player`, {
        playerId: currentPlayer.id,
      });

      if (success) {
        const auctionRef = doc(db, "auction", "current");
        const payload = {
          player: currentPlayer,
          currentBid: currentPlayer.basePrice,
          highestBidder: null,
          status: "ACTIVE",
          timestamp: Date.now(),
        };

        // Check for undefined values which crash Firestore
        Object.keys(payload).forEach(key => {
          if (payload[key] === undefined) {
            console.error(`Found undefined key in payload: ${key}`);
            payload[key] = null;
          }
        });

        await setDoc(auctionRef, payload);
        setMessage(`🎯 ${currentPlayer.name} sent to auction!`);
      }
    } catch (err) {
      console.error("Error in sendPlayerToAuction:", err);
      setMessage("❌ Error sending player: " + err.message);
    }
  };

  const nextPlayer = () => {
    setCurrentIndex((i) => i + 1 < players.length ? i + 1 : i);
  };

  const prevPlayer = () => {
    setCurrentIndex((i) => i - 1 >= 0 ? i - 1 : i);
  };

  const restartAuction = async () => {
    if (!window.confirm("⚠️ Are you sure you want to RESTART?")) return;
    try {
      const lobbyRef = doc(db, "settings", "lobby");
      await updateDoc(lobbyRef, { status: "LOCKED" });
      const success = await callAPI(`${API}/restart-auction`);
      if (success) {
        setStatus("IDLE");
        setPhase("BATTERS");
        fetchPlayers("BATTERS");
        setMessage("🔄 Auction has been restarted.");
      }
    } catch (err) {
      setMessage("❌ Error restarting: " + err.message);
    }
  };



  /* ================= MODERN UI ================= */

  return (
    <div className="min-h-screen bg-[#0f111a] text-slate-200 p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* TOP NAV / HEADER */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900/50 p-6 rounded-3xl border border-white/5 backdrop-blur-md">
          <div>
            <div className="flex items-center gap-2 text-violet-400 mb-1">
              <Gavel size={20} />
              <span className="text-xs font-bold uppercase tracking-[0.2em]">Control Center</span>
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight">
              Auction <span className="text-violet-500">Live</span>
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className={`px-4 py-2 rounded-2xl flex items-center gap-2 border ${status === "LIVE" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" :
              status === "PAUSED" ? "bg-amber-500/10 border-amber-500/20 text-amber-400" :
                "bg-slate-800 border-white/5 text-slate-400"
              }`}>
              <div className={`h-2 w-2 rounded-full ${status === "LIVE" ? "bg-emerald-500 animate-pulse" :
                status === "PAUSED" ? "bg-amber-500" :
                  "bg-slate-600"
                }`} />
              <span className="text-xs font-bold uppercase">{status}</span>
            </div>

            {status === "IDLE" ? (
              <button
                onClick={startAuction}
                className="flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 font-bold text-white shadow-lg shadow-emerald-500/20 hover:brightness-110 active:scale-95 transition-all"
              >
                <Play size={20} fill="currentColor" />
                Start Auction
              </button>
            ) : status === "ENDED" ? (
              <button
                onClick={restartAuction}
                className="flex items-center gap-2 rounded-xl bg-red-600 px-6 py-3 font-bold text-white shadow-lg shadow-red-500/20 hover:brightness-110 active:scale-95 transition-all"
              >
                <RotateCcw size={20} />
                Reset Auction
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={togglePause}
                  className={`flex items-center gap-2 rounded-xl px-6 py-3 font-bold text-white shadow-lg transition-all active:scale-95 ${status === "PAUSED"
                    ? "bg-amber-500 shadow-amber-500/20 hover:brightness-110"
                    : "bg-slate-700 hover:bg-slate-600"
                    }`}
                >
                  {status === "PAUSED" ? (
                    <>
                      <Play size={20} fill="currentColor" /> Resume
                    </>
                  ) : (
                    <>
                      <Pause size={20} fill="currentColor" /> Pause
                    </>
                  )}
                </button>

                <button
                  onClick={endAuction}
                  className="flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/50 px-4 py-3 font-bold text-red-500 hover:bg-red-500 hover:text-white transition-all active:scale-95"
                  title="End Auction & Show Results"
                >
                  <AlertTriangle size={20} />
                  End
                </button>
              </div>
            )}
          </div>
        </header>

        {/* NOTIFICATION TOAST (Minimal) */}
        {message && (
          <div className="flex items-center gap-3 bg-violet-600/20 border border-violet-500/30 p-4 rounded-2xl animate-in slide-in-from-top-4 duration-300">
            <Info size={18} className="text-violet-400" />
            <p className="text-sm font-medium text-violet-200">{message}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* LEFT COLUMN: PLAYER SELECTION & CONTROLS */}
          <div className="lg:col-span-4 space-y-6">

            {/* START BUTTON PANEL */}
            {status === "IDLE" && (!liveAuctionData || liveAuctionData.status === "IDLE") && (
              <div className="bg-gradient-to-br from-violet-600 to-indigo-700 p-1 rounded-3xl shadow-lg shadow-violet-900/20">
                <button
                  onClick={startAuction}
                  className="w-full bg-[#0f111a]/20 backdrop-blur-sm p-6 rounded-[22px] flex flex-col items-center gap-3 group transition-all hover:bg-transparent"
                >
                  <div className="bg-white/20 p-3 rounded-2xl group-hover:scale-110 transition-transform">
                    <Zap size={24} className="fill-white text-white" />
                  </div>
                  <span className="font-black text-white tracking-wide uppercase">Initialize Global Auction</span>
                </button>
              </div>
            )}

            {/* PHASE SELECTOR */}
            <section className="bg-slate-900/40 border border-white/5 p-5 rounded-3xl">
              <h3 className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">
                <LayoutGrid size={14} /> Category Phase
              </h3>
              <div className="grid grid-cols-1 gap-2">
                {["BATTERS", "BOWLERS", "ACCESSORIES"].map((p) => (
                  <button
                    key={p}
                    onClick={async () => {
                      setPhase(p);
                      await callAPI(`${API}/change-phase`, { phase: p });
                    }}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all ${phase === p
                      ? "bg-violet-600 text-white shadow-lg shadow-violet-900/40"
                      : "bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-white"
                      }`}
                  >
                    {p}
                    {phase === p && <ChevronRight size={16} />}
                  </button>
                ))}
              </div>
            </section>


          </div>

          {/* RIGHT COLUMN: CURRENT PLAYER DISPLAY */}
          <div className="lg:col-span-8">
            <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-6 h-full flex flex-col">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                  <h2 className="text-xl font-bold text-white">Stage Command</h2>
                  <p className="text-sm text-slate-500 italic">Select and push player to live arena</p>
                </div>

                <div className="relative w-full md:w-64">
                  <select
                    className="w-full bg-slate-800 text-white text-sm font-bold px-4 py-3 rounded-xl border border-white/10 appearance-none outline-none focus:ring-2 focus:ring-violet-500 transition-all cursor-pointer"
                    value={currentPlayer?.id || ""}
                    onChange={(e) => {
                      const selectedId = e.target.value;
                      const index = players.findIndex(p => String(p.id) === String(selectedId));
                      if (index !== -1) setCurrentIndex(index);
                    }}
                  >
                    {players.map(p => {
                      let prefix = "⚪ ";
                      if (p.status === "SOLD") prefix = "🟢 SOLD - ";
                      else if (p.status === "UNSOLD" && p.wasSent) prefix = "🔴 UNSOLD - ";
                      else if (p.wasSent) prefix = "✔ ";

                      return (
                        <option key={p.id} value={p.id}>
                          {prefix}{p.name}
                        </option>
                      );
                    })}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                    <ChevronRight size={18} className="rotate-90" />
                  </div>
                </div>
              </div>

              {currentPlayer?.status === "SOLD" && (
                <div className="mb-6 bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl flex items-center gap-3">
                  <AlertTriangle className="text-amber-500" size={20} />
                  <div>
                    <p className="text-amber-400 font-bold text-sm uppercase tracking-wider">Player Sold</p>
                    <p className="text-white font-medium text-sm">
                      Sold to <span className="font-bold text-amber-400">{currentPlayer.soldToTeamName || `Team ${currentPlayer.soldToTeamId}`}</span> for <span className="font-bold text-white">₹{currentPlayer.soldPrice}</span>
                    </p>
                  </div>
                </div>
              )}

              {!currentPlayer ? (
                <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-2xl py-20">
                  <div className="p-4 bg-slate-800 rounded-full mb-4">
                    <LayoutGrid size={32} className="text-slate-600" />
                  </div>
                  <p className="text-slate-500 font-medium">Wait List Empty</p>
                </div>
              ) : (
                <div className="flex-1 space-y-8 animate-in fade-in zoom-in-95 duration-500">

                  {/* LIVE BIDDING MONITOR */}
                  {liveAuctionData?.player?.id === currentPlayer.id && liveAuctionData?.status === "ACTIVE" && (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl flex justify-between items-center animate-pulse">
                      <div>
                        <p className="text-emerald-400 text-[10px] font-black uppercase tracking-widest">Live Bid</p>
                        <p className="text-3xl font-black text-white">₹{liveAuctionData.currentBid}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-emerald-400 text-[10px] font-black uppercase tracking-widest">Highest Bidder</p>
                        <p className="text-xl font-bold text-white">{liveAuctionData.highestBidder || "Waiting..."}</p>
                        <div className="mt-1 inline-block bg-emerald-500 text-black text-xs font-bold px-2 py-0.5 rounded-md">
                          ⏱ {liveAuctionData.timer}s
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="bg-[#0f111a] rounded-2xl border border-white/5 overflow-hidden shadow-2xl flex justify-center">
                    {currentPlayer.auctionPhase === "ACCESSORIES" ? (
                      <Accessories
                        key={currentPlayer.id}
                        {...currentPlayer}
                        soldToTeamName={currentPlayer.soldToTeamName || `Team ${currentPlayer.soldToTeamId}`}
                        soldPrice={currentPlayer.soldPrice}
                        status={currentPlayer.status}
                        currentBid={liveAuctionData?.player?.id === currentPlayer.id ? liveAuctionData.currentBid : 0}
                        showBidButton={false}
                      />
                    ) : currentPlayer.auctionPhase === "BOWLERS" ? (
                      <Bowler
                        key={currentPlayer.id}
                        bowler={{
                          ...currentPlayer,
                          soldToTeamName: currentPlayer.soldToTeamName || `Team ${currentPlayer.soldToTeamId}`,
                          soldPrice: currentPlayer.soldPrice,
                          status: currentPlayer.status
                        }}
                        showBidButton={false}
                      />
                    ) : (
                      <PlayerCard
                        player={{
                          ...currentPlayer,
                          soldToTeamId: currentPlayer.soldToTeamName || currentPlayer.soldToTeamId
                        }}
                        showBidButton={false}
                      />
                    )}
                  </div>

                  <div className="grid grid-cols-[1fr_auto_auto] gap-2">
                    <button
                      onClick={sendPlayerToAuction}
                      disabled={currentPlayer.wasSent || status === "PAUSED"}
                      className={`flex items-center justify-center gap-3 py-4 rounded-2xl font-black uppercase tracking-tighter transition-all px-6 ${currentPlayer.wasSent || status === "PAUSED"
                        ? "bg-slate-700 text-slate-400 cursor-not-allowed opacity-50"
                        : "bg-white text-black hover:bg-violet-400"
                        }`}
                    >
                      <Gavel size={20} />
                      {currentPlayer.wasSent ? "Sent" : status === "PAUSED" ? "Paused" : "Push"}
                    </button>
                    <button
                      onClick={prevPlayer}
                      className="flex items-center justify-center bg-slate-800 text-white p-4 rounded-2xl font-bold hover:bg-slate-700 transition-all border border-white/5 w-16"
                      title="Previous Player"
                    >
                      <ChevronRight size={18} className="rotate-180" />
                    </button>
                    <button
                      onClick={nextPlayer}
                      className="flex items-center justify-center bg-slate-800 text-white p-4 rounded-2xl font-bold hover:bg-slate-700 transition-all border border-white/5 w-16"
                      title="Next Player"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}