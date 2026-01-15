import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';

export default function LoginPage() {
  const [enrollmentNumber, setEnrollmentNumber] = useState('');
  const particles = useMemo(
    () =>
      Array.from({ length: 20 }, () => ({
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        delay: `${Math.random() * 3}s`,
      })),
    []
  );

  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuccessLoader, setShowSuccessLoader] = useState(false);

const handleSubmit = async (e) => {
  e.preventDefault();
  if (loading || showSuccessLoader) return;

  setError('');
  setLoading(true);

  const enroll = enrollmentNumber.trim();
  if (!enroll) {
    setError('Please enter your enrollment number.');
    setLoading(false);
    return;
  }

  try {
    const q = query(
      collection(db, 'participants'),
      where('enrollmentNumber', '==', enroll)
    );
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const matched = {
        id: querySnapshot.docs[0].id,
        ...querySnapshot.docs[0].data(),
      };

      // 🔐 Save login session
      sessionStorage.setItem('currentParticipant', JSON.stringify(matched));

      setShowSuccessLoader(true);
      setLoading(false);
console.log("Saving participant:", matched);
sessionStorage.setItem('currentParticipant', JSON.stringify(matched));
console.log("Saved in session:", sessionStorage.getItem("currentParticipant"));

      // 🚀 Go to lobby immediately
     window.location.href = "/lobby";

    } else {
      setError('Enrollment No. not found. Please register first.');
      setLoading(false);
    }
  } catch (err) {
    console.error('Login error:', err);
    setError('Failed to verify enrollment. Please try again.');
    setLoading(false);
  }
};


  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-slate-950 to-sky-950 flex items-center justify-center px-4 py-6 sm:py-8 relative overflow-hidden">

      {/* Animated Gradient Overlays */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(56,189,248,0.16),transparent_60%)] animate-[subtlePulse_6s_ease-in-out_infinite]"></div>

      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-20"></div>
      
      {/* Floating Animated Orbs */}
      <div className="hidden sm:block absolute top-1/4 left-1/4 w-64 h-64 bg-blue-600/22 rounded-full blur-3xl animate-[float_7s_ease-in-out_infinite]"></div>
      <div className="hidden sm:block absolute bottom-1/4 right-1/4 w-80 h-80 bg-cyan-600/20 rounded-full blur-3xl animate-[float_9s_ease-in-out_infinite_reverse]"></div>
      <div className="hidden sm:block absolute top-1/2 right-1/3 w-56 h-56 bg-sky-500/18 rounded-full blur-3xl animate-[float_11s_ease-in-out_infinite]"></div>

      {/* Animated Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map((particle, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-cyan-300/32 rounded-full animate-[sparkle_3.4s_ease-in-out_infinite]"
            style={{
              left: particle.left,
              top: particle.top,
              animationDelay: particle.delay,
            }}
          ></div>
        ))}
      </div>

      {showSuccessLoader ? (
        <div className="relative z-20 flex flex-col items-center justify-center text-center animate-[fadeIn_0.5s_ease-out]">
          <div className="w-24 h-24 border-4 border-emerald-400 rounded-full flex items-center justify-center animate-[pulse_1.5s_ease-in-out_infinite]">
            <svg className="w-12 h-12 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <h2 className="mt-6 text-2xl font-semibold text-emerald-300">
            Verification Successful
          </h2>
          <p className="mt-2 text-slate-400">
            Redirecting to the auction lobby...
          </p>
        </div>
      ) : (
        <div className="w-full max-w-md relative z-10 animate-[fadeInUp_0.8s_ease-out]">
          <div className="bg-gradient-to-br from-slate-950/85 via-slate-950/70 to-black/90 sm:from-slate-950/95 sm:via-slate-950/80 sm:to-black/95 backdrop-blur-2xl rounded-2xl sm:rounded-3xl shadow-[0_18px_60px_rgba(15,23,42,0.9)] border border-slate-700/60 p-6 sm:p-8 md:p-12 relative overflow-hidden">

            {/* Animated Top Border */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-[shimmer_2s_linear_infinite]"></div>
            
            {/* Glow Effect Behind Card */}
            <div className="absolute -inset-1 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-3xl blur-2xl opacity-60 animate-[subtleGlow_3s_ease-in-out_infinite]">

            </div>
        
            <div className="text-center mb-8 sm:mb-10 relative z-10">
              <div className="mb-3 sm:mb-4">
                <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black mb-2 bg-gradient-to-r from-sky-300 via-cyan-200 to-blue-200 bg-clip-text text-transparent drop-shadow-[0_0_22px_rgba(125,211,252,0.55)] animate-[glow_2s_ease-in-out_infinite_alternate]">
                  TECHNO BID
                </h1>
                <div className="h-1 w-20 sm:w-24 bg-gradient-to-r from-transparent via-cyan-400 to-transparent mx-auto animate-[expand_1.5s_ease-out]"></div>
              </div>
              <p className="text-cyan-200 text-base sm:text-lg font-semibold tracking-wide animate-[fadeIn_1s_ease-out_0.3s_both]">IPL Auction Login</p>
              <p className="text-gray-400 text-xs sm:text-sm mt-2 animate-[fadeIn_1s_ease-out_0.5s_both]">Enter your credentials to access the bidding platform</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 relative z-10 flex flex-col items-stretch">
              <div className="relative animate-[fadeInUp_0.8s_ease-out_0.7s_both]">

                <label className="block text-cyan-200 text-sm font-medium mb-2 ml-1">Enrollment Number</label>
                <div className="relative group">
                  <input
                    type="text"
                    value={enrollmentNumber}
                    onChange={(e) => setEnrollmentNumber(e.target.value)}
                    placeholder="Enter your enrollment number"
                    className="w-full px-4 sm:px-5 py-3.5 sm:py-4 bg-black/60 border-2 border-blue-900/70 rounded-xl text-white text-sm sm:text-base placeholder-gray-500 focus:outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-400/40 transition-all duration-300 font-medium group-hover:border-cyan-600/70"

                    required
                  />
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-500/0 via-cyan-500/25 to-cyan-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || showSuccessLoader}
                className="self-center w-full max-w-xs py-2.5 px-4 sm:px-5 bg-gradient-to-r from-sky-600 via-sky-500 to-sky-400 text-slate-950 font-semibold text-sm sm:text-base rounded-md border border-sky-300/80 shadow-[0_6px_20px_rgba(56,189,248,0.35)] hover:shadow-[0_10px_30px_rgba(56,189,248,0.5)] hover:from-sky-500 hover:via-sky-400 hover:to-sky-300 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-sky-300/80 focus:ring-offset-2 focus:ring-offset-slate-950 transition-all duration-250 tracking-wide relative overflow-hidden group animate-[fadeInUp_0.8s_ease-out_0.9s_both] disabled:opacity-70 disabled:cursor-not-allowed"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <span className="text-[0.65rem] sm:text-xs font-semibold uppercase tracking-[0.22em]">Enter auction lobby</span>
                </span>

                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 opacity-0 group-hover:opacity-100 translate-x-[-120%] group-hover:translate-x-[120%] transition-all duration-800 ease-out"></div>
              </button>

            </form>
            {error && (
              <div className="mt-4 text-center text-sm text-red-400 relative z-10">{error}</div>
            )}
            <div className="mt-8 text-center relative z-10 animate-[fadeIn_1s_ease-out_1.1s_both]">
              <div className="flex items-center justify-center gap-2 text-gray-400 text-xs">
                <span>Live Auction Platform</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          33% { transform: translateY(-30px) translateX(20px); }
          66% { transform: translateY(30px) translateX(-20px); }
        }
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
        @keyframes sparkle {
          0%, 100% { opacity: 0; transform: scale(0); }
          50% { opacity: 1; transform: scale(1); }
        }
        @keyframes glow {
          0% { filter: drop-shadow(0 0 20px rgba(59, 130, 246, 0.6)); }
          100% { filter: drop-shadow(0 0 40px rgba(59, 130, 246, 0.9)); }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes expand {
          0% { width: 0; opacity: 0; }
          100% { width: 6rem; opacity: 1; }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes subtleGlow {
          0%, 100% { opacity: 0.1; }
          50% { opacity: 0.2; }
        }
        @keyframes subtlePulse {
          0%, 100% { opacity: 0.15; }
          50% { opacity: 0.22; }
        }
        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.05);
            opacity: 0.7;
          }
        }
      `}</style>
    </div>
  );
}