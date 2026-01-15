import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function AdminLogin() {
  const [name, setName] = useState("");
  const [id, setId] = useState("");
  const [showId, setShowId] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (sessionStorage.getItem("adminLoggedIn")) {
      navigate("/admin/home", { replace: true });
    }
  }, [navigate]);

  const handleLogin = () => {
    if (name === "admin" && id === "123") {
      // Set a flag in session storage to indicate admin is logged in
      sessionStorage.setItem("adminLoggedIn", "true");
      navigate("/admin/home");
    } else {
      alert("Invalid Admin Credentials");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 px-4">
      
      {/* CARD */}
      <div className="w-full max-w-sm sm:max-w-md rounded-2xl border border-slate-700 bg-slate-900/80 p-6 sm:p-8 shadow-2xl">

        {/* HEADER */}
        <h1 className="mb-2 text-center text-2xl sm:text-3xl font-semibold tracking-tight text-violet-300">
          IPL Admin
        </h1>
        <p className="mb-6 text-center text-sm sm:text-base text-slate-400">
          Secure access for authorized administrators.
        </p>

        <div className="space-y-5">
          
          {/* ADMIN NAME */}
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-400">
              Admin Name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter admin name"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm sm:text-base text-slate-100 placeholder-slate-500 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/40"
            />
          </div>

          {/* ADMIN ID */}
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-400">
              Admin ID
            </label>

            <div className="relative">
              <input
                type={showId ? "text" : "password"}
                value={id}
                onChange={(e) => setId(e.target.value)}
                placeholder="Enter admin ID"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 pr-11 text-sm sm:text-base text-slate-100 placeholder-slate-500 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/40"
              />

              {/* EYE ICON */}
              <button
                type="button"
                onClick={() => setShowId(!showId)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-violet-400 transition"
                aria-label="Toggle password visibility"
              >
                {showId ? (
                  // Eye Off
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.8}
                      d="M3 3l18 18M10.58 10.58A2 2 0 0012 14a2 2 0 001.42-.58M9.88 9.88A4 4 0 0112 8c3.31 0 6.24 2.24 7.66 4a9.97 9.97 0 01-2.42 2.42M6.34 6.34C4.91 7.48 3.75 8.99 3 10c1.42 2.24 4.35 4 9 4"
                    />
                  </svg>
                ) : (
                  // Eye
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.8}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.8}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* CTA */}
          <button
            onClick={handleLogin}
            className="mt-8 w-full rounded-lg bg-violet-600 px-5 py-3 text-sm sm:text-base font-semibold text-white shadow-lg shadow-violet-500/30 transition hover:bg-violet-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
          >
            Sign in to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
