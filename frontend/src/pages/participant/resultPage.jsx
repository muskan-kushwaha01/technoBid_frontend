import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../firebase";

export default function ResultPage() {
    const navigate = useNavigate();
    const [team, setTeam] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // 1. Get Participant Info
        const stored = JSON.parse(sessionStorage.getItem("currentParticipant"));
        if (!stored) {
            navigate("/");
            return;
        }

        const fetchTeam = async () => {
            try {
                let tid = stored.teamId;

                // Fallback: If no teamId in session, try to find it by enrollment
                if (!tid) {
                    const q = query(
                        collection(db, "teams"),
                        where("members", "array-contains", stored.enrollmentNumber)
                    );
                    const snap = await getDocs(q);
                    if (!snap.empty) {
                        tid = snap.docs[0].id;
                    }
                }

                if (!tid) {
                    console.error("No Team ID found for participant");
                    setLoading(false);
                    return;
                }

                const docRef = doc(db, "teams", tid);
                const snap = await getDoc(docRef);

                if (snap.exists()) {
                    setTeam(snap.data());
                }
            } catch (err) {
                console.error("Error fetching result team:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchTeam();
    }, [navigate]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#02040a] flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!team) {
        return (
            <div className="min-h-screen bg-[#02040a] text-white flex items-center justify-center">
                <p>Team data not found.</p>
            </div>
        );
    }

    // Separate Players and Items
    const players = team.boughtPlayers?.filter(p => (Number(p.id) < 1000) && !p.role?.toLowerCase().includes('accessory')) || [];
    const items = team.boughtPlayers?.filter(p => (Number(p.id) >= 1000) || p.role?.toLowerCase().includes('accessory')) || [];

    return (
        <div className="min-h-screen bg-[#02040a] text-slate-100 font-sans p-6 md:p-12 relative overflow-hidden">

            {/* Background Decor */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#1e40af]/20 rotate-12 blur-[150px]"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-amber-600/10 -rotate-12 blur-[150px]"></div>
            </div>

            <div className="relative z-10 max-w-4xl mx-auto space-y-12 animate-fade-in-up">

                {/* HEADER MSG */}
                <div className="text-center space-y-4">
                    <div className="inline-block px-4 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-widest mb-4">
                        Auction Completed
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-600 uppercase italic">
                        Good Game, {
                            (() => {
                                const n = team.name || "Team";
                                return n.toLowerCase().startsWith("team") ? n : `Team ${n}`;
                            })()
                        }!
                    </h1>
                    <p className="text-slate-400 text-lg md:text-xl font-light tracking-wide">
                        The auction results are being processed. <br />
                        <span className="text-white font-bold">Winners will be announced soon.</span>
                    </p>
                </div>

                {/* STATS CARD */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-[#13141c] rounded-[2rem] border border-white/5 p-8 flex flex-col items-center justify-center text-center shadow-2xl relative overflow-hidden group hover:border-amber-500/30 transition-all">
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-[0.2em] mb-2 relative z-10">Remaining Purse</p>
                        <p className="text-5xl font-black text-white relative z-10">₹{team.purse}</p>
                    </div>

                    <div className="bg-[#13141c] rounded-[2rem] border border-white/5 p-8 flex flex-col items-center justify-center text-center shadow-2xl relative overflow-hidden group hover:border-amber-500/30 transition-all">
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-[0.2em] mb-2 relative z-10">Total Acquisitions</p>
                        <div className="flex gap-4 items-baseline relative z-10">
                            <p className="text-5xl font-black text-white">{team.boughtPlayers?.length || 0}</p>
                            <p className="text-sm text-slate-400">Items</p>
                        </div>
                    </div>
                </div>

                {/* SQUAD LIST */}
                <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-white uppercase tracking-wide border-l-4 border-amber-500 pl-4">Your Squad</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {players.map((p, i) => (
                            <div key={i} className="flex items-center gap-4 bg-white/[0.03] p-4 rounded-2xl border border-white/5 hover:bg-white/[0.05] transition-colors">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-indigo-800 flex items-center justify-center font-bold text-xs shadow-lg">
                                    {p.name.charAt(0)}
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-slate-200">{p.name}</h3>
                                    <p className="text-xs text-slate-500 uppercase">{p.role}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-slate-500">Bought for</p>
                                    <p className="font-bold text-emerald-400">₹{p.price}</p>
                                </div>
                            </div>
                        ))}
                        {players.length === 0 && <p className="text-slate-500 italic p-4">No players purchased.</p>}
                    </div>
                </div>

                {/* ACCESSORIES LIST */}
                <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-white uppercase tracking-wide border-l-4 border-purple-500 pl-4">Inventory</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {items.map((item, i) => (
                            <div key={i} className="bg-white/[0.03] p-4 rounded-2xl border border-white/5 flex justify-between items-center hover:bg-white/[0.05] transition-colors">
                                <div>
                                    <h3 className="font-bold text-slate-300 text-sm">{item.name}</h3>
                                    <p className="text-[10px] text-slate-500 uppercase mt-1">Item</p>
                                </div>
                                <p className="font-bold text-emerald-400 text-sm">₹{item.price}</p>
                            </div>
                        ))}
                        {items.length === 0 && <p className="text-slate-500 italic p-4 col-span-full">No accessories purchased.</p>}
                    </div>
                </div>

            </div>
        </div>
    );
}
