import { useEffect, useState } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../../firebase";
import AdminTeamStatus from "../../components/AdminTeamStatus";
import { BACKEND_URL } from "../../config";

const API = `${BACKEND_URL}/api/admin`;

export default function AdminHome() {
  const [participants, setParticipants] = useState([]);

  useEffect(() => {
    const q = query(
      collection(db, "participants"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const participantsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setParticipants(participantsData);
      },
      (error) => {
        console.error("Error fetching participants:", error);
      }
    );

    return () => unsubscribe();
  }, []);

  return (
    <div className="space-y-8 md:space-y-10">
      {/* ===== PAGE HEADER ===== */}
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-semibold text-sky-200">
          Admin Dashboard
        </h1>
        <p className="text-sm text-slate-400 max-w-2xl">
          Overview of participant registration and auction preparation.
        </p>
      </div>

      {/* ===== QUICK STATS ===== */}
      <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900/80 to-slate-900/40 p-1">
        <div className="rounded-xl bg-slate-950/50 p-5 sm:p-6 backdrop-blur-md">
          <h2 className="text-xs sm:text-sm font-semibold uppercase tracking-wide text-slate-400 mb-4">
            Total Registered
          </h2>
          <div className="flex items-baseline gap-2">
            <p className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-cyan-400">
              {participants.length}
            </p>
            <span className="text-sm text-slate-500">participants</span>
          </div>
        </div>
      </div>

      {/* ===== REAL-TIME TEAM STANDINGS ===== */}
      <AdminTeamStatus />

      {/* ===== MAIN GRID ===== */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* ===== REGISTERED PARTICIPANTS ===== */}
        <section className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/70 p-4 sm:p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs sm:text-sm font-semibold uppercase tracking-wide text-slate-400">
              Recent Registrations
            </h2>
            <span className="text-xs text-slate-500 bg-slate-800 px-2 py-1 rounded-full">
              Live Updates
            </span>
          </div>

          {participants.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-500 border border-dashed border-slate-800 rounded-xl">
              <p className="text-sm">No participants registered yet.</p>
            </div>
          ) : (
            <div className="space-y-3 overflow-y-auto max-h-[300px] sm:max-h-[420px] pr-2 custom-scrollbar">
              {participants.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/40 px-4 py-3"
                >
                  <div>
                    <p className="font-medium text-slate-200">
                      {p.name}
                    </p>
                    <p className="text-xs text-slate-500 font-mono">
                      {p.enrollmentNumber}
                    </p>
                  </div>
                  <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ===== INFO ===== */}
        <aside>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 text-xs sm:text-sm text-slate-400">
            <strong className="text-slate-300">System Status:</strong> All systems
            operational.
          </div>
        </aside>
      </div>

    </div>
  );
}
