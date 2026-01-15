import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import LobbyTeamCard from "../../components/LobbyTeamCard";
import { initLobbySocket } from "../../sockets/lobbyClient";
import { collection, query, where, getDocs, doc, onSnapshot } from "firebase/firestore";
import { db } from "../../firebase";

export default function Lobby() {
  const navigate = useNavigate();
  const socketRef = useRef(null);
  const socketInitialized = useRef(false);

  const [teams, setTeams] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [teamSize, setTeamSize] = useState(1);
  const [checkingSession, setCheckingSession] = useState(true);
  const [participant, setParticipant] = useState(null);

  /* ---------------- LOGIC (UNTOUCHED) ---------------- */
  useEffect(() => {
    const stored = sessionStorage.getItem("currentParticipant");
    if (stored) setParticipant(JSON.parse(stored));
    setCheckingSession(false);
  }, []);

  const enrichTeamsWithNames = async (incomingTeams) => {
    if (!Array.isArray(incomingTeams) || incomingTeams.length === 0) return incomingTeams;
    const enrollments = Array.from(new Set(incomingTeams.flatMap((t) => Array.isArray(t.members) ? t.members : [])));
    if (enrollments.length === 0) return incomingTeams;
    const chunkSize = 10;
    const participantsMap = {};
    for (let i = 0; i < enrollments.length; i += chunkSize) {
      const chunk = enrollments.slice(i, i + chunkSize);
      const q = query(collection(db, "participants"), where("enrollmentNumber", "in", chunk));
      const snap = await getDocs(q);
      snap.forEach((doc) => {
        const data = doc.data();
        participantsMap[data.enrollmentNumber] = data.name || data.enrollmentNumber;
      });
    }
    return incomingTeams.map((t) => ({
      ...t,
      members: (t.members || []).map((en) => participantsMap[en] || en),
    }));
  };

  useEffect(() => {
    if (checkingSession || !participant) return;
    if (socketInitialized.current) return;
    socketInitialized.current = true;
    socketRef.current = initLobbySocket({
      enrollmentNumber: participant.enrollmentNumber,
      onUpdate: async (data) => {
        if (data?.locked === true) {
          socketRef.current?.disconnect();
          navigate("/team-card", { replace: true, state: { lockedByAdmin: true } });
          return;
        }
        try {
          if (data && data.teams) {
            const enriched = await enrichTeamsWithNames(data.teams);
            setTeams(enriched);
          } else { socketRef.current.requestTeams(); }
        } catch (err) { console.error("Lobby update error:", err); }
      },
      onError: (err) => { alert(err.message || "Lobby error"); },
    });
    socketRef.current.requestTeams();
    return () => {
      socketRef.current?.disconnect();
      socketInitialized.current = false;
    };
  }, [checkingSession, participant, navigate]);

  const handleJoinTeam = (team) => {
    if (!participant) return;
    socketRef.current.joinTeam({ teamId: team.id, enrollment: participant.enrollmentNumber });
  };

  const handleCreateTeam = () => {
    if (!participant) return;
    if (!teamName.trim()) { alert("Please enter a team name"); return; }
    if (!teamSize || teamSize <= 0 || teamSize > 5) { alert("Team size must be between 1 and 5"); return; }
    socketRef.current.createTeam({ name: teamName.trim(), maxSize: teamSize, creatorEnrollment: participant.enrollmentNumber });
    setShowCreate(false); setTeamName(""); setTeamSize(1);
  };

  if (checkingSession) return <div className="min-h-screen bg-[#02040a] flex items-center justify-center text-blue-500 font-mono tracking-widest italic animate-pulse">SYNCING_LOBBY...</div>;

  return (
    <div className="min-h-screen bg-[#010206] text-white relative font-sans overflow-x-hidden p-6 md:p-10">

      {/* Atmospheric Background (Grid Removed) */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        {/* Soft Ambient Glows */}
        <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-blue-900/10 rounded-full blur-[160px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-indigo-900/10 rounded-full blur-[140px]"></div>

        {/* Subtle Static Grain Overlay for Texture */}
        <div className="absolute inset-0 opacity-[0.15] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] pointer-events-none"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">

        {/* Header Control Bar */}
        <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-16 border-b border-white/[0.08] pb-10">
          <div className="animate-slide-up">
            <div className="flex items-center gap-3 mb-3">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-600 shadow-[0_0_12px_#2563eb]"></span>
              </span>
              <span className="text-[11px] font-black text-blue-500/80 uppercase tracking-[0.4em]">Active Bidding Sector</span>
            </div>
            <h1 className="text-5xl font-black tracking-tighter uppercase italic tracking-[-0.04em]">
              Formation <span className="text-blue-600 italic font-medium">Zone</span>
            </h1>
          </div>

          <button
            onClick={() => setShowCreate(true)}
            className="group relative px-10 py-5 bg-white text-[#010206] font-black uppercase italic tracking-tighter rounded-2xl hover:bg-blue-600 hover:text-white transition-all duration-500 shadow-2xl active:scale-95 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:animate-shimmer"></div>
            <span className="relative z-10 text-lg">+ Create Team</span>
          </button>
        </div>

        {/* Teams Display Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {teams.length > 0 ? (
            teams.map((team, index) => (
              <div key={team.id} className="animate-card-fade" style={{ animationDelay: `${index * 0.08}s` }}>
                <LobbyTeamCard
                  team={team}
                  onJoin={() => handleJoinTeam(team)}
                />
              </div>
            ))
          ) : (
            <div className="col-span-full py-48 rounded-[3rem] bg-white/[0.01] border border-white/[0.05] flex flex-col items-center justify-center">
              <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mb-6">
                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-ping"></div>
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.5em] text-white/30">Scanning for signal...</p>
            </div>
          )}
        </section>
      </div>

      {/* Creation Modal Overlay */}
      {showCreate && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-[#0a0c14] border border-white/10 p-12 rounded-[2.5rem] w-full max-w-md shadow-2xl animate-modal-pop relative">
            <h2 className="text-3xl font-black italic uppercase tracking-tighter text-white mb-10 text-center">Create Team</h2>

            <div className="space-y-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-blue-500/70 uppercase tracking-widest ml-2 block">Team Name</label>
                <input
                  type="text"
                  placeholder="e.g. ALPHA_TEAM"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:border-blue-600 outline-none transition-all font-bold placeholder:text-white/10"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-blue-500/70 uppercase tracking-widest ml-2 block">Team Capacity</label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={teamSize}
                  onChange={(e) => setTeamSize(parseInt(e.target.value) || "")}
                  className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:border-blue-600 outline-none transition-all font-bold"
                />
              </div>

              <div className="flex flex-col gap-3 pt-4">
                <button onClick={handleCreateTeam} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-5 rounded-2xl uppercase tracking-[0.2em] italic transition-all shadow-lg shadow-blue-900/30">Create</button>
                <button onClick={() => setShowCreate(false)} className="w-full bg-white/5 hover:bg-white/10 text-white/40 font-bold py-4 rounded-2xl uppercase tracking-widest text-xs transition-all">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slide-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes card-fade { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        @keyframes modal-pop { from { opacity: 0; transform: scale(0.98) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes shimmer { 100% { transform: translateX(100%); } }
        
        .animate-slide-up { animation: slide-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-card-fade { animation: card-fade 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; }
        .animate-modal-pop { animation: modal-pop 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-fade-in { animation: fade-in 0.3s ease-out; }
        .animate-shimmer { animation: shimmer 2s infinite; }
      `}</style>
    </div>
  );
}