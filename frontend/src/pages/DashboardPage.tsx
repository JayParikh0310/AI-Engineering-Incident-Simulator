import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Terminal, CheckCircle, BarChart3, User, LogOut, Loader2, Play, BookOpen } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { userService } from '../services/userService';
import { incidentService } from '../services/incidentService';
import type { UserProgressDetail } from '../types/user';
import type { IncidentPublic } from '../types/incident';

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [progress, setProgress] = useState<UserProgressDetail | null>(null);
  const [availableIncidents, setAvailableIncidents] = useState<IncidentPublic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAssigning, setIsAssigning] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [progressData, incidentsData] = await Promise.all([
          userService.getMyProgress(),
          incidentService.getAllIncidents()
        ]);
        setProgress(progressData);
        setAvailableIncidents(incidentsData);
      } catch (err) {
        console.error('Failed to fetch dashboard data', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

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
      alert('Failed to start incident. Please try again.');
    } finally {
      setIsAssigning(false);
    }
  };

  if (!user) return null;

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-zinc-950">
        <Loader2 className="animate-spin h-10 w-10 text-white" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans pb-20">
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
        <section>
          <h2 className="text-3xl font-bold mb-2 tracking-tight">System Ready, Engineer.</h2>
          <p className="text-zinc-500 max-w-2xl">Select an active simulation from the catalog below to begin troubleshooting. Your progress and performance metrics are tracked in real-time.</p>
        </section>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-lg relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <CheckCircle className="h-24 w-24" />
            </div>
            <div className="flex items-center gap-3 text-zinc-400 mb-4">
              <CheckCircle className="h-5 w-5" />
              <span className="text-xs font-bold uppercase tracking-widest">Incidents Resolved</span>
            </div>
            <div className="text-4xl font-mono font-bold">{progress?.incidents_completed || 0}</div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-lg relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <BookOpen className="h-24 w-24" />
            </div>
            <div className="flex items-center gap-3 text-zinc-400 mb-4">
              <BarChart3 className="h-5 w-5" />
              <span className="text-xs font-bold uppercase tracking-widest">Hints Used</span>
            </div>
            <div className="text-4xl font-mono font-bold">{progress?.hints_used || 0}</div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-lg relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Terminal className="h-24 w-24" />
            </div>
            <div className="flex items-center gap-3 text-zinc-400 mb-4">
              <Terminal className="h-5 w-5" />
              <span className="text-xs font-bold uppercase tracking-widest">Active Status</span>
            </div>
            <div className="text-lg font-bold truncate">
              {progress?.current_incident_id ? 'IN FIELD' : 'IDLE'}
            </div>
          </div>
        </div>

        {/* Active Assignment (Only show if one exists) */}
        {progress?.current_incident_id && (
          <section className="bg-white/5 border border-white/10 rounded-lg overflow-hidden">
            <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-white/[0.02]">
              <div>
                <div className="flex items-center gap-2 text-white mb-1">
                  <Play className="h-4 w-4 fill-white" />
                  <h3 className="text-xl font-bold">Active Assignment</h3>
                </div>
                <p className="text-sm text-zinc-400 font-mono">
                  {progress.current_incident_title} ({progress.current_incident_id})
                </p>
              </div>
              <button 
                onClick={() => navigate('/incident')}
                className="bg-white text-zinc-950 px-6 py-2 rounded font-bold hover:bg-zinc-200 transition-colors shadow-lg shadow-white/10"
              >
                RESUME TERMINAL
              </button>
            </div>
          </section>
        )}

        {/* Incident Catalog */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <BookOpen className="h-5 w-5 text-zinc-400" />
            <h3 className="text-xl font-bold uppercase tracking-tighter">Incident Catalog</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {availableIncidents.map((incident) => {
              const isActive = progress?.current_incident_id === incident.id;
              
              return (
                <div 
                  key={incident.id}
                  className={`border rounded-lg p-6 transition-all ${
                    isActive 
                      ? 'bg-zinc-900 border-white/20 ring-1 ring-white/10' 
                      : 'bg-zinc-900/40 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="font-bold text-lg">{incident.title}</h4>
                      <p className="text-xs font-mono text-zinc-500">{incident.id}</p>
                    </div>
                    <span className={`text-[9px] px-2 py-0.5 rounded border uppercase font-bold ${
                      incident.difficulty === 'easy' ? 'text-green-400 border-green-900/50 bg-green-900/10' : 
                      incident.difficulty === 'medium' ? 'text-yellow-400 border-yellow-900/50 bg-yellow-900/10' : 
                      'text-red-400 border-red-900/50 bg-red-900/10'
                    }`}>
                      {incident.difficulty}
                    </span>
                  </div>
                  
                  <p className="text-sm text-zinc-400 mb-6 line-clamp-2 italic leading-relaxed">
                    "{incident.scenario.summary}"
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      <span className="text-[10px] bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded">FastAPI</span>
                      <span className="text-[10px] bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded">V1</span>
                    </div>
                    
                    <button
                      onClick={() => isActive ? navigate('/incident') : handleStartIncident(incident.id)}
                      disabled={isAssigning}
                      className={`text-xs px-4 py-1.5 rounded font-bold transition-all flex items-center gap-2 ${
                        isActive 
                          ? 'bg-white text-zinc-950' 
                          : 'bg-zinc-800 text-white hover:bg-zinc-700'
                      }`}
                    >
                      {isActive ? 'CONTINUE' : 'START SIMULATION'}
                    </button>
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
