import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, User as UserIcon, Loader2, Terminal, ChevronRight } from 'lucide-react';

const LOGS = [
  { type: 'error',   text: 'ERROR    uvicorn - Application startup failed' },
  { type: 'warn',    text: 'WARNING  sqlalchemy - Connection pool timeout after 30s' },
  { type: 'info',    text: 'INFO     fastapi - POST /api/v1/auth/login 401' },
  { type: 'error',   text: 'ERROR    psycopg - null value in column "created_at"' },
  { type: 'info',    text: 'INFO     alembic - Running upgrade head -> fd431669c7a7' },
  { type: 'warn',    text: 'WARNING  cors - No Access-Control-Allow-Origin header' },
  { type: 'error',   text: 'ERROR    fastapi - 422 Unprocessable Entity' },
  { type: 'success', text: 'INFO     uvicorn - Application startup complete' },
  { type: 'info',    text: 'INFO     router - GET /api/v1/incidents/current 200 OK' },
  { type: 'error',   text: 'ERROR    jwt - Signature has expired' },
  { type: 'warn',    text: 'WARNING  pydantic - Field required [type=missing]' },
  { type: 'info',    text: 'INFO     fastapi - POST /api/v1/incidents/fastapi-001/submit' },
  { type: 'error',   text: 'ERROR    importlib - circular import detected in routers/' },
  { type: 'success', text: 'INFO     eval - root_cause_fixed: true  confidence: 0.97' },
  { type: 'warn',    text: 'WARNING  sqlalchemy - DetachedInstanceError on attempt' },
  { type: 'error',   text: 'ERROR    404 - /todos endpoint not found' },
  { type: 'info',    text: 'INFO     middleware - JWT decoded user_id: 9b85fd62' },
  { type: 'success', text: 'INFO     skill - routing +2.3  fastapi_basics +1.8' },
  { type: 'error',   text: 'ERROR    psycopg - FATAL: password authentication failed' },
  { type: 'warn',    text: 'WARNING  openrouter - 429 Rate limit exceeded, retrying' },
];

const INCIDENT_LINES = [
  '> Incident fastapi-001 loaded',
  '> Severity: HIGH',
  '> Bug: missing include_router()',
  '> Skill: routing, fastapi_basics',
  '> Attempt 1 submitted...',
  '> root_cause_fixed: false',
  '> Hint level 1 requested',
  '> Attempt 2 submitted...',
  '> root_cause_fixed: true ✓',
  '> Score: 8.4/10  +2.1 routing',
  '> Next: fastapi-002 unlocked',
];

