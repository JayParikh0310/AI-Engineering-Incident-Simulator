import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Terminal, CheckCircle, BarChart3, User, LogOut, Loader2, Play, BookOpen, BrainCircuit, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { userService } from '../services/userService';
import { incidentService } from '../services/incidentService';
import type { UserProgressDetail } from '../types/user';
import type { UserProgress } from '../types/progress';
import type { IncidentPublic } from '../types/incident';
import ProgressBar from '../components/ProgressBar';

const highlightErrorKeywords = (text: string, isLocked: boolean) => {
  if (isLocked) return text;
  const keywords = [
    'circular import', 'timeout', 'failed', 'error', 'bug', 'crash', 'broken',
    'critical', 'exception', '404', '422', 'mismatch', 'leak', 'corrupted', 'detached'
  ];
  const regex = new RegExp(`\\b(${keywords.join('|')})\\b`, 'gi');
  const parts = text.split(regex);
  return (
    <>
      {parts.map((part, i) => {
        const isMatch = keywords.some(k => k.toLowerCase() === part.toLowerCase());
        return isMatch ? (
          <span key={i} className="text-red-400 font-semibold font-mono bg-red-950/20 px-1 rounded border border-red-900/30 mx-0.5 text-[12px]">
            {part}
          </span>
        ) : (
          part
        );
      })}
    </>
  );
};

const TICKER_ENTRIES = [
  { type: 'info',    text: 'GET /api/v1/incidents 200 OK' },
  { type: 'success', text: 'skill_eval: routing +1.4' },
  { type: 'error',   text: 'ERROR 422 Unprocessable Entity' },
  { type: 'info',    text: 'POST /auth/login 200 OK' },
  { type: 'warn',    text: 'WARNING: connection pool 85%' },
  { type: 'success', text: 'root_cause_fixed: true ✓' },
  { type: 'info',    text: 'alembic upgrade head → fd4316' },
  { type: 'error',   text: 'ERROR: circular import detected' },
  { type: 'info',    text: 'GET /incidents/fastapi-003 200' },
  { type: 'warn',    text: 'WARNING: JWT expiring soon' },
  { type: 'success', text: 'fastapi-002 unlocked 🎉' },
  { type: 'error',   text: 'psycopg: auth failed' },
  { type: 'info',    text: 'middleware: user_id 9b85fd62' },
  { type: 'success', text: 'score: 9.1/10 confidence: 0.94' },
  { type: 'warn',    text: 'DetachedInstanceError on flush' },
  { type: 'info',    text: 'GET /progress/report 200 OK' },
];

