import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Terminal, CheckCircle, BarChart3, User, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans">
      {/* Header */}
      <header className="h-16 border-b border-zinc-800 flex items-center px-8 justify-between bg-zinc-900/50">
        <div className="flex items-center gap-3">
          <Terminal className="h-6 w-6" />
          <h1 className="text-lg font-bold tracking-tighter uppercase">Incident Simulator</h1>
        </div>
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2 text-zinc-400">
            <User className="h-4 w-4" />
            <span>{user.username}</span>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-8 space-y-8">
        {/* Welcome Section */}
        <section>
          <h2 className="text-3xl font-bold mb-2">Welcome back, Engineer.</h2>
          <p className="text-zinc-500">Your current expertise and active assignments are listed below.</p>
        </section>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-lg">
            <div className="flex items-center gap-3 text-zinc-400 mb-4">
              <CheckCircle className="h-5 w-5" />
              <span className="text-xs font-bold uppercase tracking-widest">Incidents Resolved</span>
            </div>
            <div className="text-4xl font-mono font-bold">0</div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-lg">
            <div className="flex items-center gap-3 text-zinc-400 mb-4">
              <BarChart3 className="h-5 w-5" />
              <span className="text-xs font-bold uppercase tracking-widest">Mastery Level</span>
            </div>
            <div className="text-4xl font-mono font-bold">Lvl 1</div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-lg">
            <div className="flex items-center gap-3 text-zinc-400 mb-4">
              <Terminal className="h-5 w-5" />
              <span className="text-xs font-bold uppercase tracking-widest">Current Incident</span>
            </div>
            <div className="text-lg font-bold truncate">fastapi-001</div>
          </div>
        </div>

        {/* Active Assignment */}
        <section className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
          <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
            <div>
              <h3 className="text-xl font-bold">Active Assignment</h3>
              <p className="text-sm text-zinc-500">You are currently assigned to a critical router registration bug.</p>
            </div>
            <button 
              onClick={() => navigate('/incident')}
              className="bg-white text-zinc-950 px-6 py-2 rounded font-bold hover:bg-zinc-200 transition-colors"
            >
              RESUME TERMINAL
            </button>
          </div>
          <div className="p-6 grid grid-cols-2 gap-8">
            <div className="space-y-4">
              <div>
                <span className="text-[10px] font-bold text-zinc-500 uppercase block mb-1">Incident ID</span>
                <p className="font-mono text-sm">fastapi-001</p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-zinc-500 uppercase block mb-1">Difficulty</span>
                <span className="text-xs text-green-400 border border-green-900/50 bg-green-900/10 px-2 py-0.5 rounded uppercase font-bold">Easy</span>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <span className="text-[10px] font-bold text-zinc-500 uppercase block mb-1">Estimated Time</span>
                <p className="text-sm">15-30 Minutes</p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-zinc-500 uppercase block mb-1">Skills Targeted</span>
                <div className="flex gap-2 mt-1">
                  <span className="text-[10px] bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded">FastAPI</span>
                  <span className="text-[10px] bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded">Routing</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default DashboardPage;
