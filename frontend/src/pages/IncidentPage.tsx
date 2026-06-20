import React, { useState, useEffect} from 'react';
import { useNavigate } from 'react-router-dom';
import { incidentService } from '../services/incidentService';
import { userService } from '../services/userService';
import type { IncidentCurrentResponse } from '../types/incident';
import type { UserProgress } from '../types/progress';
import {
  Terminal, FileCode, AlertCircle, HelpCircle, Loader2,
  CheckCircle2, XCircle, ChevronRight, ArrowLeft, TrendingUp, Award
} from 'lucide-react';
import Editor from '@monaco-editor/react';

interface SkillDelta {
  name: string;
  before: number;
  after: number;
  delta: number;
  llmScore: number;
}

interface SubmitResult {
  passed: boolean;
  score: number;
  feedback: string;
  skillDeltas: SkillDelta[];
}

const SkillBar: React.FC<{ skill: SkillDelta }> = ({ skill }) => {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setAnimate(true), 100);
    return () => clearTimeout(t);
  }, []);

  const beforePct = (skill.before / 10) * 100;
  const afterPct = (skill.after / 10) * 100;
  const llmPct = (skill.llmScore / 10) * 100;

  return (
    <div className="space-y-2">
      {/* Skill name + scores */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-zinc-200 capitalize">
          {skill.name.replace(/_/g, ' ')}
        </span>
        <div className="flex items-center gap-2 shrink-0">
          {/* LLM score for this attempt */}
          <span className="text-[10px] text-zinc-500 font-mono bg-zinc-800 px-1.5 py-0.5 rounded">
            this attempt: {skill.llmScore.toFixed(0)}/10
          </span>
          {/* Mastery change */}
          <span className="text-[10px] font-mono text-zinc-400">
            {skill.before.toFixed(1)}
          </span>
          <ChevronRight className="h-3 w-3 text-zinc-600" />
          <span className={`text-[10px] font-bold font-mono ${
            skill.delta > 0 ? 'text-green-400' : skill.delta < 0 ? 'text-red-400' : 'text-zinc-400'
          }`}>
            {skill.after.toFixed(1)}
          </span>
          {skill.delta !== 0 && (
            <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
              skill.delta > 0
                ? 'bg-green-900/40 text-green-400 border border-green-800/50'
                : 'bg-red-900/40 text-red-400 border border-red-800/50'
            }`}>
              {skill.delta > 0 ? '+' : ''}{skill.delta.toFixed(1)}
            </span>
          )}
        </div>
      </div>

      {/* Two-tone mastery bar */}
      <div className="relative w-full h-2 bg-zinc-800 rounded-full overflow-hidden flex">
        {/* Grey segment — previous mastery */}
        <div
          className="h-full bg-zinc-500 shrink-0"
          style={{ width: `${beforePct}%` }}
        />
        {/* White segment — the gain, animates width from 0 */}
        <div
          className={`h-full transition-all duration-700 ease-out shrink-0 ${
            skill.delta >= 0 ? 'bg-white' : 'bg-red-400'
          }`}
          style={{ width: animate ? `${Math.max(afterPct - beforePct, 0)}%` : '0%' }}
        />
        {/* Rest is bg-zinc-800 from parent */}
      </div>


      {/* LLM score bar — thin, shows what score the evaluator gave this attempt */}
      <div className="relative w-full h-1 bg-zinc-800/50 rounded-full overflow-hidden">
        <div
          className={`absolute top-0 left-0 h-full rounded-full transition-all duration-1000 delay-300 ease-out ${
            skill.llmScore >= 7 ? 'bg-green-500/60' :
            skill.llmScore >= 4 ? 'bg-yellow-500/60' : 'bg-red-500/60'
          }`}
          style={{ width: animate ? `${llmPct}%` : '0%' }}
        />
      </div>
      <div className="flex justify-between text-[9px] text-zinc-600">
        <span>mastery</span>
        <span>evaluator score</span>
      </div>
    </div>
  );
};

const IncidentPage: React.FC = () => {
  const navigate = useNavigate();
  const [incident, setIncident] = useState<IncidentCurrentResponse | null>(null);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContents, setFileContents] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [hints, setHints] = useState<{ level: number; text: string }[]>([]);
  const [isRequestingHint, setIsRequestingHint] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<SubmitResult | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  useEffect(() => { loadIncident(); }, []);

  useEffect(() => {
    if (submitResult) setIsPanelOpen(true);
  }, [submitResult]);

  const loadIncident = async () => {
    try {
      const data = await incidentService.getCurrentIncident();
      setIncident(data);
      setFileContents(data.files);
      setHints(data.hints || []);
      if (data.visible_files.length > 0) setSelectedFile(data.visible_files[0]);
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

  const handleSubmitFix = async () => {
    if (!incident || isSubmitting) return;
    setIsSubmitting(true);
    setSubmitResult(null);

    try {
      // Fetch skills BEFORE to compute delta
      let skillsBefore: UserProgress | null = null;
      try { skillsBefore = await userService.getProgressReport(); } catch {}

      const result = await incidentService.submitAttempt(incident.id, fileContents);
      console.log('SUBMIT RESULT:', JSON.stringify(result, null, 2));

      // Fetch skills AFTER
      let skillsAfter: UserProgress | null = null;
      try { skillsAfter = await userService.getProgressReport(); } catch {}

      // Build skill deltas using RAW LLM scores from result
      const skillDeltas: SkillDelta[] = [];
      if (skillsAfter && result.recommended_skill_updates) {
          Object.entries(result.recommended_skill_updates as Record<string, number>).forEach(([name, llmScore]) => {
              const beforeScore = skillsBefore?.skills[name]?.mastery ?? 0;
              const afterScore = skillsAfter?.skills[name]?.mastery ?? beforeScore;
              skillDeltas.push({
                  name,
                  before: beforeScore,
                  after: afterScore,
                  delta: afterScore - beforeScore,
                  llmScore,  // actual raw score the LLM gave, e.g. 9
              });
          });
      }

      setSubmitResult({
        passed: result.passed,
        score: result.score,
        feedback: result.feedback,
        skillDeltas,
      });
    } catch (err) {
      console.error('Failed to submit fix', err);
      setSubmitResult({
        passed: false,
        score: 0,
        feedback: 'Submission failed. Check your connection and try again.',
        skillDeltas: [],
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleContinue = () => {
    setIsPanelOpen(false);
    setTimeout(() => navigate('/dashboard'), 300);
  };

  const handleTryAgain = () => {
    setIsPanelOpen(false);
    setSubmitResult(null);
  };

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-zinc-950">
        <Loader2 className="animate-spin h-10 w-10 text-white" />
      </div>
    );
  }

  if (!incident) return (
    <div className="h-screen flex items-center justify-center bg-zinc-950 text-white">
      Error loading incident
    </div>
  );

  return (
    <div className="h-screen flex flex-col bg-zinc-950 text-zinc-100 overflow-hidden">
      {/* Header */}
      <header className="h-14 border-b border-zinc-800 flex items-center px-6 justify-between bg-zinc-900/50 shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-zinc-500 hover:text-white transition-colors p-1 rounded hover:bg-zinc-800"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <Terminal className="h-5 w-5 text-zinc-400" />
          <h1 className="font-bold tracking-tight text-sm uppercase">{incident.title}</h1>
          <span className={`text-[10px] px-2 py-0.5 rounded border uppercase font-bold ${
            incident.difficulty === 'easy'
              ? 'text-green-400 border-green-900/50'
              : incident.difficulty === 'medium'
              ? 'text-yellow-400 border-yellow-900/50'
              : 'text-red-400 border-red-900/50'
          }`}>
            {incident.difficulty}
          </span>
        </div>
        <button
          onClick={handleSubmitFix}
          disabled={isSubmitting}
          className="text-xs bg-white text-zinc-950 px-5 py-2 rounded font-bold hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isSubmitting ? (
            <><Loader2 className="animate-spin h-3 w-3" /> EVALUATING...</>
          ) : (
            'SUBMIT FIX'
          )}
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden relative">
        {/* Left Sidebar - File Explorer */}
        <aside className="w-56 border-r border-zinc-800 flex flex-col bg-zinc-900/20 shrink-0">
          <div className="px-4 py-3 border-b border-zinc-800 flex items-center gap-2 text-zinc-500">
            <FileCode className="h-3.5 w-3.5" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Explorer</span>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {incident.visible_files.map(file => (
              <button
                key={file}
                onClick={() => setSelectedFile(file)}
                className={`w-full text-left px-3 py-2 rounded text-xs transition-all mb-0.5 flex items-center gap-2 ${
                  selectedFile === file
                    ? 'bg-zinc-800 text-white font-medium'
                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/60'
                }`}
              >
                <div className={`w-1 h-1 rounded-full shrink-0 ${
                  selectedFile === file ? 'bg-white' : 'bg-zinc-700'
                }`} />
                <span className="truncate font-mono">{file}</span>
              </button>
            ))}
          </div>
        </aside>

        {/* Center - Monaco Editor */}
        <section className="flex-1 flex flex-col min-w-0">
          <div className="h-9 border-b border-zinc-800 flex items-center px-4 bg-zinc-900/30 shrink-0 gap-3">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/40" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/40" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-500/40" />
            </div>
            <span className="text-xs text-zinc-500 font-mono">{selectedFile}</span>
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
                fontSize: 13,
                fontFamily: '"Fira Code", "Cascadia Code", monospace',
                fontLigatures: true,
                lineHeight: 1.7,
                padding: { top: 16, bottom: 16 },
                scrollBeyondLastLine: false,
                automaticLayout: true,
                readOnly: isSubmitting,
                renderLineHighlight: 'gutter',
                cursorBlinking: 'smooth',
              }}
            />
          </div>
        </section>

        {/* Right Sidebar */}
        <aside className="w-80 border-l border-zinc-800 flex flex-col bg-zinc-900/20 shrink-0">
          {/* Scenario */}
          <div className="p-4 border-b border-zinc-800 space-y-3">
            <div className="flex items-center gap-2 text-zinc-500">
              <AlertCircle className="h-3.5 w-3.5" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Scenario</span>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed italic border-l-2 border-zinc-700 pl-3">
              {incident.scenario.summary}
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-zinc-900 border border-zinc-800/50 p-2 rounded">
                <span className="text-[9px] font-bold text-zinc-600 uppercase block mb-1">Service</span>
                <span className="text-[11px] text-zinc-300 truncate block font-mono">{incident.scenario.service}</span>
              </div>
              <div className="bg-zinc-900 border border-zinc-800/50 p-2 rounded">
                <span className="text-[9px] font-bold text-zinc-600 uppercase block mb-1">Severity</span>
                <span className={`text-[10px] font-bold uppercase ${
                  incident.scenario.severity === 'critical' ? 'text-red-400' :
                  incident.scenario.severity === 'high' ? 'text-orange-400' :
                  incident.scenario.severity === 'medium' ? 'text-yellow-400' : 'text-blue-400'
                }`}>
                  {incident.scenario.severity}
                </span>
              </div>
            </div>
          </div>

          {/* Hints */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2 text-zinc-500">
                <HelpCircle className="h-3.5 w-3.5" />
                <span className="text-[10px] font-bold uppercase tracking-widest">
                  Hints {hints.length > 0 && <span className="text-zinc-600">({hints.length})</span>}
                </span>
              </div>
              <button
                onClick={handleRequestHint}
                disabled={isRequestingHint || isSubmitting}
                className="text-[10px] bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-2.5 py-1 rounded transition-colors disabled:opacity-40"
              >
                {isRequestingHint ? 'LOADING...' : '+ GET HINT'}
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {hints.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center px-4 text-zinc-600">
                  <HelpCircle className="h-6 w-6 mb-2 opacity-20" />
                  <p className="text-[11px] italic">Stuck? Request a hint above.</p>
                </div>
              ) : (
                hints.map((hint) => (
                  <div key={hint.level} className="bg-zinc-900 border border-zinc-800 p-3 rounded">
                    <div className="text-[9px] font-bold text-zinc-500 uppercase mb-1.5">
                      Hint Level {hint.level}
                    </div>
                    <p className="text-xs text-zinc-300 leading-relaxed">{hint.text}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Error Logs */}
          <div className="h-56 border-t border-zinc-800 flex flex-col bg-black/60">
            <div className="px-4 py-2 border-b border-zinc-800 flex items-center gap-2 text-zinc-600 shrink-0">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500/60" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Error Logs</span>
            </div>
            <div className="flex-1 overflow-y-auto p-4 font-mono text-[11px] text-red-400/70 space-y-1.5">
              {incident.logs.map((log, i) => (
                <div key={i} className="whitespace-pre-wrap leading-relaxed">{log}</div>
              ))}
            </div>
          </div>
        </aside>

        {/* ── Slide-in Result Panel ── */}
        {/* Backdrop */}
        <div
          className={`absolute inset-0 bg-black/50 backdrop-blur-sm z-20 transition-opacity duration-300 ${
            isPanelOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          onClick={submitResult?.passed ? handleContinue : handleTryAgain}
        />

        {/* Panel */}
        <div className={`absolute top-0 right-0 h-full w-[440px] bg-zinc-900 border-l border-zinc-800 z-30 flex flex-col shadow-2xl transition-transform duration-300 ease-out ${
          isPanelOpen ? 'translate-x-0' : 'translate-x-full'
        }`}>
          {submitResult && (
            <>
              {/* Panel Header */}
              <div className={`p-6 border-b border-zinc-800 ${
                submitResult.passed ? 'bg-green-950/40' : 'bg-red-950/30'
              }`}>
                <div className="flex items-start gap-4">
                  {submitResult.passed
                    ? <CheckCircle2 className="h-9 w-9 text-green-400 shrink-0 mt-0.5" />
                    : <XCircle className="h-9 w-9 text-red-400 shrink-0 mt-0.5" />
                  }
                  <div className="flex-1">
                    <h2 className={`text-xl font-bold tracking-tight ${
                      submitResult.passed ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {submitResult.passed ? 'INCIDENT RESOLVED' : 'FIX FAILED'}
                    </h2>
                    <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                      {submitResult.passed
                        ? 'Root cause addressed. System restored.'
                        : 'Root cause not addressed. Review logs and try again.'}
                    </p>
                    {/* Confidence score */}
                    {submitResult.score > 0 && (
                      <div className="flex items-center gap-2 mt-3">
                        <Award className="h-3.5 w-3.5 text-zinc-400" />
                        <span className="text-[11px] text-zinc-400">
                          Evaluator confidence:
                          <span className={`ml-1 font-bold ${
                            submitResult.score >= 0.7 ? 'text-green-400' :
                            submitResult.score >= 0.4 ? 'text-yellow-400' : 'text-red-400'
                          }`}>
                            {Math.round(submitResult.score * 100)}%
                          </span>
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Panel Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-7">

                {/* Feedback */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <AlertCircle className="h-3.5 w-3.5 text-zinc-500" />
                    <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                      Evaluator Feedback
                    </h3>
                  </div>
                  <p className="text-sm text-zinc-300 leading-relaxed bg-zinc-800/40 border border-zinc-700/40 rounded-lg p-4">
                    {submitResult.feedback}
                  </p>
                </div>

                {/* Skill Growth */}
                {submitResult.skillDeltas.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <TrendingUp className="h-3.5 w-3.5 text-zinc-500" />
                      <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                        Skill Growth
                      </h3>
                    </div>
                    <div className="space-y-5">
                      {submitResult.skillDeltas.map((skill) => (
                        <SkillBar key={skill.name} skill={skill} />
                      ))}
                    </div>
                    {/* Legend */}
                    <div className="flex items-center gap-4 mt-5 pt-4 border-t border-zinc-800">
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-1.5 rounded-full bg-zinc-500" />
                        <span className="text-[9px] text-zinc-600 uppercase">Previous mastery</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-1.5 rounded-full bg-white" />
                        <span className="text-[9px] text-zinc-600 uppercase">New mastery</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-1 rounded-full bg-green-500/60" />
                        <span className="text-[9px] text-zinc-600 uppercase">Evaluator score</span>
                      </div>
                    </div>
                  </div>
                )}

                {submitResult.skillDeltas.length === 0 && (
                  <p className="text-xs text-zinc-600 italic text-center py-4">
                    No skill changes recorded for this attempt.
                  </p>
                )}
              </div>

              {/* Panel Footer */}
              <div className="p-5 border-t border-zinc-800 space-y-2.5">
                {submitResult.passed ? (
                  <button
                    onClick={handleContinue}
                    className="w-full bg-white text-zinc-950 py-2.5 rounded font-bold text-sm hover:bg-zinc-100 transition-colors flex items-center justify-center gap-2"
                  >
                    CONTINUE TO DASHBOARD
                    <ChevronRight className="h-4 w-4" />
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleTryAgain}
                      className="w-full bg-white text-zinc-950 py-2.5 rounded font-bold text-sm hover:bg-zinc-100 transition-colors"
                    >
                      TRY AGAIN
                    </button>
                    <button
                      onClick={() => navigate('/dashboard')}
                      className="w-full border border-zinc-700 text-zinc-400 py-2.5 rounded font-bold text-sm hover:border-zinc-500 hover:text-zinc-200 transition-colors"
                    >
                      BACK TO DASHBOARD
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default IncidentPage;