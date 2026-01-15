import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Admin Components
import AdminLogin from "./pages/admin/AdminLogin";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminHome from "./pages/admin/AdminHome";
import AddParticipant from "./pages/admin/AddParticipant";

import LobbyManagement from "./pages/admin/LobbyManagement";
import AuctionControl from "./pages/admin/AuctionControl";
import ResultsAndLogs from "./pages/admin/ResultsAndLogs";

// Participant Components
import LoginPage from "./pages/participant/loginPage";
import LobbyPage from "./pages/participant/lobbyPage";
import TeamCardPage from "./pages/participant/teamCardPage";
import AuctionCountdown from "./pages/participant/auctionCountdown";
import AuctionArena from "./pages/participant/mainAuctionPage";
import ResultPage from "./pages/participant/resultPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Participant Login (First Screen) */}
        <Route path="/" element={<LoginPage />} />

        {/* Participant Lobby */}
        <Route path="/lobby" element={<LobbyPage />} />
        <Route path="/team-card" element={<TeamCardPage />} />
        <Route path="/countdown" element={<AuctionCountdown />} />
        <Route path="/auction-arena" element={<AuctionArena />} />
        <Route path="/results" element={<ResultPage />} />

        {/* Admin Login */}
        <Route path="/admin" element={<AdminLogin />} />

        {/* Admin Protected Routes */}
        <Route element={<AdminLayout />}>
          <Route path="/admin/home" element={<AdminHome />} />
          <Route path="/admin/add-participant" element={<AddParticipant />} />
          <Route path="/admin/lobby" element={<LobbyManagement />} />
          <Route path="/admin/auction" element={<AuctionControl />} />
          <Route path="/admin/results" element={<ResultsAndLogs />} />
        </Route>

        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
