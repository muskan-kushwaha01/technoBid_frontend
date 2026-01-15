import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { doc, onSnapshot, collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../firebase";

export default function TeamCardPage() {
  const navigate = useNavigate();
  const location = useLocation();

  // Logic States (Untouched)
  const [participant, setParticipant] = useState(undefined);
  const [teamData, setTeamData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [teamId, setTeamId] = useState(null);
  const [ignoreOpenStatus, setIgnoreOpenStatus] = useState(location.state?.lockedByAdmin || false);
  const [memberCount, setMemberCount] = useState(0);
  const [budgetDisplay, setBudgetDisplay] = useState(0);

  useEffect(() => {
    const stored = JSON.parse(sessionStorage.getItem("currentParticipant") || "null");
    setParticipant(stored);
  }, []);

  useEffect(() => {
    if (ignoreOpenStatus) {
      const timer = setTimeout(() => setIgnoreOpenStatus(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [ignoreOpenStatus]);

  useEffect(() => {
    if (participant === undefined) return;
    if (!participant?.enrollmentNumber) {
      navigate("/", { replace: true });
      return;
    }

    const lobbyRef = doc(db, "settings", "lobby");
    const unsubscribeLobby = onSnapshot(lobbyRef, (docSnap) => {
      if (docSnap.exists()) {
        const status = docSnap.data().status || "OPEN";
        if (status === "OPEN") {
          if (!ignoreOpenStatus) navigate("/lobby", { replace: true });
        } else if (status === "STARTING") {
          navigate("/countdown", { replace: true });
        }
      }
    });
    return () => unsubscribeLobby();
  }, [participant, navigate, ignoreOpenStatus]);

  useEffect(() => {
    if (!participant?.enrollmentNumber) return;
    if (participant.teamId) {
      setTeamId(participant.teamId);
      return;
    }

    const findTeam = async () => {
      try {
        const teamsRef = collection(db, "teams");
        const q = query(teamsRef, where("members", "array-contains", participant.enrollmentNumber));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) setTeamId(snapshot.docs[0].id);
        else {
          setError("You have not been assigned to a team yet.");
          setLoading(false);
        }
      } catch (err) {
        setError("Failed to find your team mapping.");
        setLoading(false);
      }
    };
    findTeam();
  }, [participant]);

  useEffect(() => {
    if (!teamId) return;
    const teamRef = doc(db, "teams", teamId);
    const unsubscribe = onSnapshot(teamRef, async (docSnap) => {
      if (docSnap.exists()) {
        const rawData = docSnap.data();
        const membersArr = rawData.members || [];
        let enrichedMembers = [];
        if (membersArr.length > 0) {
          try {
            const pQuery = query(collection(db, "participants"), where("enrollmentNumber", "in", membersArr));
            const pSnap = await getDocs(pQuery);
            const pMap = {};
            pSnap.forEach(d => pMap[d.data().enrollmentNumber] = d.data().name);
            enrichedMembers = membersArr.map(m => ({
              enrollmentNumber: m,
              name: pMap[m] || m
            }));
          } catch (e) {
            enrichedMembers = membersArr.map(m => ({ enrollmentNumber: m, name: m }));
          }
        }
        const data = { id: docSnap.id, ...rawData, participants: enrichedMembers };
        setTeamData(data);
        animateNumbers(enrichedMembers.length, data.purse || 0);
      } else setError("Team document not found.");
      setLoading(false);
    });
    return () => unsubscribe();
  }, [teamId]);

  const animateNumbers = (targetMembers, targetPurse) => {
    let mCount = 0;
    const mInterval = setInterval(() => {
      if (mCount >= targetMembers) { setMemberCount(targetMembers); clearInterval(mInterval); }
      else { mCount++; setMemberCount(mCount); }
    }, 100);

    const duration = 2000, steps = 60, stepValue = targetPurse / steps;
    let bCurrent = 0;
    const bInterval = setInterval(() => {
      bCurrent += stepValue;
      if (bCurrent >= targetPurse) { setBudgetDisplay(targetPurse); clearInterval(bInterval); }
      else setBudgetDisplay(Math.floor(bCurrent));
    }, duration / steps);
  };

  const formatBudget = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency', currency: 'INR', maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#02040a] text-blue-500">
        <div className="text-center">
          <div className="w-16 h-16 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mx-auto mb-6"></div>
          <p className="font-black uppercase tracking-[0.3em] text-xs animate-pulse">Syncing Squad Dossier</p>
        </div>
      </div>
    );
  }

  const members = teamData?.participants || [];

  return (
    <div className="min-h-screen bg-[#02040a] text-slate-100 relative font-sans overflow-hidden flex items-center justify-center p-6">

      {/* Fixed Geometric Background (Matches Arena) */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-[#1e40af]/15 rotate-12 blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#1d4ed8]/10 -rotate-12 blur-[100px]"></div>
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`, backgroundSize: '80px 80px' }}>
        </div>
      </div>

      <div className="relative z-10 w-full max-w-lg">
        {/* Main Card */}
        <div className="bg-white/[0.02] border border-white/10 backdrop-blur-3xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-card-entry">

          {/* Header Section */}
          <div className="p-8 pb-4 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 mb-6">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></span>
              <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Authorized Access</span>
            </div>

            <h1 className="text-5xl font-black italic tracking-tighter text-white uppercase mb-2">
              {(() => {
                const n = teamData?.name || "REDACTED";
                return n.toLowerCase().startsWith("team") ? n : `Team ${n}`;
              })()}
            </h1>
            <div className="h-1 w-20 bg-blue-600 mx-auto rounded-full mb-8 shadow-[0_0_15px_#2563eb]"></div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/[0.03] border border-white/5 rounded-3xl p-5 text-left group hover:border-blue-500/30 transition-colors">
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Squad Size</p>
                <p className="text-3xl font-mono font-black text-white">{memberCount}</p>
              </div>
              <div className="bg-white/[0.03] border border-white/5 rounded-3xl p-5 text-left group hover:border-blue-500/30 transition-colors">
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Purse</p>
                <p className="text-xl font-mono font-black text-blue-400 truncate">{formatBudget(budgetDisplay)}</p>
              </div>
            </div>
          </div>

          {/* Members Section */}
          <div className="p-8 pt-4">
            <div className="flex items-center gap-4 mb-4">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Roster</h3>
              <div className="h-px flex-1 bg-white/5"></div>
            </div>

            <div className="space-y-3 max-h-[280px] overflow-y-auto custom-scrollbar pr-2">
              {members.length > 0 ? (
                members.map((m, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-4 bg-white/[0.03] border border-white/5 p-4 rounded-2xl hover:bg-white/[0.06] transition-all group animate-slide-right"
                    style={{ animationDelay: `${0.2 + index * 0.1}s` }}
                  >
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-800 flex items-center justify-center font-black text-white text-sm shadow-lg group-hover:scale-110 transition-transform">
                      {index + 1}
                    </div>
                    <div className="flex flex-col flex-1 truncate">
                      <span className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors truncate uppercase">{m?.name}</span>
                      <span className="text-[10px] text-slate-500 font-mono tracking-wider">{m?.enrollmentNumber}</span>
                    </div>
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500/40 group-hover:bg-blue-400"></div>
                  </div>
                ))
              ) : (
                <div className="text-center py-10">
                  <p className="text-slate-600 text-xs italic font-medium uppercase tracking-widest">Awaiting Roster Confirmation...</p>
                </div>
              )}
            </div>
          </div>

          {/* Footer Status */}
          <div className="bg-blue-600/5 p-6 border-t border-white/5 text-center relative overflow-hidden">
            <div className="relative z-10 flex items-center justify-center gap-3">
              <div className="flex -space-x-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="w-6 h-6 rounded-full border-2 border-[#02040a] bg-slate-800 flex items-center justify-center text-[8px] font-bold">T{i}</div>
                ))}
              </div>
              <span className="text-[10px] font-bold text-blue-400 uppercase tracking-[0.2em]">Live in Auction Lobby</span>
            </div>
            {/* Subtle Shimmer Overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500/10 to-transparent -translate-x-full animate-shimmer"></div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes card-entry {
          from { opacity: 0; transform: scale(0.95) translateY(20px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes slide-right {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
        .animate-card-entry { animation: card-entry 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-slide-right { opacity: 0; animation: slide-right 0.5s ease-out forwards; }
        .animate-shimmer { animation: shimmer 3s infinite; }
        
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(59, 130, 246, 0.2); border-radius: 10px; }
      `}</style>
    </div>
  );
}