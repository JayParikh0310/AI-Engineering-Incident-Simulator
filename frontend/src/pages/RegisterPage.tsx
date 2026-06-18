import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import { Lock, User as UserIcon, Mail, Loader2, ArrowLeft } from 'lucide-react';

const RegisterPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await authService.register({
        username,
        email,
        password,
      });
      // After successful registration, the backend usually returns a token
      // and our service stores it. If registration just creates the user,
      // we'd need to log in. But our AuthResponse includes a token.
      window.location.href = '/dashboard';
    } catch (err: any) {
      console.error('Registration error:', err);
      
      // Clear password on failure
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4">
      <div className="w-full max-w-md space-y-8 bg-zinc-900 p-8 border border-zinc-800 rounded-lg shadow-2xl">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-white">CREATE ACCOUNT</h1>
          <p className="mt-2 text-zinc-400">Join the simulation</p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleRegister}>
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
                placeholder="Username"
              />
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-zinc-500" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 bg-zinc-950 border border-zinc-800 rounded text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-white focus:border-white transition-all sm:text-sm"
                placeholder="Email Address"
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
                placeholder="Password (min 8 chars)"
              />
            </div>
          </div>

          <div className="space-y-4">
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-zinc-950 bg-white hover:bg-zinc-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isLoading ? (
                <Loader2 className="animate-spin h-5 w-5" />
              ) : (
                'CREATE ACCOUNT'
              )}
            </button>
            
            <button 
              type="button"
              onClick={() => navigate('/login')}
              className="w-full flex items-center justify-center gap-2 text-xs text-zinc-500 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-3 w-3" />
              BACK TO LOGIN
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;
