import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, User as UserIcon, Mail, Loader2, Terminal, ArrowLeft, ChevronRight } from 'lucide-react';

const STACK_ITEMS = [
  { icon: '🐍', label: 'FastAPI',     color: 'text-green-400' },
  { icon: '🗄️', label: 'SQLAlchemy', color: 'text-blue-400'  },
  { icon: '🔐', label: 'JWT Auth',   color: 'text-yellow-400'},
  { icon: '🤖', label: 'LLM Eval',   color: 'text-purple-400'},
  { icon: '📊', label: 'Skill Track',color: 'text-red-400'   },
];

const BUG_SNIPPETS = [
  {
    label: 'fastapi-001 · missing router',
    lines: [
      { text: '  app = FastAPI()',                  type: 'normal' },
      { text: '- app.include_router(todo.router)', type: 'deleted' },
      { text: '  # 404 on /todos endpoints',       type: 'comment' },
    ],
  },
  {
    label: 'fastapi-002 · wrong db dialect',
    lines: [
      { text: '  SQLALCHEMY_DATABASE_URL =',        type: 'normal' },
      { text: '-   "sqlite:///./todos.db"',         type: 'deleted' },
      { text: '+   "postgresql://..."',             type: 'added'   },
    ],
  },
  {
    label: 'fastapi-003 · jwt secret mismatch',
    lines: [
      { text: '  SECRET_KEY = os.getenv(',          type: 'normal' },
      { text: '-   "JWT_SECRET")',                  type: 'deleted' },
      { text: '+   "JWT_SECRET_KEY")',              type: 'added'   },
    ],
  },
];

const RegisterPage: React.FC = () => {
  const [username, setUsername]   = useState('');
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [snippetIdx, setSnippetIdx] = useState(0);
  const navigate = useNavigate();
  const { isAuthenticated, register } = useAuth();

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard', { replace: true });
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    const t = setInterval(() => setSnippetIdx(i => (i + 1) % BUG_SNIPPETS.length), 2800);
    return () => clearInterval(t);
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      await register({ username, email, password });
    } catch (err: any) {
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
        setError(err.response?.data?.detail || 'Registration failed');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const snippet = BUG_SNIPPETS[snippetIdx];

  return (
    <>
      <style>{`
        @keyframes fadeInLine { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)} }
        @keyframes slideSnippet { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        .snippet-enter { animation: slideSnippet 0.4s ease forwards; }
        .cursor-blink  { animation: blink 1s step-end infinite; }
      `}</style>

      <div className="min-h-screen flex bg-zinc-950">
        {/* ── Left Panel ── */}
        <div className="hidden lg:flex flex-col w-[55%] bg-zinc-950 border-r border-zinc-800 relative overflow-hidden p-10 justify-between">
          {/* Subtle grid */}
          <div className="absolute inset-0 opacity-[0.025]"
            style={{
              backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
              backgroundSize: '40px 40px'
            }}
          />

          {/* Top */}
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-8">
              <Terminal className="h-6 w-6 text-white" />
              <span className="text-xs font-bold tracking-[0.3em] text-zinc-400 uppercase">AI Engineering</span>
            </div>
            <h1 className="text-5xl font-black tracking-tighter text-white leading-[1.05] mb-4">
              Level up your<br />
              <span className="text-zinc-500">debug skills</span>
            </h1>
            <p className="text-zinc-500 text-sm leading-relaxed max-w-xs">
              Solve real production incidents. An AI evaluator scores your fix and tracks skill growth across sessions.
            </p>
          </div>

          {/* Middle — rotating bug snippet */}
          <div className="relative z-10 flex-1 my-10 flex flex-col justify-center">
            <div className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest mb-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-500/70 inline-block" />
              Sample incidents
            </div>
            <div
              key={snippetIdx}
              className="border border-zinc-800 rounded-lg bg-black/50 overflow-hidden snippet-enter"
            >
              {/* Tab bar */}
              <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-zinc-800 bg-zinc-900/40">
                <div className="w-2 h-2 rounded-full bg-red-500/60" />
                <div className="w-2 h-2 rounded-full bg-yellow-500/60" />
                <div className="w-2 h-2 rounded-full bg-green-500/60" />
                <span className="text-[10px] text-zinc-500 font-mono ml-2">{snippet.label}</span>
              </div>
              {/* Code */}
              <div className="p-4 font-mono text-[12px] space-y-1">
                {snippet.lines.map((line, i) => (
                  <div key={i} className={
                    line.type === 'deleted' ? 'text-red-400 bg-red-950/20 px-1 rounded' :
                    line.type === 'added'   ? 'text-green-400 bg-green-950/20 px-1 rounded' :
                    line.type === 'comment' ? 'text-zinc-600 italic' :
                    'text-zinc-300'
                  }>
                    {line.text}
                  </div>
                ))}
              </div>
            </div>

            {/* Snippet dots */}
            <div className="flex justify-center gap-2 mt-4">
              {BUG_SNIPPETS.map((_, i) => (
                <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all ${
                  i === snippetIdx ? 'bg-white' : 'bg-zinc-700'
                }`} />
              ))}
            </div>
          </div>

          {/* Bottom — tech stack */}
          <div className="relative z-10">
            <div className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest mb-3">
              Skills you'll build
            </div>
            <div className="flex flex-wrap gap-2">
              {STACK_ITEMS.map(item => (
                <div key={item.label} className={`flex items-center gap-1.5 bg-zinc-900/60 border border-zinc-800/50 rounded px-2.5 py-1.5 text-xs font-medium ${item.color}`}>
                  <span className="text-sm">{item.icon}</span>
                  {item.label}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Right Panel — Register Form ── */}
        <div className="flex-1 flex flex-col items-center justify-center p-8 relative">
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

            <button
              onClick={() => navigate('/login')}
              className="flex items-center gap-1.5 text-zinc-500 hover:text-white transition-colors text-xs mb-6"
            >
              <ArrowLeft className="h-3 w-3" />
              Back to login
            </button>

            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white tracking-tight">Create account</h2>
              <p className="text-zinc-500 text-sm mt-1">Join and start resolving incidents</p>
            </div>

            <form onSubmit={handleRegister} className="space-y-4">
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
                    placeholder="Username"
                  />
                </div>

                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 text-zinc-600 group-focus-within:text-zinc-400 transition-colors" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-white/30 focus:border-zinc-600 transition-all text-sm"
                    placeholder="Email address"
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
                    placeholder="Password (min 8 chars)"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-white text-zinc-950 rounded-lg font-bold text-sm hover:bg-zinc-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              >
                {isLoading ? (
                  <><Loader2 className="animate-spin h-4 w-4" /> CREATING ACCOUNT...</>
                ) : (
                  <><span>CREATE ACCOUNT</span><ChevronRight className="h-4 w-4" /></>
                )}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-zinc-800">
              <p className="text-center text-sm text-zinc-500">
                Already have an account?{' '}
                <button
                  onClick={() => navigate('/login')}
                  className="text-white font-semibold hover:underline underline-offset-2"
                >
                  Sign in
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

export default RegisterPage;