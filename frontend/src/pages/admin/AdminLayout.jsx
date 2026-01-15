// c:\Users\MUSKAN KUSHWAHA\Desktop\Techno_bid\frontend\src\pages\admin\AdminLayout.jsx

import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const isAdminLoggedIn = sessionStorage.getItem('adminLoggedIn');
    // If not logged in, redirect to the admin login page
    if (!isAdminLoggedIn) {
      navigate('/admin', { replace: true });
    }
  }, [navigate, location.pathname]);

  const handleLogout = () => {
    sessionStorage.removeItem("adminLoggedIn");
    navigate("/admin", { replace: true });
  };

  const isActive = (path) => location.pathname === path;

  const NavButton = ({ path, icon, label }) => (
    <button
      onClick={() => {
        navigate(path);
        setOpen(false);
      }}
      className={`group flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${isActive(path)
          ? "bg-violet-600 text-white shadow-lg shadow-violet-500/20"
          : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-100"
        }`}
    >
      <span className={`text-lg transition-transform duration-200 ${isActive(path) ? "scale-110" : "group-hover:scale-110"}`}>{icon}</span>
      <span>{label}</span>
      {isActive(path) && (
        <div className="ml-auto h-1.5 w-1.5 rounded-full bg-white/50 shadow-[0_0_8px_rgba(255,255,255,0.5)]" />
      )}
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-violet-500/30">

      {/* ========== MOBILE TOP BAR (VISIBLE ONLY < md) ========== */}
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between bg-slate-950/80 px-4 py-3 backdrop-blur-md border-b border-slate-800/50 md:hidden">
        <h1 className="text-lg font-bold tracking-tight">
          IPL <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-cyan-400">Admin</span>
        </h1>

        {/* HAMBURGER */}
        <button
          onClick={() => setOpen(true)}
          className="p-2 text-slate-300 hover:text-white focus:outline-none active:scale-95 transition-transform"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
        </button>
      </div>

      {/* ========== OVERLAY (MOBILE ONLY) ========== */}
      <div
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 md:hidden ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          }`}
        onClick={() => setOpen(false)}
      />

      {/* ========== SIDEBAR ========== */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-72 bg-slate-900/50 border-r border-slate-800/50 backdrop-blur-xl px-6 py-8
        transform transition-transform duration-300 ease-in-out shadow-2xl shadow-black/50
        ${open ? "translate-x-0" : "-translate-x-full"}
        md:translate-x-0 md:shadow-none`}
      >
        {/* LOGO */}
        <div className="mb-10 flex items-center gap-3 px-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-violet-500/20">
            <span className="text-white font-bold text-lg">A</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-100">
            IPL <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-cyan-400">Admin</span>
          </h1>
        </div>

        {/* GENERAL */}
        <div className="mb-8">
          <p className="mb-3 px-4 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            General
          </p>
          <nav className="space-y-1">
            <NavButton path="/admin/home" icon="📊" label="Dashboard" />
            <NavButton path="/admin/add-participant" icon="👤" label="Participants" />

            <NavButton path="/admin/lobby" icon="👥" label="Lobby" />
          </nav>
        </div>

        {/* REPORTS */}
        <div>
          <p className="mb-3 px-4 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Reports
          </p>
          <nav className="space-y-1">
            <NavButton path="/admin/auction" icon="💰" label="Auction" />
            <NavButton path="/admin/results" icon="📑" label="Results" />
          </nav>
        </div>

        {/* LOGOUT */}
        <div className="absolute bottom-8 left-6 right-6 pt-6 border-t border-slate-800/50">
          <button
            onClick={handleLogout}
            className="group flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all duration-200"
          >
            <span className="text-lg group-hover:-translate-x-1 transition-transform">🚪</span>
            <span>Logout</span>
          </button>
          <div className="mt-4 text-center text-[10px] text-slate-600 font-medium">
            v1.0.0 • Admin Panel
          </div>
        </div>
      </aside>

      {/* ========== MAIN CONTENT ========== */}
      <main className="min-h-screen transition-all duration-300 pt-20 px-4 md:ml-72 md:pt-10 md:px-10 pb-10">
        <Outlet />
      </main>
    </div>
  );
}
