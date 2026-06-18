import React, { useState, useEffect } from 'react';
import { incidentService } from '../services/incidentService';
import type { IncidentCurrentResponse } from '../types/incident';
import { Terminal, FileCode, AlertCircle, HelpCircle, Loader2 } from 'lucide-react';
import Editor from '@monaco-editor/react';

const IncidentPage: React.FC = () => {
  const [incident, setIncident] = useState<IncidentCurrentResponse | null>(null);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContents, setFileContents] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [hints, setHints] = useState<{level: number, text: string}[]>([]);
  const [isRequestingHint, setIsRequestingHint] = useState(false);

  useEffect(() => {
    loadIncident();
  }, []);

  const loadIncident = async () => {
    try {
      const data = await incidentService.getCurrentIncident();
      setIncident(data);
      setFileContents(data.files);
      if (data.visible_files.length > 0) {
        setSelectedFile(data.visible_files[0]);
      }
    } catch (err) {
      console.error('Failed to load incident', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestHint = async () => {
    if (!incident) return;
    setIsRequestingHint(true);
    try {
      const hint = await incidentService.getHint(incident.id);
      // Only add if not already in list (some hints might repeat if exhausted)
      setHints(prev => {
        if (prev.find(h => h.level === hint.level)) return prev;
        return [...prev, hint];
      });
    } catch (err) {
      console.error('Failed to get hint', err);
    } finally {
      setIsRequestingHint(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-zinc-950">
        <Loader2 className="animate-spin h-10 w-10 text-white" />
      </div>
    );
  }

  if (!incident) return <div>Error loading incident</div>;

  return (
    <div className="h-screen flex flex-col bg-zinc-950 text-zinc-100 overflow-hidden">
      {/* Header */}
      <header className="h-14 border-b border-zinc-800 flex items-center px-6 justify-between bg-zinc-900/50 shrink-0">
        <div className="flex items-center gap-4">
          <Terminal className="h-5 w-5" />
          <h1 className="font-bold tracking-tight text-sm uppercase">{incident.title}</h1>
          <span className={`text-[10px] px-2 py-0.5 rounded border border-zinc-700 uppercase ${
            incident.difficulty === 'easy' ? 'text-green-400' : 
            incident.difficulty === 'medium' ? 'text-yellow-400' : 'text-red-400'
          }`}>
            {incident.difficulty}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <button className="text-xs bg-white text-zinc-950 px-4 py-1.5 rounded font-bold hover:bg-zinc-200 transition-colors">
            SUBMIT FIX
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - File Explorer */}
        <aside className="w-64 border-r border-zinc-800 flex flex-col bg-zinc-900/20 shrink-0">
          <div className="p-4 border-b border-zinc-800 flex items-center gap-2 text-zinc-400">
            <FileCode className="h-4 w-4" />
            <span className="text-xs font-bold uppercase tracking-widest">Explorer</span>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {incident.visible_files.map(file => (
              <button
                key={file}
                onClick={() => setSelectedFile(file)}
                className={`w-full text-left px-3 py-2 rounded text-sm transition-colors mb-1 flex items-center gap-2 ${
                  selectedFile === file ? 'bg-zinc-800 text-white font-medium' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900'
                }`}
              >
                <div className={`w-1 h-1 rounded-full ${selectedFile === file ? 'bg-white' : 'bg-transparent'}`} />
                {file}
              </button>
            ))}
          </div>
        </aside>

        {/* Center - Monaco Editor */}
        <section className="flex-1 flex flex-col min-w-0">
          <div className="h-10 border-b border-zinc-800 flex items-center px-4 bg-zinc-900/30 shrink-0">
            <span className="text-xs text-zinc-400 font-mono">{selectedFile}</span>
          </div>
          <div className="flex-1">
            <Editor
              height="100%"
              theme="vs-dark"
              path={selectedFile || ''}
              defaultLanguage="python"
              value={selectedFile ? fileContents[selectedFile] : ''}
              onChange={(value) => {
                if (selectedFile && value !== undefined) {
                  setFileContents(prev => ({ ...prev, [selectedFile]: value }));
                }
              }}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                fontFamily: 'Fira Code, monospace',
                lineHeight: 1.6,
                padding: { top: 20 },
                scrollBeyondLastLine: false,
                automaticLayout: true,
              }}
            />
          </div>
        </section>

        {/* Right Sidebar - Info, Hints & Logs */}
        <aside className="w-80 border-l border-zinc-800 flex flex-col bg-zinc-900/20 shrink-0">
          {/* Scenario Info */}
          <div className="p-4 border-b border-zinc-800">
            <div className="flex items-center gap-2 text-zinc-400 mb-2">
              <AlertCircle className="h-4 w-4" />
              <span className="text-xs font-bold uppercase tracking-widest">Scenario</span>
            </div>
            <p className="text-sm text-zinc-300 leading-relaxed italic border-l-2 border-zinc-700 pl-3">
              "{incident.scenario.summary}"
            </p>
          </div>

          {/* Hints Panel */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/40">
              <div className="flex items-center gap-2 text-zinc-400">
                <HelpCircle className="h-4 w-4" />
                <span className="text-xs font-bold uppercase tracking-widest">Hints</span>
              </div>
              <button 
                onClick={handleRequestHint}
                disabled={isRequestingHint}
                className="text-[10px] bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-2 py-1 rounded transition-colors disabled:opacity-50"
              >
                {isRequestingHint ? 'REQUESTING...' : 'GET HINT'}
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {hints.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-zinc-600 text-center px-4">
                  <HelpCircle className="h-8 w-8 mb-2 opacity-20" />
                  <p className="text-xs italic">No hints requested yet. Stuck? Click the button above.</p>
                </div>
              )}
              {hints.map((hint) => (
                <div key={hint.level} className="bg-zinc-900 border border-zinc-800 p-3 rounded shadow-sm">
                  <div className="text-[9px] font-bold text-zinc-500 uppercase mb-1">Level {hint.level}</div>
                  <p className="text-xs text-zinc-300">{hint.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Logs Panel */}
          <div className="h-64 border-t border-zinc-800 flex flex-col bg-black">
            <div className="px-4 py-2 border-b border-zinc-800 flex items-center gap-2 text-zinc-500 bg-zinc-900/50 shrink-0">
              <div className="w-2 h-2 rounded-full bg-red-500/50" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Error Logs</span>
            </div>
            <div className="flex-1 overflow-y-auto p-4 font-mono text-[11px] text-red-400/80 space-y-1">
              {incident.logs.map((log, i) => (
                <div key={i} className="whitespace-pre-wrap">{log}</div>
              ))}
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
};

export default IncidentPage;
