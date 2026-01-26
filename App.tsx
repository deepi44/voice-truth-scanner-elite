
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Role, 
  AppStatus, 
  AnalysisResult, 
  SupportedLanguage, 
  LANGUAGE_LOCALES,
  AnalysisLayers
} from './types';
import { analyzeForensicAudio } from './services/geminiService';
import Waveform from './components/Waveform';
import RiskMeter from './components/RiskMeter';
import AnalysisLayer from './components/AnalysisLayer';
import { 
  Shield, Upload, Mic, Trash2, Download, AlertTriangle, 
  Info, Languages, Lock, User, Fingerprint, LogOut, 
  Zap, Activity, BarChart3, Users, 
  Globe, Clock, ChevronRight, FileText, Target, Crosshair, Radar
} from 'lucide-react';

// STRICT CREDENTIALS
const CREDENTIALS = {
  ADMIN: { email: 'admin@truthscanner.ai', password: 'admin123' },
  USER: { email: 'user@truthscanner.ai', password: 'user123' }
};

const App: React.FC = () => {
  // Auth & Role
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [role, setRole] = useState<Role>('USER');
  const [loginEmail, setLoginEmail] = useState(CREDENTIALS.USER.email);
  const [loginPassword, setLoginPassword] = useState(CREDENTIALS.USER.password);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // App State
  const [status, setStatus] = useState<AppStatus>('IDLE');
  const [language, setLanguage] = useState<SupportedLanguage>('English');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [audioFile, setAudioFile] = useState<File | Blob | null>(null);
  const [history, setHistory] = useState<AnalysisResult[]>([]);

  // Refs
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const audioChunksRef = React.useRef<Blob[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('forensic_history');
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  const saveToHistory = (newResult: AnalysisResult) => {
    const updated = [newResult, ...history].slice(0, 50);
    setHistory(updated);
    localStorage.setItem('forensic_history', JSON.stringify(updated));
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsLoggingIn(true);

    setTimeout(() => {
      const email = loginEmail.toLowerCase().trim();
      const password = loginPassword;

      if (email === CREDENTIALS.ADMIN.email && password === CREDENTIALS.ADMIN.password) {
        setUserEmail(email);
        setRole('ADMIN');
      } else if (email === CREDENTIALS.USER.email && password === CREDENTIALS.USER.password) {
        setUserEmail(email);
        setRole('USER');
      } else {
        setAuthError('ACCESS DENIED: INVALID CREDENTIALS');
      }
      setIsLoggingIn(false);
    }, 1200);
  };

  const handleLogout = () => {
    setUserEmail(null);
    setResult(null);
    setAudioFile(null);
    setStatus('IDLE');
    setLoginPassword('');
    setLoginEmail('');
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => audioChunksRef.current.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/mp3' });
        setAudioFile(blob);
        stream.getTracks().forEach(t => t.stop());
      };
      recorder.start();
      setStatus('RECORDING');
    } catch (err) {
      alert("Mic Access Required for Forensic Capture.");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setStatus('IDLE');
  };

  const runAnalysis = async () => {
    if (!audioFile) return;
    setStatus('ANALYZING');
    setResult(null); // Clear previous result immediately
    try {
      const rawResult = await analyzeForensicAudio(audioFile, language);
      const enrichedResult: AnalysisResult = {
        ...rawResult,
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        operator: userEmail || 'Unknown'
      };
      setResult(enrichedResult);
      if (enrichedResult.language_match) {
        saveToHistory(enrichedResult);
      }
      setStatus('COMPLETED');
    } catch (err) {
      setStatus('ERROR');
    }
  };

  if (!userEmail) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-black">
        <div className="w-full max-w-md p-8 md:p-10 rounded-[2.5rem] border border-indigo-500/20 bg-slate-900/40 backdrop-blur-3xl shadow-2xl shadow-indigo-500/10 transition-all duration-500">
          <div className="flex flex-col items-center gap-6 mb-10">
            <div className="p-6 rounded-[2rem] bg-indigo-600 text-white shadow-xl shadow-indigo-600/20">
              <Shield className="w-12 h-12" />
            </div>
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-bold font-futuristic tracking-[0.2em] uppercase text-white">
                VOICE TRUTH SCANNER
              </h1>
              <p className="text-[10px] tracking-[0.4em] font-black uppercase text-indigo-400/60">
                ELITE FORENSIC ACCESS
              </p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest font-black px-1 text-indigo-400">Security ID (Email)</label>
                <div className="relative group">
                  <User className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                  <input 
                    type="email" 
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="operator@truthscanner.ai"
                    className="w-full border rounded-2xl py-4 pl-14 pr-6 text-sm bg-black/50 border-slate-700/50 text-white focus:border-indigo-500 outline-none transition-all"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest font-black px-1 text-indigo-400">Authorization Code</label>
                <div className="relative group">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                  <input 
                    type="password" 
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full border rounded-2xl py-4 pl-14 pr-6 text-sm bg-black/50 border-slate-700/50 text-white focus:border-indigo-500 outline-none transition-all"
                    required
                  />
                </div>
              </div>
            </div>

            {authError && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-widest text-center animate-pulse">
                {authError}
              </div>
            )}

            <button 
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-5 rounded-2xl font-black uppercase tracking-[0.3em] flex items-center justify-center gap-4 transition-all shadow-xl active:scale-95 bg-indigo-600 hover:bg-indigo-500 text-white"
            >
              {isLoggingIn ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <Fingerprint className="w-6 h-6" />
                  AUTHORIZE
                </>
              )}
            </button>
          </form>
          
          <div className="mt-8 pt-6 border-t border-slate-800/50 text-center">
            <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest">
              Standard Credentials: user@truthscanner.ai / user123
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* GLOBAL HEADER */}
      <header className="sticky top-0 z-50 backdrop-blur-xl border-b bg-black/80 border-slate-800">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl shadow-lg bg-indigo-600 text-white">
              <Shield className="w-6 h-6" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold font-futuristic tracking-widest uppercase">
                TRUTH SCANNER ELITE
              </h1>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full animate-pulse ${role === 'ADMIN' ? 'bg-amber-500' : 'bg-emerald-500'}`}></div>
                <span className="text-[9px] font-black uppercase tracking-tighter opacity-60">
                  {role} SESSION: {userEmail}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all border bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden xs:inline">Disconnect</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-6 lg:p-10 flex flex-col gap-10">
        {role === 'ADMIN' ? (
          <AdminDashboard history={history} />
        ) : (
          <UserDashboard 
            status={status} 
            setStatus={setStatus}
            language={language}
            setLanguage={setLanguage}
            audioFile={audioFile}
            setAudioFile={setAudioFile}
            result={result}
            runAnalysis={runAnalysis}
            startRecording={startRecording}
            stopRecording={stopRecording}
            reset={() => { setResult(null); setAudioFile(null); setStatus('IDLE'); }}
          />
        )}
      </main>

      <footer className="mt-auto border-t py-12 bg-slate-900/30 border-slate-800 text-slate-500">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6 text-[10px] font-black uppercase tracking-[0.3em]">
          <div className="flex items-center gap-4">
            <Zap className="w-4 h-4 text-indigo-500" />
            <span>Forensic Engine v4.0.2 Stable</span>
          </div>
          <div className="flex gap-8">
            <span className="hover:text-indigo-400 cursor-pointer">Security Protocol</span>
            <span className="hover:text-indigo-400 cursor-pointer">Privacy</span>
          </div>
          <span>© 2026 TRUTH SCANNER LABS</span>
        </div>
      </footer>
    </div>
  );
};

// --- REDESIGNED EQUALIZED DASHBOARD ---
const UserDashboard: React.FC<any> = ({ 
  status, language, setLanguage, audioFile, setAudioFile, result, 
  runAnalysis, startRecording, stopRecording, reset 
}) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const isMismatch = result && !result.language_match;

  return (
    <div className="flex flex-col gap-10">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-stretch">
        {/* EQUAL BOX 1: CAPTURE CONSOLE */}
        <section className="flex flex-col p-1 rounded-[3.5rem] bg-gradient-to-br from-indigo-500/20 via-slate-800/40 to-indigo-500/5 shadow-2xl relative min-h-full">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <Radar className="w-32 h-32 animate-spin-slow" />
          </div>
          
          <div className="flex-1 bg-slate-950 p-6 md:p-10 rounded-[3.4rem] border border-slate-800/50 relative overflow-hidden flex flex-col justify-between">
            {/* Decoration */}
            <div className="absolute top-6 left-6 flex gap-1">
              <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse"></div>
              <div className="w-1.5 h-1.5 bg-indigo-500/50 rounded-full animate-pulse delay-75"></div>
              <div className="w-1.5 h-1.5 bg-indigo-500/20 rounded-full animate-pulse delay-150"></div>
            </div>
            
            <div className="space-y-10">
              <div className="flex justify-between items-center mt-4">
                <div className="space-y-1">
                  <h2 className="text-xl font-bold font-futuristic uppercase tracking-[0.2em] text-white">CAPTURE CONSOLE</h2>
                  <p className="text-[9px] font-black text-indigo-400/60 tracking-[0.4em] uppercase">Acoustic Lens Active</p>
                </div>
                <div className="flex items-center gap-3 px-4 py-2 rounded-xl border bg-slate-800 border-slate-700 text-indigo-400 transition-colors">
                  <Globe className="w-4 h-4" />
                  <select 
                    value={language} 
                    onChange={(e) => setLanguage(e.target.value as SupportedLanguage)} 
                    className="bg-transparent text-[11px] font-black uppercase outline-none cursor-pointer"
                  >
                    {Object.keys(LANGUAGE_LOCALES).map(lang => (
                      <option key={lang} value={lang} className="bg-slate-950 text-white">{lang}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center justify-center opacity-10">
                  <Target className="w-24 h-24 text-indigo-500" />
                </div>
                <div className="p-8 rounded-[2rem] bg-black/40 border border-slate-800/40 backdrop-blur-md h-36 flex items-center justify-center shadow-inner relative z-10">
                  <Waveform isRecording={status === 'RECORDING'} isActive={status !== 'IDLE'} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <button 
                  onClick={status === 'RECORDING' ? stopRecording : startRecording} 
                  disabled={status === 'ANALYZING'}
                  className={`group flex flex-col items-center gap-4 py-8 rounded-[2.5rem] border-2 transition-all font-black uppercase text-[10px] tracking-widest relative overflow-hidden ${
                    status === 'RECORDING' 
                      ? 'bg-red-500/20 border-red-500 text-red-500 animate-pulse' 
                      : 'bg-indigo-600/5 border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/10 hover:border-indigo-500/40'
                  }`}
                >
                  <Mic className="w-8 h-8 relative z-10" />
                  <span className="relative z-10">{status === 'RECORDING' ? 'Stop Capture' : 'Live Stream'}</span>
                </button>

                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={status === 'ANALYZING'}
                  className="group flex flex-col items-center gap-4 py-8 rounded-[2.5rem] border-2 bg-slate-800/30 border-slate-700 text-slate-500 hover:border-slate-500 hover:text-slate-300 transition-all font-black uppercase text-[10px] tracking-widest"
                >
                  <Upload className="w-8 h-8" />
                  <span>Import File</span>
                </button>
                <input 
                  ref={fileInputRef} 
                  type="file" 
                  accept="audio/*" 
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setAudioFile(file);
                  }} 
                  className="hidden" 
                />
              </div>
            </div>

            {audioFile && (
              <div className="mt-8 p-6 md:p-8 rounded-[2.5rem] border bg-indigo-500/5 border-indigo-500/20 transition-all animate-in slide-in-from-top-4">
                <div className="flex items-center gap-4 md:gap-6 mb-8">
                  <div className="p-3 md:p-4 rounded-xl bg-indigo-600/20 border border-indigo-500/20">
                    <FileText className="w-5 h-5 md:w-6 md:h-6 text-indigo-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black uppercase truncate text-white">{audioFile instanceof File ? audioFile.name : 'Voice_Capture_01.mp3'}</p>
                    <p className="text-[10px] uppercase tracking-widest text-indigo-400/40 font-bold">Buffer Ready</p>
                  </div>
                  <button onClick={reset} className="p-3 text-slate-500 hover:text-red-500 transition-colors">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
                <button 
                  onClick={runAnalysis}
                  disabled={status === 'ANALYZING'}
                  className="w-full py-5 rounded-2xl text-[12px] font-black uppercase tracking-[0.3em] transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3 bg-indigo-600 text-white hover:bg-indigo-500 shadow-indigo-600/20"
                >
                  {status === 'ANALYZING' ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      EXECUTING SCAN...
                    </>
                  ) : (
                    <>
                      <Zap className="w-5 h-5" />
                      INITIATE SCAN
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </section>

        {/* EQUAL BOX 2: TRUTH MATRIX OVERVIEW */}
        <section className="flex flex-col p-1 rounded-[3.5rem] bg-gradient-to-br from-indigo-500/20 via-slate-800/40 to-indigo-500/5 shadow-2xl min-h-full relative overflow-hidden">
          {isMismatch && (
            <div className="absolute inset-0 z-20 bg-black/60 backdrop-blur-sm flex items-center justify-center p-10 animate-in fade-in zoom-in duration-300">
               <div className="p-10 rounded-[3rem] border border-amber-500/50 bg-slate-950 text-amber-500 text-center space-y-6 shadow-2xl shadow-amber-500/20">
                 <Languages className="w-16 h-16 mx-auto animate-bounce" />
                 <h3 className="text-2xl font-black font-futuristic uppercase tracking-[0.2em]">MISMATCH DETECTED</h3>
                 <p className="text-sm font-bold uppercase tracking-widest leading-relaxed">
                   Mismatched audio or language detected. <br/>
                   Expected <span className="text-white bg-amber-600/20 px-2 rounded">{language}</span>, but detected <span className="text-white bg-amber-600/20 px-2 rounded">{result.detected_language}</span>.
                 </p>
                 <button onClick={reset} className="px-8 py-3 rounded-xl bg-amber-500 text-black font-black uppercase text-[10px] tracking-widest hover:bg-amber-400 transition-colors shadow-lg">
                   RECALIBRATE CONSOLE
                 </button>
               </div>
            </div>
          )}
          
          <div className="flex-1 p-6 md:p-14 rounded-[3.4rem] border border-slate-800 bg-slate-900/40 backdrop-blur-3xl relative overflow-hidden flex flex-col justify-center gap-10">
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-600/5 rounded-full blur-3xl transition-colors"></div>
            
            <div className="flex flex-col items-center xl:flex-row gap-10">
              <div className="w-full max-w-[280px]">
                <RiskMeter score={result && result.language_match ? result.confidence_score : 0} level={result && result.language_match ? result.fraud_risk_level : 'LOW'} />
              </div>
              <div className="flex-1 text-center xl:text-left space-y-6">
                <div className="flex items-center justify-center xl:justify-start gap-4">
                  <div className="w-12 h-0.5 bg-indigo-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]"></div>
                  <h2 className="text-3xl font-bold font-futuristic tracking-widest uppercase text-white">Truth Matrix</h2>
                </div>
                <p className="text-xs leading-relaxed max-w-lg mx-auto xl:mx-0 text-slate-500 uppercase font-bold tracking-wider">
                  Executing multi-layered bio-acoustic signal scans across decentralized forensic nodes.
                </p>
                {result && result.language_match && (
                  <button className="inline-flex items-center gap-4 px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20">
                    <Download className="w-4 h-4" />
                    EXPORT DOSSIER
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 md:gap-6">
               <AnalysisLayer label="Spatial" tamilLabel="இடம்" description={result?.analysis_layers.spatial_acoustics || ''} isProcessing={status === 'ANALYZING'} isCompleted={!!result && result.language_match} delay={0} />
               <AnalysisLayer label="Emotional" tamilLabel="உணர்ச்சி" description={result?.analysis_layers.emotional_micro_dynamics || ''} isProcessing={status === 'ANALYZING'} isCompleted={!!result && result.language_match} delay={200} />
               <AnalysisLayer label="Breath" tamilLabel="சுவாசம்" description={result?.analysis_layers.breath_emotion_sync || ''} isProcessing={status === 'ANALYZING'} isCompleted={!!result && result.language_match} delay={400} />
               <AnalysisLayer label="Digital" tamilLabel="தடயங்கள்" description={result?.analysis_layers.spectral_artifacts || ''} isProcessing={status === 'ANALYZING'} isCompleted={!!result && result.language_match} delay={600} />
            </div>
          </div>
        </section>
      </div>

      {/* NOTIFICATIONS & EXTENDED VERDICT (FULL WIDTH BELOW EQUAL BOXES) */}
      <div className="grid grid-cols-1 gap-10">
        {result && result.language_match && (
          <div className={`p-8 md:p-12 rounded-[3.5rem] border-2 transition-all animate-in zoom-in-95 bg-slate-950 shadow-2xl ${
            result.classification === 'AI_GENERATED' 
              ? 'border-red-500/40 text-red-400 shadow-red-500/5' 
              : 'border-emerald-500/40 text-emerald-400 shadow-emerald-500/5'
          }`}>
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="text-center md:text-left space-y-2">
                <p className="text-[10px] uppercase font-black tracking-[0.4em] opacity-70">
                  Final Verdict
                </p>
                <h3 className="text-4xl md:text-5xl font-black font-futuristic tracking-tighter uppercase leading-none">
                  {result.classification === 'AI_GENERATED' 
                    ? 'AI FRAUD DETECTED' 
                    : 'ORIGINAL HUMAN'}
                </h3>
              </div>
              <div className="p-8 rounded-[2.5rem] bg-current opacity-10 hidden md:block">
                {result.classification === 'AI_GENERATED' 
                    ? <AlertTriangle className="w-12 h-12" /> 
                    : <Shield className="w-12 h-12" />}
              </div>
            </div>
            
            <div className="mt-10 pt-10 border-t border-current/10">
                <div className="flex flex-col md:flex-row gap-10 items-start">
                   <p className="flex-1 text-lg leading-relaxed italic opacity-90 font-medium text-center md:text-left">
                    "{result.forensic_report}"
                  </p>
                  <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center">
                      <p className="text-[9px] font-black opacity-40 uppercase mb-1">Confidence</p>
                      <p className="text-xl font-black">{Math.round(result.confidence_score * 100)}%</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center">
                      <p className="text-[9px] font-black opacity-40 uppercase mb-1">Risk</p>
                      <p className={`text-xl font-black ${result.fraud_risk_level === 'HIGH' ? 'text-red-500' : 'text-emerald-500'}`}>{result.fraud_risk_level}</p>
                    </div>
                  </div>
                </div>
            </div>
          </div>
        )}

        <div className="p-10 rounded-[3rem] border border-slate-800 bg-slate-900/30 flex flex-col md:flex-row items-center gap-8 shadow-sm">
          <div className="p-4 rounded-xl bg-indigo-500/10 text-indigo-500">
            <Info className="w-8 h-8" />
          </div>
          <div className="flex-1 space-y-2 text-center md:text-left">
            <h4 className="text-xs font-black uppercase tracking-widest text-indigo-500">System Integrity Protocol</h4>
            <p className="text-[11px] font-bold uppercase tracking-wider leading-relaxed opacity-60 text-slate-400 max-w-4xl">
              All forensic analysis is volatile. Data is purged automatically upon session termination. Unauthorized export of proprietary spectral fingerprints is strictly prohibited by Truth Scanner Labs security ordinance.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- ADMIN DASHBOARD ---
const AdminDashboard: React.FC<{ history: AnalysisResult[] }> = ({ history }) => {
  const stats = useMemo(() => {
    const total = history.length;
    const fraud = history.filter(h => h.classification === 'AI_GENERATED').length;
    const human = total - fraud;
    const highRisk = history.filter(h => h.fraud_risk_level === 'HIGH').length;
    return { total, fraud, human, highRisk };
  }, [history]);

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-end gap-6">
        <div className="space-y-2">
          <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-60">System Oversight</p>
          <h2 className="text-4xl font-black font-futuristic tracking-widest uppercase text-white">Platform Analytics</h2>
        </div>
        <div className="flex gap-4">
          <button className="px-6 py-3 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-[11px] font-black uppercase tracking-widest flex items-center gap-3 transition-all text-white">
            <Globe className="w-4 h-4 text-indigo-500" /> Global Reports
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <AdminStatCard icon={<Activity className="w-6 h-6" />} label="Total Scans" value={stats.total} trend="+12% today" color="indigo" />
        <AdminStatCard icon={<AlertTriangle className="w-6 h-6" />} label="AI Frauds" value={stats.fraud} trend="8% detection rate" color="red" />
        <AdminStatCard icon={<Shield className="w-6 h-6" />} label="Humans Verified" value={stats.human} trend="Trust baseline" color="emerald" />
        <AdminStatCard icon={<Users className="w-6 h-6" />} label="High Risk Logs" value={stats.highRisk} trend="Alert state" color="amber" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 p-10 rounded-[3rem] border border-slate-800 bg-slate-900/40 shadow-2xl overflow-hidden relative">
          <div className="absolute top-0 right-0 p-8 opacity-[0.02] pointer-events-none">
            <Radar className="w-64 h-64" />
          </div>
          
          <div className="flex justify-between items-center mb-10 relative z-10">
            <h3 className="text-lg font-bold font-futuristic uppercase tracking-widest flex items-center gap-4 text-white">
              <BarChart3 className="w-5 h-5 text-indigo-500" /> Recent Forensic Logs
            </h3>
            <span className="text-[10px] font-black opacity-50 uppercase tracking-widest text-indigo-400">Real-time Stream</span>
          </div>
          
          <div className="overflow-x-auto relative z-10">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-800/50 text-[10px] font-black uppercase tracking-widest opacity-40 text-slate-400">
                  <th className="pb-4 pr-4">Timestamp</th>
                  <th className="pb-4 pr-4">Operator</th>
                  <th className="pb-4 pr-4 text-center">Verdict</th>
                  <th className="pb-4 pr-4 text-center">Score</th>
                  <th className="pb-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/20">
                {history.length > 0 ? history.map(log => (
                  <tr key={log.id} className="group hover:bg-white/5 transition-colors">
                    <td className="py-6 pr-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <Clock className="w-4 h-4 opacity-30 text-indigo-400" />
                        <span className="text-[11px] font-bold opacity-70 uppercase tracking-tighter text-white">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    </td>
                    <td className="py-6 pr-4">
                      <span className="text-xs font-bold opacity-80 text-slate-300">{log.operator}</span>
                    </td>
                    <td className="py-6 pr-4 text-center">
                      <span className={`inline-block px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                        log.classification === 'AI_GENERATED' ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'
                      }`}>
                        {log.classification.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-6 pr-4 text-center">
                      <span className="text-xs font-black text-white">{Math.round(log.confidence_score * 100)}%</span>
                    </td>
                    <td className="py-6 text-right">
                      <button className="p-2 opacity-30 hover:opacity-100 hover:text-indigo-400 transition-all">
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} className="py-20 text-center text-slate-500 font-bold uppercase tracking-widest text-xs">
                      No forensic logs detected in current cycle.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-10">
          <div className="p-10 rounded-[3rem] border border-slate-800 bg-slate-900/40">
            <h3 className="text-lg font-bold font-futuristic uppercase tracking-widest mb-10 flex items-center gap-4 text-white">
              <Globe className="w-5 h-5 text-indigo-500" /> Language Node Usage
            </h3>
            <div className="space-y-8">
              {['English', 'Tamil', 'Hindi', 'Telugu'].map(lang => (
                <div key={lang} className="space-y-3">
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <span>{lang} Node</span>
                    <span>{Math.floor(Math.random() * 80 + 20)}%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-800/50 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500" style={{ width: `${Math.random() * 60 + 20}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-10 rounded-[3rem] border border-indigo-500/20 bg-indigo-600 text-white shadow-2xl shadow-indigo-600/20">
            <div className="flex items-center gap-4 mb-8">
              <Zap className="w-8 h-8" />
              <h3 className="text-xl font-black font-futuristic tracking-widest uppercase">Intel Insights</h3>
            </div>
            <p className="text-xs font-bold leading-relaxed opacity-90 uppercase tracking-widest">
              AI Deepfake detection accuracy has increased by 4.2% in the last 24 hours. Voice frequency anomalies in Tamil audio signals suggest a new model of synthetic speech being used in local regions.
            </p>
            <button className="mt-8 w-full py-4 rounded-xl bg-white text-indigo-600 text-[11px] font-black uppercase tracking-widest hover:bg-slate-100 transition-colors">
              Read Detailed Brief
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const AdminStatCard: React.FC<any> = ({ icon, label, value, trend, color }) => {
  const colorMap: any = {
    indigo: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20',
    red: 'text-red-500 bg-red-500/10 border-red-500/20',
    emerald: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
    amber: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
  };

  return (
    <div className="p-8 rounded-[2.5rem] border border-slate-800 bg-slate-900/40 transition-all duration-500">
      <div className={`p-4 rounded-2xl inline-block mb-6 border ${colorMap[color]}`}>
        {icon}
      </div>
      <div className="space-y-1">
        <p className="text-[10px] font-black uppercase tracking-widest opacity-50 text-slate-400">{label}</p>
        <h4 className="text-3xl font-black font-futuristic text-white">{value}</h4>
      </div>
      <div className="mt-6 pt-6 border-t border-slate-800/20">
        <span className="text-[10px] font-black uppercase tracking-tighter text-emerald-500">{trend}</span>
      </div>
    </div>
  );
};

export default App;
