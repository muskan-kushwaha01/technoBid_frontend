import { useEffect, useState } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "../firebase";

export default function AdminTeamStatus() {
    const [teams, setTeams] = useState([]);

    useEffect(() => {
        // Listen to teams collection in real-time
        const q = query(collection(db, "teams"), orderBy("name"));
        console.log("AdminTeamStatus: Subscribing to teams...");
        const unsub = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            console.log("AdminTeamStatus: Fetched teams", data.length);
            setTeams(data);
        }, (error) => {
            console.error("AdminTeamStatus Error:", error);
        });
        return () => unsub();
    }, []);

    return (
        <div className="mt-12 p-4 sm:p-8 bg-[#0b0c10] rounded-[32px] border border-white/5 shadow-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between items-start gap-4 mb-8">
                <h2 className="text-3xl font-black text-white tracking-wide uppercase italic">
                    Live <span className="text-amber-500">Standings</span>
                </h2>
                <div className="bg-white/5 px-4 py-2 rounded-lg border border-white/10">
                    <span className="text-sm font-bold text-slate-400 uppercase tracking-widest mr-2">Total Teams</span>
                    <span className="text-xl font-black text-white">{teams.length}</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {teams.map((team) => {
                    // Calculate stats
                    const totalSpent = team.boughtPlayers?.reduce((acc, p) => acc + (Number(p.price) || 0), 0) || 0;

                    // Identify items by ID range (>= 1000) or explicit role
                    const itemsCount = team.boughtPlayers?.filter(p => (Number(p.id) >= 1000) || p.role?.toLowerCase().includes('accessory'))?.length || 0;
                    const playersCount = (team.boughtPlayers?.length || 0) - itemsCount;

                    return (
                        <div key={team.id} className="group relative bg-[#13141c] rounded-2xl overflow-hidden border border-white/5 hover:border-amber-500/30 transition-all duration-300 hover:shadow-2xl hover:shadow-amber-900/10">

                            {/* Header */}
                            <div className="p-5 bg-gradient-to-b from-white/5 to-transparent border-b border-white/5">
                                <h3 className="text-lg font-bold text-white truncate mb-1">{team.name}</h3>
                                <div className="flex justify-between items-end">
                                    <div>
                                        <p className="text-[10px] uppercase text-slate-500 font-bold tracking-widest">Purse</p>
                                        <p className="text-xl font-black text-emerald-400">₹{team.purse}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] uppercase text-slate-500 font-bold tracking-widest">Spent</p>
                                        <p className="text-sm font-bold text-slate-300">₹{totalSpent}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Squad List */}
                            <div className="p-4 max-h-[300px] overflow-y-auto custom-scrollbar">
                                <p className="text-[10px] uppercase text-slate-500 font-bold tracking-widest mb-3 sticky top-0 bg-[#13141c] py-1 z-10">
                                    Acquisitions ({team.boughtPlayers?.length || 0})
                                </p>

                                {team.boughtPlayers && team.boughtPlayers.length > 0 ? (
                                    <ul className="space-y-2">
                                        {team.boughtPlayers.map((item, i) => (
                                            <li key={i} className="flex justify-between items-start text-sm group/item">
                                                <div className="flex-1 min-w-0 pr-2">
                                                    <p className="text-slate-200 font-medium truncate group-hover/item:text-amber-400 transition-colors">
                                                        {item.name}
                                                    </p>
                                                    <p className="text-[10px] text-slate-500 uppercase truncate">
                                                        {item.role || "Accessory"}
                                                    </p>
                                                </div>
                                                <span className="font-mono text-emerald-500/80 text-xs whitespace-nowrap">
                                                    ₹{item.price}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <div className="h-20 flex items-center justify-center border border-dashed border-white/10 rounded-lg">
                                        <p className="text-xs text-slate-600 font-medium uppercase tracking-widest">Empty Squad</p>
                                    </div>
                                )}
                            </div>

                            {/* Mini Footer */}
                            <div className="bg-black/20 p-2 text-center border-t border-white/5">
                                <p className="text-[10px] text-slate-500">
                                    {playersCount} Players • {itemsCount} Items
                                </p>
                            </div>

                        </div>
                    );
                })}
            </div>
        </div>
    );
}
