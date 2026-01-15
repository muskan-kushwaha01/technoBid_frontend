import { io } from "socket.io-client";
import { BACKEND_URL } from "../config";

export function initLobbySocket(opts = {}) {
  const { onUpdate, onError, enrollmentNumber, onOnlineUsersUpdate } = opts;
  const socket = io(BACKEND_URL, {
    transports: ["websocket"],
  });

  socket.on("onlineParticipantsUpdate", (users) => {
    onOnlineUsersUpdate?.(users);
  });

  socket.on("connect", () => {
    if (enrollmentNumber) {
      socket.emit("REGISTER_USER", { enrollment: enrollmentNumber });
    }
  });

  socket.on("teamsUpdated", (payload) => {
    onUpdate?.(payload);
  });

  socket.on("socketError", (msg) => {
    console.error("Socket error:", msg);
    onError?.({ message: msg });
  });

  socket.on("errorMessage", (msg) => {
    console.error("Server error:", msg);
    onError?.(msg);
  });

  return {
    requestTeams: () => socket.emit("requestTeams"),

    createTeam: (data) => {
      socket.emit("createTeam", data);
    },

    joinTeam: (data) => {
      socket.emit("joinTeam", data);
    },

    // ✅ FIX: ADD THESE
    adminLockTeams: () => {
      socket.emit("adminLockTeams");
    },

    adminReopenTeams: () => {
      socket.emit("adminReopenTeams");
    },

    adminRemoveMember: (data) => {
      socket.emit("adminRemoveMember", data);
    },

    adminUpdateTeam: (data) => {
      socket.emit("adminUpdateTeam", data);
    },

    adminDeleteTeam: (teamId) => {
      socket.emit("adminDeleteTeam", teamId);
    },

    disconnect: () => socket.disconnect(),
  };
}
