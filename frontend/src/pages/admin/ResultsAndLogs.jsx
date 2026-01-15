import React, { useEffect, useState } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "../../firebase";

export default function ResultsAndLogs() {
  const [teams, setTeams] = useState([]);
  const [playersMap, setPlayersMap] = useState({});

  useEffect(() => {
    // 1. Listen to Players Collection (Source of Truth for Scores)
    const unsubPlayers = onSnapshot(collection(db, "players"), (snap) => {
      const map = {};
      snap.docs.forEach(doc => {
        map[doc.id] = doc.data(); // Key is String(ID)
      });
      setPlayersMap(map);
    });

    // 2. Listen to Teams
    const q = query(collection(db, "teams"), orderBy("name"));
    const unsubTeams = onSnapshot(q, (snapshot) => {
      // We will process this data combined with playersMap in render or separate effect
      // But setState inside onSnapshot needs latest playersMap which is hard with closures.
      // Better to just store raw teams and process in render.
      const rawTeams = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTeams(rawTeams);
    });

    return () => {
      unsubPlayers();
      unsubTeams();
    };
  }, []);

  // Compute final data with scores from Players DB
  const computedTeams = teams.map(team => {
    const boughtPlayers = team.boughtPlayers || [];
    const totalScore = boughtPlayers.reduce((sum, p) => {
      // Lookup in playersMap using ID
      const pDetails = playersMap[String(p.id)];
      const score = pDetails ? (Number(pDetails.importanceScore) || 0) : 0;
      return sum + score;
    }, 0);

    // Enrich bought players with real score
    const enrichedPlayers = boughtPlayers.map(p => {
      const pDetails = playersMap[String(p.id)];
      return {
        ...p,
        importanceScore: pDetails ? (Number(pDetails.importanceScore) || 0) : 0
      };
    });

    return { ...team, totalScore, boughtPlayers: enrichedPlayers };
  }).sort((a, b) => b.totalScore - a.totalScore);

  return (
    <div className="min-h-screen bg-[#0f111a] text-slate-100 p-6 md:p-10 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-white/5 pb-6">
          <div>
            <h1 className="text-4xl font-black text-white italic tracking-tighter uppercase mb-2">
              Final <span className="text-violet-500">Standings</span>
            </h1>
            <p className="text-slate-400 max-w-xl text-sm font-medium">
              Confidential Admin View • Total Score based on player Importance Ratings
            </p>
          </div>
        </div>

        {/* RESULTS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {computedTeams.map((team) => (
            <div
              key={team.id}
              className="bg-[#161822] rounded-3xl border border-white/5 overflow-hidden shadow-xl hover:shadow-2xl hover:border-violet-500/20 transition-all duration-300 group"
            >
              {/* Card Header */}
              <div className="bg-white/[0.03] p-6 flex justify-between items-start">
                <div className="flex-1 min-w-0 pr-4">
                  <h2 className="text-2xl font-black text-white uppercase italic truncate">
                    {team.name}
                  </h2>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">
                    Purse: <span className="text-emerald-400">₹{team.purse}</span>
                  </p>
                </div>
                <div className="text-right">
                  <div className="inline-flex flex-col items-center justify-center bg-violet-500/10 border border-violet-500/20 px-4 py-2 rounded-xl">
                    <span className="text-[10px] font-black text-violet-400 uppercase tracking-widest">Score</span>
                    <span className="text-2xl font-black text-white">{team.totalScore}</span>
                  </div>
                </div>
              </div>

              {/* Roster Summary */}
              <div className="p-6 space-y-4">
                <div>
                  <p className="text-[10px] uppercase text-slate-500 font-bold tracking-widest mb-3">Top Acquisitions</p>
                  <div className="space-y-2 max-h-[150px] overflow-y-auto custom-scrollbar pr-2">
                    {team.boughtPlayers && team.boughtPlayers.length > 0 ? (
                      team.boughtPlayers
                        .sort((a, b) => (Number(b.importanceScore) || 0) - (Number(a.importanceScore) || 0))
                        .map((p, idx) => (
                          <div key={idx} className="flex justify-between items-center text-sm group/item">
                            <div className="flex items-center gap-2 truncate flex-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-700 group-hover/item:bg-violet-500 transition-colors"></span>
                              <span className="text-slate-300 truncate">{p.name}</span>
                            </div>
                            <span className="text-xs font-mono text-slate-500 ml-2">
                              {Number(p.importanceScore) || 0} pts
                            </span>
                          </div>
                        ))
                    ) : (
                      <p className="text-xs text-slate-600 italic">No players purchased</p>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-white/5 flex justify-between items-center text-xs">
                  <span className="text-slate-500">Total Items: {team.boughtPlayers?.length || 0}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {computedTeams.length === 0 && (
          <div className="text-center py-20 text-slate-500">
            <p>No teams found.</p>
          </div>
        )}

      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(139, 92, 246, 0.2); border-radius: 10px; }
      `}</style>
    </div>
  );
}