const Reveal: React.FC<{ children: React.ReactNode; className?: string; delay?: number }> = ({
  children,
  className = '',
  delay = 0,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.08, rootMargin: '0px 0px -30px 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(16px)',
        transition: visible
          ? `opacity 0.55s cubic-bezier(0.22,1,0.36,1) ${delay}ms, transform 0.55s cubic-bezier(0.22,1,0.36,1) ${delay}ms`
          : 'none',
      }}
    >
      {children}
    </div>
  );
};

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [progress, setProgress] = useState<UserProgressDetail | null>(null);
  const [skillProgress, setSkillProgress] = useState<UserProgress | null>(null);
  const [availableIncidents, setAvailableIncidents] = useState<IncidentPublic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAssigning, setIsAssigning] = useState(false);
  const [lockedTooltip, setLockedTooltip] = useState<string | null>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (totalScroll > 0) setScrollProgress((window.pageYOffset / totalScroll) * 100);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!user) return;
        const [progressData, incidentsData] = await Promise.all([
          userService.getMyProgress(),
          incidentService.getAllIncidents(),
        ]);
        setProgress(progressData);
        setAvailableIncidents(incidentsData);
        try {
          const skillData = await userService.getProgressReport();
          setSkillProgress(skillData);
        } catch {
          setSkillProgress(null);
        }
      } catch (err) {
        console.error('Failed to fetch dashboard data', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const handleStartIncident = async (incidentId: string) => {
    setIsAssigning(true);
    try {
      await userService.assignIncident(incidentId);
      navigate('/incident');
    } catch (err) {
      console.error('Failed to assign incident', err);
    } finally {
      setIsAssigning(false);
    }
  };

  const getIncidentState = (incident: IncidentPublic, index: number): 'active' | 'completed' | 'unlocked' | 'locked' => {
    if (!progress) return index === 0 ? 'unlocked' : 'locked';
    const isCompleted = progress.completed_incident_ids?.includes(incident.id);
    const isActive = progress.current_incident_id === incident.id;
    const incidentsCompleted = progress.incidents_completed ?? 0;
    if (isCompleted) return 'completed';
    if (isActive) return 'active';
    if (index <= incidentsCompleted) return 'unlocked';
    return 'locked';
  };

  if (!user) return null;

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-zinc-950">
        <Loader2 className="animate-spin h-10 w-10 text-white" />
      </div>
    );
  }

  const sortedIncidents = [...availableIncidents].sort((a, b) => a.id.localeCompare(b.id));
  const tickerItems = [...TICKER_ENTRIES, ...TICKER_ENTRIES];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans pb-20 relative overflow-hidden">

      {/* ── Ambient background ── */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">

        {/* Scanline texture — same as login page */}
        <div
          className="absolute inset-0 opacity-[0.018]"
          style={{
            background: 'linear-gradient(transparent 50%, rgba(0,0,0,0.6) 50%)',
            backgroundSize: '100% 4px',
          }}
        />

        {/* Red orb */}
        <div
          className="absolute rounded-full blur-[120px] opacity-[0.13]"
          style={{
            width: 650,
            height: 650,
            top: '0%',
            left: '-10%',
            background: 'radial-gradient(circle, rgba(239,68,68,1) 0%, transparent 70%)',
            transform: `translateY(${scrollProgress * -0.18}px)`,
            animation: 'orbDrift 10s ease-in-out infinite',
          }}
        />

        {/* Blue orb */}
        <div
          className="absolute rounded-full blur-[130px] opacity-[0.2]"
          style={{
            width: 580,
            height: 580,
            bottom: '5%',
            right: '-8%',
            background: 'radial-gradient(circle, rgba(59,130,246,1) 0%, transparent 70%)',
            transform: `translateY(${scrollProgress * -0.1}px)`,
            animation: 'orbDriftReverse 12s ease-in-out infinite',
          }}
        />

        {/* Grid — parallax on scroll */}
        <div
          className="absolute inset-0 opacity-[0.022]"
          style={{
            backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg,#fff 1px,transparent 1px)`,
            backgroundSize: '40px 40px',
            transform: `translateY(${scrollProgress * -0.4}px)`,
          }}
        />
      </div>

      <style>{`
        @keyframes orbDrift {
          0%,100% { transform: translate(0px, 0px); }
          33%      { transform: translate(30px, 20px); }
          66%      { transform: translate(-20px, 35px); }
        }
        @keyframes orbDriftReverse {
          0%,100% { transform: translate(0px, 0px); }
          33%      { transform: translate(-25px, -18px); }
          66%      { transform: translate(18px, -30px); }
        }
        @keyframes activeGlow {
          0%, 100% { border-color: rgba(255,255,255,0.15); box-shadow: 0 0 12px rgba(255,255,255,0.02); }
          50%       { border-color: rgba(255,255,255,0.35); box-shadow: 0 0 24px rgba(255,255,255,0.08); }
        }
        @keyframes assignmentGlow {
          0%, 100% { border-color: rgba(239,68,68,0.25); box-shadow: 0 0 12px rgba(239,68,68,0.02); }
          50%       { border-color: rgba(239,68,68,0.55); box-shadow: 0 0 24px rgba(239,68,68,0.14); }
        }
        @keyframes tickerScroll {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        .active-glow-card    { animation: activeGlow 3s infinite ease-in-out; }
        .assignment-glow-card { animation: assignmentGlow 2.5s infinite ease-in-out; }
        .ticker-track {
          display: flex;
          width: max-content;
          animation: tickerScroll 38s linear infinite;
        }
        .ticker-track:hover { animation-play-state: paused; }
        ::-webkit-scrollbar       { width: 8px; }
        ::-webkit-scrollbar-track { background: #09090b; }
        ::-webkit-scrollbar-thumb { background: #27272a; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #3f3f46; }
        html { scroll-behavior: smooth; }
        @media (prefers-reduced-motion: reduce) {
          .ticker-track { animation: none; }
          * { animation-duration: 0.01ms !important; }
        }
      `}</style>

      {/* Header */}
      <header className="h-16 border-b border-zinc-800 flex items-center px-8 justify-between bg-zinc-900/50 sticky top-0 z-20 backdrop-blur-md">
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

      <main className="max-w-6xl mx-auto p-8 space-y-12">

        {/* Welcome */}
        <Reveal>
          <section className="border-l-2 border-red-500/60 pl-6 py-2 bg-gradient-to-r from-red-950/10 to-transparent">
            <div className="flex items-center gap-3 mb-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
              <h2 className="text-2xl lg:text-3xl font-mono font-black tracking-tight text-white uppercase">
                GET READY, ENGINEER.
              </h2>
            </div>
            <p className="text-zinc-500 max-w-3xl text-sm leading-relaxed">
              Telemetry reports multiple{' '}
              <span className="text-red-400 font-mono font-bold bg-red-950/20 px-1.5 py-0.5 border border-red-900/30 rounded">
                CRITICAL ANOMALIES
              </span>{' '}
              inside our production API servers. Analyze log outputs, pinpoint system errors, and commit golden patches.{' '}
              <span className="text-zinc-300">Failure is not an option.</span> Secure next clearance levels to proceed.
            </p>
          </section>
        </Reveal>

        {/* ── Activity Ticker — right after welcome, feels like live system feed ── */}
        <Reveal>
          <div className="relative overflow-hidden border border-zinc-800/60 rounded-lg bg-zinc-900/30 py-2.5 select-none">
            <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-zinc-900/80 to-transparent z-10 pointer-events-none rounded-l-lg" />
            <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-zinc-900/80 to-transparent z-10 pointer-events-none rounded-r-lg" />
            <div className="absolute left-3 top-1/2 -translate-y-1/2 z-20 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500/80 animate-pulse" />
              <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest font-mono">live</span>
            </div>
            <div className="ticker-track pl-20">
              {tickerItems.map((entry, i) => {
                const colorMap: Record<string, string> = {
                  error:   'text-red-400',
                  warn:    'text-yellow-400',
                  info:    'text-zinc-500',
                  success: 'text-green-400',
                };
                return (
                  <span
                    key={i}
                    className={`inline-flex items-center gap-1 font-mono text-[11px] px-5 whitespace-nowrap ${colorMap[entry.type]}`}
                  >
                    <span className="text-zinc-700 mr-1">›</span>
                    {entry.text}
                  </span>
                );
              })}
            </div>
          </div>
        </Reveal>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Reveal delay={0}>
            <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-lg relative overflow-hidden group hover:-translate-y-1 hover:border-zinc-700/80 hover:shadow-2xl hover:shadow-black/40 transition-all duration-300 ease-out cursor-default">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <CheckCircle className="h-24 w-24" />
              </div>
              <div className="flex items-center gap-3 text-zinc-400 mb-4">
                <CheckCircle className="h-5 w-5" />
                <span className="text-xs font-bold uppercase tracking-widest">Incidents Resolved</span>
              </div>
              <div className="text-4xl font-mono font-bold text-white">{progress?.incidents_completed ?? 0}</div>
            </div>
          </Reveal>

          <Reveal delay={60}>
            <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-lg relative overflow-hidden group hover:-translate-y-1 hover:border-zinc-700/80 hover:shadow-2xl hover:shadow-black/40 transition-all duration-300 ease-out cursor-default">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <BookOpen className="h-24 w-24" />
              </div>
              <div className="flex items-center gap-3 text-zinc-400 mb-4">
                <BarChart3 className="h-5 w-5" />
                <span className="text-xs font-bold uppercase tracking-widest">Hints Used</span>
              </div>
              <div className="text-4xl font-mono font-bold text-white">{progress?.hints_used ?? 0}</div>
            </div>
          </Reveal>

          <Reveal delay={120}>
            <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-lg relative overflow-hidden group hover:-translate-y-1 hover:border-zinc-700/80 hover:shadow-2xl hover:shadow-black/40 transition-all duration-300 ease-out cursor-default">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Terminal className="h-24 w-24" />
              </div>
              <div className="flex items-center gap-3 text-zinc-400 mb-4">
                <Terminal className="h-5 w-5" />
                <span className="text-xs font-bold uppercase tracking-widest">Active Status</span>
              </div>
              <div className="text-lg font-mono font-bold truncate flex items-center gap-2">
                {progress?.current_incident_id ? (
                  <>
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-green-400">IN FIELD</span>
                  </>
                ) : (
                  <>
                    <span className="w-2.5 h-2.5 rounded-full bg-zinc-600" />
                    <span className="text-zinc-500">IDLE</span>
                  </>
                )}
              </div>
            </div>
          </Reveal>
        </div>

        {/* Skill Mastery */}
        <Reveal>
          <section className="bg-zinc-900 border border-zinc-800 p-8 rounded-lg">
            <div className="flex items-center gap-3 mb-6">
              <BrainCircuit className="h-5 w-5 text-zinc-400" />
              <h3 className="text-xl font-bold uppercase tracking-tighter">Skill Mastery</h3>
            </div>
            {skillProgress && Object.keys(skillProgress.skills).length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                {Object.entries(skillProgress.skills).map(([name, data]) => (
                  <ProgressBar key={name} label={name.replace(/_/g, ' ')} value={data.mastery} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-zinc-500 italic">No skill data yet. Complete an incident to start tracking.</p>
            )}
          </section>
        </Reveal>

        {/* Active Assignment */}
        {progress?.current_incident_id && !progress.completed_incident_ids?.includes(progress.current_incident_id) && (
          <Reveal>
            <section className="bg-zinc-900 border border-red-500/20 rounded-lg overflow-hidden assignment-glow-card hover:-translate-y-1 hover:border-red-500/50 hover:shadow-2xl hover:shadow-red-950/20 transition-all duration-300 ease-out">
              <div className="p-6 flex justify-between items-center bg-gradient-to-r from-red-950/10 to-transparent">
                <div>
                  <div className="flex items-center gap-2 text-white mb-1">
                    <Play className="h-4 w-4 fill-white text-red-500" />
                    <h3 className="text-xl font-bold font-mono tracking-tight uppercase">Active Assignment</h3>
                  </div>
                  <p className="text-sm text-zinc-400 font-mono">
                    {progress.current_incident_title} ({progress.current_incident_id})
                  </p>
                </div>
                <button
                  onClick={() => navigate('/incident')}
                  className="bg-white text-zinc-950 px-6 py-2 rounded font-bold hover:bg-zinc-100 transition-all hover:scale-[1.03] shadow-lg shadow-white/5 active:scale-[0.98]"
                >
                  RESUME TERMINAL
                </button>
              </div>
            </section>
          </Reveal>
        )}

        {/* Incident Catalog */}
        <Reveal>
          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <BookOpen className="h-5 w-5 text-zinc-400" />
              <h3 className="text-xl font-bold uppercase tracking-tighter">Incident Catalog</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sortedIncidents.map((incident, index) => {
                const state = getIncidentState(incident, index);
                const isLocked = state === 'locked';
                const isCompleted = state === 'completed';
                const isActive = state === 'active';

                return (
                  <Reveal key={incident.id} delay={(index % 4) * 60}>
                    <div
                      className={`border rounded-lg p-6 transition-all duration-300 ease-out relative h-full ${
                        isLocked
                          ? 'bg-zinc-950/60 border-zinc-800/50 opacity-60'
                          : isCompleted
                          ? 'bg-zinc-900/40 border-zinc-700 hover:-translate-y-1 hover:border-zinc-500 hover:shadow-2xl hover:shadow-black/60'
                          : isActive
                          ? 'bg-zinc-900 active-glow-card hover:-translate-y-1'
                          : 'bg-zinc-900/40 border-zinc-800 hover:border-zinc-600/80 hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/60'
                      }`}
                    >
                      {isCompleted && (
                        <div className="absolute top-4 right-4 flex items-center gap-1 text-green-400">
                          <CheckCircle className="h-4 w-4" />
                          <span className="text-[10px] font-bold uppercase">Completed</span>
                        </div>
                      )}
                      {isLocked && (
                        <div className="absolute top-4 right-4 text-zinc-600">
                          <Lock className="h-4 w-4" />
                        </div>
                      )}

                      <div className="flex justify-between items-start mb-4">
                        <div className="pr-16">
                          <h4 className={`font-bold text-lg ${isLocked ? 'text-zinc-500' : 'text-white'}`}>
                            {incident.title}
                          </h4>
                          <p className="text-xs font-mono text-zinc-500">{incident.id}</p>
                        </div>
                        {!isCompleted && !isLocked && (
                          <span className={`text-[9px] px-2 py-0.5 rounded border uppercase font-bold ${
                            incident.difficulty === 'easy'   ? 'text-green-400 border-green-900/50 bg-green-900/10' :
                            incident.difficulty === 'medium' ? 'text-yellow-400 border-yellow-900/50 bg-yellow-900/10' :
                            'text-red-400 border-red-900/50 bg-red-900/10'
                          }`}>
                            {incident.difficulty}
                          </span>
                        )}
                      </div>

                      <p className={`text-sm mb-6 line-clamp-2 italic leading-relaxed ${isLocked ? 'text-zinc-600' : 'text-zinc-400'}`}>
                        "{highlightErrorKeywords(incident.scenario.summary, isLocked)}"
                      </p>

                      <div className="flex items-center justify-between">
                        <div className="flex gap-2">
                          <span className="text-[10px] bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded">FastAPI</span>
                          <span className="text-[10px] bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded">V1</span>
                        </div>

                        {isLocked ? (
                          <div className="relative">
                            <button
                              onMouseEnter={() => setLockedTooltip(incident.id)}
                              onMouseLeave={() => setLockedTooltip(null)}
                              className="text-xs px-4 py-1.5 rounded font-bold bg-zinc-800/50 text-zinc-600 cursor-not-allowed"
                              disabled
                            >
                              LOCKED
                            </button>
                            {lockedTooltip === incident.id && (
                              <div className="absolute bottom-full right-0 mb-2 w-48 bg-zinc-800 border border-zinc-700 rounded p-2 text-[10px] text-zinc-300 text-center shadow-xl z-10">
                                Complete the previous incident first
                              </div>
                            )}
                          </div>
                        ) : isCompleted ? (
                          <button
                            onClick={() => handleStartIncident(incident.id)}
                            disabled={isAssigning}
                            className="text-xs px-4 py-1.5 rounded font-bold transition-all bg-zinc-800 text-zinc-300 hover:bg-zinc-700 flex items-center gap-1.5"
                          >
                            <CheckCircle className="h-3 w-3 text-green-400" />
                            REPLAY
                          </button>
                        ) : isActive ? (
                          <button
                            onClick={() => navigate('/incident')}
                            className="text-xs px-4 py-1.5 rounded font-bold transition-all bg-white text-zinc-950"
                          >
                            CONTINUE
                          </button>
                        ) : (
                          <button
                            onClick={() => handleStartIncident(incident.id)}
                            disabled={isAssigning}
                            className="text-xs px-4 py-1.5 rounded font-bold transition-all bg-zinc-800 text-white hover:bg-zinc-700"
                          >
                            START SIMULATION
                          </button>
                        )}
                      </div>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </section>
        </Reveal>

      </main>
    </div>
  );
};

export default DashboardPage;