const LogLine: React.FC<{ log: typeof LOGS[0]; delay: number }> = ({ log, delay }) => {
  const colors = {
    error:   'text-red-400',
    warn:    'text-yellow-400',
    info:    'text-zinc-400',
    success: 'text-green-400',
  };
  return (
    <div
      className={`font-mono text-[11px] leading-5 opacity-0 ${colors[log.type as keyof typeof colors]}`}
      style={{ animation: `fadeInLine 0.3s ease forwards ${delay}ms` }}
    >
      {log.text}
    </div>
  );
};

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [localIsLoading, setLocalIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [visibleLogs, setVisibleLogs] = useState<typeof LOGS>([]);
  const [incidentLine, setIncidentLine] = useState(0);
  const logsRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard', { replace: true });
  }, [isAuthenticated, navigate]);

  // Scroll logs animation
  useEffect(() => {
    let idx = 0;
    const interval = setInterval(() => {
      setVisibleLogs(prev => {
        const next = [...prev, LOGS[idx % LOGS.length]].slice(-12);
        return next;
      });
      idx++;
      if (logsRef.current) {
        logsRef.current.scrollTop = logsRef.current.scrollHeight;
      }
    }, 900);
    return () => clearInterval(interval);
  }, []);

  // Incident typewriter
  useEffect(() => {
    const interval = setInterval(() => {
      setIncidentLine(prev => (prev + 1) % INCIDENT_LINES.length);
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalIsLoading(true);
    setError(null);
    try {
      await login({ username_or_email: username, password });
    } catch (err: any) {
      setUsername('');
      setPassword('');
      if (err.response?.status === 422) {
        const detail = err.response.data.detail;
        if (Array.isArray(detail)) {
          let msg = detail[0].msg || 'Validation error';
          if (msg.includes('at least 8 characters')) msg = 'Password must have at least 8 characters';
          if (msg.includes('at most 72 characters')) msg = 'Password must not exceed 72 characters';
          setError(msg);
        } else {
          setError(detail || 'Invalid input data');
        }
      } else {
        setError(err.response?.data?.detail || 'Invalid credentials');
      }
    } finally {
      setLocalIsLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @keyframes fadeInLine {
          from { opacity: 0; transform: translateY(4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; } 50% { opacity: 0; }
        }
        @keyframes scanline {
          0%   { transform: translateY(-100%); }
          100% { transform: translateY(100vh); }
        }
        .cursor-blink { animation: blink 1s step-end infinite; }
        .scanline {
          position: absolute;
          inset: 0;
          pointer-events: none;
          background: linear-gradient(transparent 50%, rgba(0,0,0,0.03) 50%);
          background-size: 100% 4px;
          z-index: 1;
        }
      `}</style>

      <div className="min-h-screen flex bg-zinc-950">
        {/* ── Left Panel ── */}
        <div className="hidden lg:flex flex-col w-[55%] bg-zinc-950 border-r border-zinc-800 relative overflow-hidden p-10 justify-between">
          <div className="scanline" />

          {/* Top — branding */}
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-8">
              <Terminal className="h-6 w-6 text-white" />
              <span className="text-xs font-bold tracking-[0.3em] text-zinc-400 uppercase">
                AI Engineering
              </span>
            </div>
            <h1 className="text-5xl font-black tracking-tighter text-white leading-[1.05] mb-4">
              Incident<br />Simulator
            </h1>
            <p className="text-zinc-500 text-sm leading-relaxed max-w-xs">
              Debug real production bugs. Get evaluated by AI. Track your engineering skills over time.
            </p>
          </div>

          {/* Middle — live log stream */}
          <div className="relative z-10 flex-1 my-10 flex flex-col">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-red-500/70" />
              <div className="w-2 h-2 rounded-full bg-yellow-500/70" />
              <div className="w-2 h-2 rounded-full bg-green-500/70" />
              <span className="text-[10px] text-zinc-600 font-mono ml-2">production.log — live</span>
            </div>
            <div className="border border-zinc-800 rounded-lg bg-black/60 p-4 flex-1 overflow-hidden relative">
              <div ref={logsRef} className="space-y-0.5 overflow-hidden max-h-72">
                {visibleLogs.map((log, i) => (
                  <LogLine key={`${i}-${log.text}`} log={log} delay={0} />
                ))}
              </div>
              {/* Fade out top */}
              <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />
            </div>
          </div>

          {/* Bottom — incident typewriter */}
          <div className="relative z-10">
            <div className="border border-zinc-800 rounded-lg bg-zinc-900/40 p-4">
              <div className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest mb-2">
                Active simulation
              </div>
              <div className="font-mono text-[12px] text-green-400 flex items-center gap-1 min-h-[18px]">
                <span>{INCIDENT_LINES[incidentLine]}</span>
                <span className="cursor-blink">▊</span>
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3 mt-4">
              {[
                { label: 'Incidents', value: '5' },
                { label: 'Skills tracked', value: '9' },
                { label: 'Bug types', value: '5' },
              ].map(s => (
                <div key={s.label} className="bg-zinc-900/40 border border-zinc-800/50 rounded p-3 text-center">
                  <div className="text-xl font-black font-mono text-white">{s.value}</div>
                  <div className="text-[9px] text-zinc-600 uppercase tracking-wider mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Right Panel — Login Form ── */}
        <div className="flex-1 flex flex-col items-center justify-center p-8 relative">
          {/* Subtle grid bg */}
          <div className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
              backgroundSize: '40px 40px'
            }}
          />

          <div className="relative w-full max-w-sm">
            {/* Mobile logo */}
            <div className="flex items-center gap-2 mb-8 lg:hidden">
              <Terminal className="h-5 w-5 text-white" />
              <span className="font-bold text-white">Incident Simulator</span>
            </div>

            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white tracking-tight">Welcome back</h2>
              <p className="text-zinc-500 text-sm mt-1">Enter your credentials to access the terminal</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <div className="bg-red-950/40 border border-red-800/60 text-red-400 px-4 py-3 rounded-lg text-xs flex items-start gap-2">
                  <span className="text-red-500 font-mono font-bold shrink-0">ERR</span>
                  {error}
                </div>
              )}

              <div className="space-y-3">
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <UserIcon className="h-4 w-4 text-zinc-600 group-focus-within:text-zinc-400 transition-colors" />
                  </div>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-white/30 focus:border-zinc-600 transition-all text-sm"
                    placeholder="Username or email"
                  />
                </div>

                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-zinc-600 group-focus-within:text-zinc-400 transition-colors" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-white/30 focus:border-zinc-600 transition-all text-sm"
                    placeholder="Password"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={localIsLoading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-white text-zinc-950 rounded-lg font-bold text-sm hover:bg-zinc-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              >
                {localIsLoading ? (
                  <><Loader2 className="animate-spin h-4 w-4" /> AUTHENTICATING...</>
                ) : (
                  <><span>ENTER TERMINAL</span><ChevronRight className="h-4 w-4" /></>
                )}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-zinc-800">
              <p className="text-center text-sm text-zinc-500">
                No account?{' '}
                <button
                  onClick={() => navigate('/register')}
                  className="text-white font-semibold hover:underline underline-offset-2"
                >
                  Create one
                </button>
              </p>
            </div>

            {/* Corner decoration */}
            <div className="absolute -bottom-16 -right-8 text-[120px] font-black text-zinc-900 select-none pointer-events-none leading-none">
              &gt;_
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default LoginPage;