import React, { useEffect, useState } from 'react';
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
  // Escape keywords for regex
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

  // Monitor scrolling to animate top scroll-progress bar
  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (totalScroll > 0) {
        const currentProgress = (window.pageYOffset / totalScroll) * 100;
        setScrollProgress(currentProgress);
      }
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

        // Skill report is optional
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

  // Determine incident state: 'active' | 'completed' | 'unlocked' | 'locked'
  const getIncidentState = (incident: IncidentPublic, index: number): 'active' | 'completed' | 'unlocked' | 'locked' => {
    if (!progress) return index === 0 ? 'unlocked' : 'locked';

    const isCompleted = progress.completed_incident_ids?.includes(incident.id);
    const isActive = progress.current_incident_id === incident.id;
    const incidentsCompleted = progress.incidents_completed ?? 0;

    if (isCompleted) return 'completed';
    if (isActive) return 'active';
    // Unlocked if the user has completed enough incidents to reach this one
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

  // Sort incidents consistently (same order as backend)
  const sortedIncidents = [...availableIncidents].sort((a, b) => a.id.localeCompare(b.id));

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans pb-20">
      <style>{`
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
        @keyframes activeGlow {
          0%, 100% { border-color: rgba(255, 255, 255, 0.15); box-shadow: 0 0 12px rgba(255, 255, 255, 0.02); }
          50% { border-color: rgba(255, 255, 255, 0.35); box-shadow: 0 0 24px rgba(255, 255, 255, 0.08); }
        }
        @keyframes assignmentGlow {
          0%, 100% { border-color: rgba(239, 68, 68, 0.25); box-shadow: 0 0 12px rgba(239, 68, 68, 0.02); }
          50% { border-color: rgba(239, 68, 68, 0.55); box-shadow: 0 0 24px rgba(239, 68, 68, 0.14); }
        }
        .active-glow-card {
          animation: activeGlow 3s infinite ease-in-out;
        }
        .assignment-glow-card {
          animation: assignmentGlow 2.5s infinite ease-in-out;
        }
        /* Custom sleek terminal scrollbar */
        ::-webkit-scrollbar {
          width: 8px;
        }
        ::-webkit-scrollbar-track {
          background: #09090b;
        }
        ::-webkit-scrollbar-thumb {
          background: #27272a;
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #3f3f46;
        }
        html {
          scroll-behavior: smooth;
        }
      `}</style>

      {/* Header */}
      <header className="h-16 border-b border-zinc-800 flex items-center px-8 justify-between bg-zinc-900/50 sticky top-0 z-10 backdrop-blur-md">
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
        {/* Welcome Section */}
        <section className="border-l-2 border-red-500/60 pl-6 py-2 bg-gradient-to-r from-red-950/10 to-transparent">
          <div className="flex items-center gap-3 mb-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
            <h2 className="text-2xl lg:text-3xl font-mono font-black tracking-tight text-white uppercase">
              GET READY, ENGINEER.
            </h2>
          </div>
          <p className="text-zinc-500 max-w-3xl text-sm leading-relaxed">
            Telemetry reports multiple <span className="text-red-400 font-mono font-bold bg-red-950/20 px-1.5 py-0.5 border border-red-900/30 rounded">CRITICAL ANOMALIES</span> inside our production API servers. Analyze log outputs, pinpoint system errors, and commit golden patches. <span className="text-zinc-300">Failure is not an option.</span> Secure next clearance levels to proceed.
          </p>
        </section>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-lg relative overflow-hidden group hover:-translate-y-1 hover:border-zinc-700/80 hover:shadow-2xl hover:shadow-black/40 transition-all duration-350 ease-out cursor-default">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <CheckCircle className="h-24 w-24" />
            </div>
            <div className="flex items-center gap-3 text-zinc-400 mb-4">
              <CheckCircle className="h-5 w-5" />
              <span className="text-xs font-bold uppercase tracking-widest">Incidents Resolved</span>
            </div>
            <div className="text-4xl font-mono font-bold text-white">{progress?.incidents_completed ?? 0}</div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-lg relative overflow-hidden group hover:-translate-y-1 hover:border-zinc-700/80 hover:shadow-2xl hover:shadow-black/40 transition-all duration-350 ease-out cursor-default">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <BookOpen className="h-24 w-24" />
            </div>
            <div className="flex items-center gap-3 text-zinc-400 mb-4">
              <BarChart3 className="h-5 w-5" />
              <span className="text-xs font-bold uppercase tracking-widest">Hints Used</span>
            </div>
            <div className="text-4xl font-mono font-bold text-white">{progress?.hints_used ?? 0}</div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-lg relative overflow-hidden group hover:-translate-y-1 hover:border-zinc-700/80 hover:shadow-2xl hover:shadow-black/40 transition-all duration-350 ease-out cursor-default">
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
        </div>

        {/* Skill Mastery */}
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

        {/* Active Assignment */}
        {progress?.current_incident_id && !progress.completed_incident_ids?.includes(progress.current_incident_id) && (
          <section className="bg-zinc-900 border border-red-500/20 rounded-lg overflow-hidden assignment-glow-card hover:-translate-y-1 hover:border-red-500/50 hover:shadow-2xl hover:shadow-red-950/20 transition-all duration-300 ease-out animate-fade-in-up delay-3">
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
        )}

        {/* Incident Catalog */}
        <section className="space-y-6 animate-fade-in-up delay-4">
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
                <div
                  key={incident.id}
                  className={`border rounded-lg p-6 transition-all duration-300 ease-out relative ${
                    isLocked
                      ? 'bg-zinc-950/60 border-zinc-800/50 opacity-60'
                      : isCompleted
                      ? 'bg-zinc-900/40 border-zinc-700 hover:-translate-y-1 hover:border-zinc-500 hover:shadow-2xl hover:shadow-black/60'
                      : isActive
                      ? 'bg-zinc-900 active-glow-card hover:-translate-y-1'
                      : 'bg-zinc-900/40 border-zinc-800 hover:border-zinc-600/80 hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/60'
                  }`}
                >
                  {/* Completed badge */}
                  {isCompleted && (
                    <div className="absolute top-4 right-4 flex items-center gap-1 text-green-400">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-[10px] font-bold uppercase">Completed</span>
                    </div>
                  )}

                  {/* Locked icon */}
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
                        incident.difficulty === 'easy' ? 'text-green-400 border-green-900/50 bg-green-900/10' :
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

                    {/* Action button based on state */}
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
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
};

export default DashboardPage;