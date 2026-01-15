import { useState, useEffect, useRef } from "react";
import {
  collection,
  doc,
  updateDoc,
  onSnapshot,
  setDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../../firebase";
import { initLobbySocket } from "../../sockets/lobbyClient";

export default function LobbyManagement() {
  const [teams, setTeams] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [lobbyStatus, setLobbyStatus] = useState("OPEN");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const socketRef = useRef(null);


  useEffect(() => {
    // 🔌 Socket Init
    socketRef.current = initLobbySocket({
      onUpdate: (data) => {
        // Firestore listeners below handle the main state syncing
      },
      onOnlineUsersUpdate: (users) => {
        setOnlineUsers(users);
      },
      onError: (err) => console.error("Socket error:", err)
    });


    const lobbyRef = doc(db, "settings", "lobby");
    const unsubscribeLobby = onSnapshot(lobbyRef, (docSnap) => {
      if (docSnap.exists()) {
        setLobbyStatus(docSnap.data().status || "OPEN");
      }
    });

    const teamsRef = collection(db, "teams");
    const unsubscribeTeams = onSnapshot(teamsRef, (snapshot) => {
      const teamsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setTeams(teamsData);
    });

    const participantsRef = collection(db, "participants");
    const unsubscribeParticipants = onSnapshot(participantsRef, (snapshot) => {
      const participantsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setParticipants(participantsData);
      setLoading(false);
    });

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
      unsubscribeLobby();
      unsubscribeTeams();
      unsubscribeParticipants();
    };
  }, []);

  // 🔧 Helper to get member list (handling both 'members' and 'participants' fields)
  const getTeamMemberIds = (team) => {
    if (Array.isArray(team.members)) return team.members;
    if (Array.isArray(team.participants)) return team.participants.map(p => p.enrollmentNumber || p);
    return [];
  };

  // 🔹 Online Users Logic
  const [onlineUsers, setOnlineUsers] = useState([]);


  const unassigned = participants.filter(
    (p) =>
      onlineUsers.includes(p.enrollmentNumber) &&
      !teams.some((t) =>
        getTeamMemberIds(t).includes(p.enrollmentNumber)
      )
  );

  // 🔒 Lock/Unlock Logic
  const handleLockLobby = async () => {
    try {
      if (unassigned.length > 0) {
        setError(
          `Cannot lock lobby: ${unassigned.length} participants are not assigned to any team.`
        );
        return;
      }

      const emptyTeam = teams.some(
        (team) => getTeamMemberIds(team).length === 0
      );
      if (emptyTeam) {
        setError("Cannot lock lobby: One or more teams have no members.");
        return;
      }

      // 1. Signal Backend (Memory State)
      if (socketRef.current) socketRef.current.adminLockTeams();

      // 2. Update Firestore (Source of Truth)
      // Note: admin.sockets.js also does this, but doing it here ensures local reactivity
      // regardless of socket latency.
      const lobbyRef = doc(db, "settings", "lobby");
      await setDoc(lobbyRef, { status: "LOCKED" }, { merge: true });

      setLobbyStatus("LOCKED");
      setError("");
    } catch (error) {
      console.error("Error updating lobby status:", error);
      setError(error.message);
    }
  };

  const handleReopenLobby = async () => {
    try {
      // 1. Signal Backend (Memory State)
      if (socketRef.current) socketRef.current.adminReopenTeams();

      // 2. Update Firestore
      const lobbyRef = doc(db, "settings", "lobby");
      await updateDoc(lobbyRef, { status: "OPEN" });

      setLobbyStatus("OPEN");
      setError("");
    } catch (error) {
      console.error("Error updating lobby status:", error);
    }
  };

  // ❌ Delete Team Logic
  const handleDeleteTeam = async (teamId) => {
    if (!window.confirm("Are you sure you want to delete this team? Members will become unassigned.")) return;

    if (socketRef.current && typeof socketRef.current.adminDeleteTeam === "function") {
      socketRef.current.adminDeleteTeam(teamId);
      setError("");
    } else {
      console.error("Socket function missing. Ref:", socketRef.current);
      setError("Connection error. Please refresh the page.");
    }
  };

  // ➖ Remove Member Logic
  const handleRemoveMember = (teamId, enrollmentNumber) => {
    if (!window.confirm(`Remove ${enrollmentNumber} from this team?`)) return;
    if (socketRef.current) {
      socketRef.current.adminRemoveMember({
        teamId,
        enrollmentNumber,
      });
      setError("");
    } else {
      setError("Socket not connected.");
    }
  };

  // ✏️ Edit Team Logic
  const [editingTeam, setEditingTeam] = useState(null);
  const [editName, setEditName] = useState("");
  const [editSize, setEditSize] = useState("");
  const [showEditModal, setShowEditModal] = useState(false);

  const handleEditClick = (team) => {
    setEditingTeam(team);
    setEditName(team.name);
    setEditSize(team.maxSize || team.members?.length || 5);
    setShowEditModal(true);
  };

  const handleSaveTeam = () => {
    if (!editName.trim()) {
      alert("Please enter a team name");
      return;
    }
    if (!editSize || editSize <= 0 || editSize > 5) {
      alert("Team size must be between 1 and 5");
      return;
    }

    if (socketRef.current) {
      socketRef.current.adminUpdateTeam({
        teamId: editingTeam.id,
        name: editName.trim(),
        maxSize: parseInt(editSize),
      });
      setShowEditModal(false);
      setEditingTeam(null);
    }
  };

  // ... (getParticipantName helper) ... 

  // ...

  <div className="mb-6">
    <label className="block text-slate-400 text-sm mb-1">Max Team Size</label>
    <input
      type="number"
      min="1"
      max="5"
      value={editSize}
      onChange={(e) => setEditSize(e.target.value)}
      className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white focus:border-blue-500 outline-none"
    />
  </div>

  // 🏷️ Get Name Helper
  const getParticipantName = (enrollmentNumber) => {
    const p = participants.find(p => p.enrollmentNumber === enrollmentNumber);
    return p ? p.name : enrollmentNumber;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        Loading lobby...
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-10 py-6 text-slate-100">
      <div className="mx-auto max-w-6xl rounded-2xl bg-slate-900/80 border border-slate-800 p-5 sm:p-8">

        {error && (
          <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-sky-100">
              Team Lobby
            </h1>
            <div className="flex items-center mt-1">
              <div
                className={`w-3 h-3 rounded-full mr-2 ${lobbyStatus === "OPEN" ? "bg-green-500" : "bg-red-500"
                  }`}
              ></div>
              <span className="text-sm text-gray-400">
                {lobbyStatus === "OPEN" ? "Lobby is open" : "Lobby is locked"}
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={lobbyStatus === "OPEN" ? handleLockLobby : handleReopenLobby}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${lobbyStatus === "OPEN"
                ? "bg-red-600 hover:bg-red-700"
                : "bg-green-600 hover:bg-green-700"
                }`}
            >
              {lobbyStatus === "OPEN" ? "Lock Lobby" : "Reopen Lobby"}
            </button>
          </div>
        </div>

        {/* CONTENT */}
        <div className="grid grid-cols-1 lg:grid-cols-[2fr,1fr] gap-6">

          {/* TEAMS */}
          <div className="space-y-4 max-h-[1000px] overflow-y-auto pr-2">
            {teams.length === 0 && <p className="text-slate-500 italic">No teams created yet.</p>}
            {teams.map((team) => {
              const memberIds = getTeamMemberIds(team);
              // Disable actions if locked (technically admin can still remove member based on prev code, but prompt says "cant do any changes", so might want to lock delete too. 
              // But for this specific task, I'll focus on the Rename limitation)
              const isLocked = lobbyStatus !== "OPEN";

              return (
                <div
                  key={team.id}
                  className="rounded-xl bg-slate-950/40 border border-slate-800 p-4 hover:border-slate-700 transition-colors"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-lg text-slate-200">
                        {team.name}
                        <span className="text-xs text-slate-500 ml-2">({memberIds.length}/{team.maxSize || "?"})</span>
                      </h3>
                    </div>

                    <div className="flex bg-slate-800/50 rounded-lg p-1">
                      {/* EDIT BUTTON */}
                      <button
                        onClick={() => handleEditClick(team)}
                        disabled={isLocked}
                        className={`p-1.5 rounded mr-1 ${isLocked ? "text-slate-600 cursor-not-allowed" : "text-blue-400 hover:bg-blue-500/10 hover:text-blue-300 transition"}`}
                        title={isLocked ? "Lobby Locked" : "Edit Team"}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>

                      <button
                        onClick={() => !isLocked && handleDeleteTeam(team.id)}
                        disabled={isLocked}
                        className={`p-1.5 rounded ${isLocked ? "text-slate-600 cursor-not-allowed" : "text-red-500 hover:bg-red-500/10 hover:text-red-400 transition"}`}
                        title={isLocked ? "Lobby Locked" : "Delete Team"}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {memberIds.map((enrollment, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 rounded-lg bg-slate-800/50 border border-slate-700 px-3 py-1.5"
                      >
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-slate-200">
                            {getParticipantName(enrollment)}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {enrollment}
                          </span>
                        </div>
                        <button
                          onClick={() => !isLocked && handleRemoveMember(team.id, enrollment)}
                          disabled={isLocked}
                          className={`ml-1 p-0.5 rounded-full transition ${isLocked ? "text-slate-600 cursor-not-allowed" : "text-slate-500 hover:text-red-400 hover:bg-slate-700"}`}
                          title="Remove Member"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L10 8.586 5.707 4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* UNASSIGNED */}
          <div className="space-y-2 max-h-[1000px] overflow-y-auto">
            <h2 className="text-xs font-semibold uppercase text-slate-400 mb-2 sticky top-0 bg-slate-900/90 py-2">
              Unassigned ({unassigned.length})
            </h2>

            {unassigned.map((p) => (
              <div
                key={p.id}
                className="rounded-lg bg-slate-950/40 border border-slate-800 px-3 py-2 flex justify-between items-center"
              >
                <div>
                  <p className="font-medium text-slate-300">{p.name}</p>
                  <p className="text-xs text-slate-400 font-mono">
                    {p.enrollmentNumber}
                  </p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>

      {/* EDIT MODAL */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-sm shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-4">Edit Team</h2>

            <div className="mb-4">
              <label className="block text-slate-400 text-sm mb-1">Team Name</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white focus:border-blue-500 outline-none"
              />
            </div>

            <div className="mb-6">
              <label className="block text-slate-400 text-sm mb-1">Max Team Size</label>
              <input
                type="number"
                min="1"
                max="10"
                value={editSize}
                onChange={(e) => setEditSize(e.target.value)}
                className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white focus:border-blue-500 outline-none"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleSaveTeam}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded transition"
              >
                Save Changes
              </button>
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-semibold py-2 rounded transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}