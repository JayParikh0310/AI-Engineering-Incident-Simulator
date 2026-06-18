import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, User as UserIcon, Loader2 } from 'lucide-react';

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [localIsLoading, setLocalIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalIsLoading(true);
    setError(null);

    try {
      await login({
        username_or_email: username,
        password: password,
      });
      // Navigation is handled by the useEffect above or the AuthProvider state change
    } catch (err: any) {
      console.error('Login error:', err);
      
      // Clear fields on failure as requested
      setUsername('');
      setPassword('');

      // Handle FastAPI validation errors (422) specifically
      if (err.response?.status === 422) {
        const detail = err.response.data.detail;
        if (Array.isArray(detail)) {
          let msg = detail[0].msg || 'Validation error';
          // Customize messages
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
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4">
      <div className="w-full max-w-md space-y-8 bg-zinc-900 p-8 border border-zinc-800 rounded-lg shadow-2xl">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-white">INCIDENT SIMULATOR</h1>
          <p className="mt-2 text-zinc-400">Authenticate to enter the terminal</p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          {error && (
            <div className="bg-red-900/20 border border-red-900 text-red-400 px-4 py-2 rounded text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <UserIcon className="h-5 w-5 text-zinc-500" />
              </div>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 bg-zinc-950 border border-zinc-800 rounded text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-white focus:border-white transition-all sm:text-sm"
                placeholder="Username or Email"
              />
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-zinc-500" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 bg-zinc-950 border border-zinc-800 rounded text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-white focus:border-white transition-all sm:text-sm"
                placeholder="Password"
              />
            </div>
          </div>

          <div className="space-y-4">
            <button
              type="submit"
              disabled={localIsLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-zinc-950 bg-white hover:bg-zinc-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {localIsLoading ? (
                <Loader2 className="animate-spin h-5 w-5" />
              ) : (
                'ENTER TERMINAL'
              )}
            </button>
            
            <p className="text-center text-xs text-zinc-500">
              Don't have an account?{' '}
              <button 
                type="button"
                onClick={() => navigate('/register')}
                className="text-white hover:underline font-bold"
              >
                REGISTER
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
