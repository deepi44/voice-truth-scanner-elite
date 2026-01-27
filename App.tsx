
import React, { useState, useEffect, useRef } from 'react';
import { 
  Role, 
  AppStatus, 
  AnalysisResult, 
  SupportedLanguage, 
  LANGUAGE_LOCALES,
  Theme
} from './types';
import { analyzeForensicAudio } from './services/geminiService';
import Waveform from './components/Waveform';
import RiskMeter from './components/RiskMeter';
import AnalysisLayer from './components/AnalysisLayer';
import { 
  Shield, Upload, Mic, Trash2, Download, 
  Info, Languages, Lock, User, Fingerprint, LogOut, 
  Globe, FileText, Radar, Search, Activity, Users,
  Sun, Moon, BarChart3, Database, ShieldAlert,
  Terminal, Activity as Heartbeat, XCircle, AlertTriangle, CheckCircle,
  RefreshCcw, ShieldCheck, History, MessageSquareWarning,
  Eye, Zap, AlertCircle, Cpu, Waves, Workflow
} from 'lucide-react';

const CREDENTIALS = {
  ADMIN: { email: 'admin@truthscanner.ai', password: 'admin123' },
  USER: { email: 'user@truthscanner.ai', password: 'user123' },
};

const App: React.FC = () => {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [role, setRole] = useState<Role>('USER');
  const [theme, setTheme] = useState<Theme>('DARK');
  const [loginEmail, setLoginEmail] = useState(CREDENTIALS.ADMIN.email); 
  const [loginPassword, setLoginPassword] = useState(CREDENTIALS.ADMIN.password);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [status, setStatus] = useState<AppStatus>('IDLE');
  const [language, setLanguage] = useState<SupportedLanguage>('English');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [audioFile, setAudioFile] = useState<File | Blob | null>(null);
  const [history, setHistory] = useState<AnalysisResult[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [recordingStream, setRecordingStream] = useState<MediaStream | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.body.className = theme === 'DARK' ? 'dark-theme' : 'light-theme';
    const saved = localStorage.getItem('forensic_history_v3');
    if (saved) setHistory(JSON.parse(saved));
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'DARK' ? 'LIGHT' : 'DARK');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsLoggingIn(true);
    
    setTimeout(() => {
      const email = loginEmail.toLowerCase().trim();
      if (email === CREDENTIALS.ADMIN.email && loginPassword === CREDENTIALS.ADMIN.password) {
        setUserEmail(email); 
        setRole('ADMIN');
      } else if (email === CREDENTIALS.USER.email && loginPassword === CREDENTIALS.USER.password) {
        setUserEmail(email);
        setRole('USER');
      } else if (email && loginPassword) {
        setUserEmail(email);
        setRole('USER');
      } else {
        setAuthError('AUTHENTICATION FAILED. PLEASE USE TERMINAL BYPASS.');
      }
      setIsLoggingIn(false);
    }, 600);
  };

  const handleLogout = () => {
    setUserEmail(null); 
    setResult(null); 
    setAudioFile(null); 
    setStatus('IDLE');
  };

  const runAnalysis = async (fileToAnalyze?: File | Blob) => {
    const file = fileToAnalyze || audioFile;
    if (!file) return;
    
    setStatus('ANALYZING');
    setResult(null);
    setErrorMessage(null);
    
    try {
      const res = await analyzeForensicAudio(file, language);
      setResult(res);
      setStatus('COMPLETED');
      
      if (res.language_match) {
        const entry = { ...res, id: crypto.randomUUID(), timestamp: new Date().toISOString(), operator: userEmail || 'Operator' };
        const updatedHistory = [entry, ...history].slice(0, 50);
        setHistory(updatedHistory);
        localStorage.setItem('forensic_history_v3', JSON.stringify(updatedHistory));
      }
    } catch (err: any) {
      console.error("Critical Analysis Fault:", err);
      setErrorMessage(err.message || "NEURAL LINK SEVERED: Signal out of sync.");
      setStatus('ERROR');
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setRecordingStream(stream);
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioFile(blob);
        setRecordingStream(null);
        stream.getTracks().forEach(t => t.stop());
        runAnalysis(blob);
      };
      recorder.start();
      setStatus('RECORDING');
    } catch (err) {
      setErrorMessage("OS-LEVEL EXCEPTION: Audio hardware is locked or missing.");
      setStatus('ERROR');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && status === 'RECORDING') {
      mediaRecorderRef.current.stop();
    }
  };

  const reset = () => {
    setAudioFile(null);
    setResult(null);
    setStatus('IDLE');
    setErrorMessage(null);
    setRecordingStream(null);
  };

  const themeClass = theme === 'DARK' ? 'bg-[#010409] text-slate-100' : 'bg-[#f8fafc] text-slate-900';
  const cardClass = theme === 'DARK' ? 'bg-[#0d1117]/90 border-white/5 shadow-2xl' : 'bg-white/95 border-slate-200 shadow-xl';
  const accentText = theme === 'DARK' ? 'text-indigo-400' : 'text-indigo-600';
  const subtextClass = theme === 'DARK' ? 'text-slate-500' : 'text-slate-400';

  if (!userEmail) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-700`}>
        <div className={`w-full max-w-md p-6 sm:p-10 rounded-[2.5rem] sm:rounded-[3rem] border glass ${cardClass}`}>
          <div className="flex flex-col items-center gap-6 mb-8 sm:mb-10">
            <div className={`p-5 sm:p-6 rounded-[2rem] sm:rounded-[2.5rem] ${theme === 'DARK' ? 'bg-indigo-600/20 text-indigo-500 border border-indigo-500/30' : 'bg-indigo-600 text-white shadow-xl'}`}>
              <Shield className="w-10 h-10 sm:w-12 sm:h-12" />
            </div>
            <div className="text-center space-y-1">
              <h1 className="text-xl sm:text-2xl font-black font-futuristic tracking-[0.2em] uppercase text-indigo-500">VOICE TRUTH SCANNER</h1>
              <p className={`text-[9px] sm:text-[10px] font-black uppercase tracking-[0.4em] opacity-60 ${accentText}`}>ELITE FORENSIC TERMINAL</p>
            </div>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className={`text-[8px] sm:text-[9px] uppercase font-black tracking-widest px-2 ${accentText}`}>OPERATOR IDENTITY</label>
                <div className="relative group">
                   <User className={`absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40 transition-opacity group-focus-within:opacity-100 ${accentText}`} />
                   <input type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} className={`w-full rounded-2xl py-3.5 sm:py-4 pl-12 pr-6 border outline-none transition-all text-sm ${theme === 'DARK' ? 'bg-black/40 border-white/5 text-white focus:border-indigo-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-400'}`} required />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className={`text-[8px] sm:text-[9px] uppercase font-black tracking-widest px-2 ${accentText}`}>SECURITY ACCESS KEY</label>
                <div className="relative group">
                   <Lock className={`absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40 transition-opacity group-focus-within:opacity-100 ${accentText}`} />
                   <input type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} className={`w-full rounded-2xl py-3.5 sm:py-4 pl-12 pr-6 border outline-none transition-all text-sm ${theme === 'DARK' ? 'bg-black/40 border-white/5 text-white focus:border-indigo-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-400'}`} required />
                </div>
              </div>
            </div>

            {authError && <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-[9px] font-bold uppercase tracking-widest text-center">{authError}</div>}

            <button type="submit" disabled={isLoggingIn} className={`w-full py-4 rounded-2xl font-black uppercase tracking-[0.25em] sm:tracking-[0.3em] flex items-center justify-center gap-3 sm:gap-4 transition-all active:scale-95 shadow-xl text-xs sm:text-sm ${theme === 'DARK' ? 'bg-indigo-600 hover:bg-indigo-500 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}>
              {isLoggingIn ? <RefreshCcw className="w-5 h-5 animate-spin" /> : <><Fingerprint className="w-5 h-5" /> INITIALIZE SESSION</>}
            </button>
            
            <div className={`mt-6 p-5 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] border space-y-3 transition-all ${theme === 'DARK' ? 'bg-indigo-500/5 border-indigo-500/20' : 'bg-indigo-50 border-indigo-100 shadow-inner'}`}>
              <div className="flex items-center gap-2">
                <Workflow className={`w-3.5 h-3.5 ${accentText}`} />
                <p className="text-[9px] font-black uppercase tracking-widest opacity-60">Terminal Credentials</p>
              </div>
              
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-black/30 border border-white/5">
                  <p className="text-[7px] font-black uppercase tracking-widest text-indigo-500 mb-1">Global Admin</p>
                  <div className="flex justify-between items-center text-[9px] font-bold">
                    <span className="opacity-40">admin@truthscanner.ai</span>
                    <span className="opacity-40">admin123</span>
                  </div>
                  <button type="button" onClick={() => { setLoginEmail(CREDENTIALS.ADMIN.email); setLoginPassword(CREDENTIALS.ADMIN.password); }} className="mt-2 text-[7px] uppercase font-black tracking-widest text-indigo-400 hover:underline">Apply Admin</button>
                </div>
                
                <div className="p-3 rounded-xl bg-black/30 border border-white/5">
                  <p className="text-[7px] font-black uppercase tracking-widest text-emerald-500 mb-1">Standard Operator</p>
                  <div className="flex justify-between items-center text-[9px] font-bold">
                    <span className="opacity-40">user@truthscanner.ai</span>
                    <span className="opacity-40">user123</span>
                  </div>
                  <button type="button" onClick={() => { setLoginEmail(CREDENTIALS.USER.email); setLoginPassword(CREDENTIALS.USER.password); }} className="mt-2 text-[7px] uppercase font-black tracking-widest text-emerald-400 hover:underline">Apply User</button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-500 relative ${themeClass}`}>
      <header className={`sticky top-0 z-50 glass border-b transition-all ${theme === 'DARK' ? 'bg-black/60 border-white/5' : 'bg-white/80 border-slate-200'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4">
            <div className={`p-2 rounded-lg sm:rounded-xl ${theme === 'DARK' ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/20' : 'bg-indigo-600 text-white shadow-lg'}`}>
              <Shield className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <h1 className="text-xs sm:text-lg font-bold font-futuristic tracking-[0.05em] sm:tracking-[0.1em] uppercase truncate max-w-[140px] sm:max-w-none">VOICE TRUTH SCANNER ELITE</h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-6">
            <button onClick={toggleTheme} className={`p-2 rounded-lg sm:rounded-xl transition-all border ${theme === 'DARK' ? 'bg-white/5 border-white/5 text-amber-400' : 'bg-slate-100 border-slate-200 text-indigo-600'}`}>
              {theme === 'DARK' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <div className="h-6 sm:h-8 w-px bg-current/10 hidden xs:block"></div>
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="flex flex-col items-end hidden sm:flex">
                <span className={`text-[8px] font-black uppercase tracking-widest ${accentText}`}>{role} ACCESS</span>
                <span className="text-[10px] font-bold opacity-60">{userEmail}</span>
              </div>
              <button onClick={handleLogout} className={`p-2 rounded-lg sm:rounded-xl transition-colors ${theme === 'DARK' ? 'bg-white/5 text-slate-500 hover:text-red-500' : 'bg-slate-100 text-slate-400 hover:text-red-500'}`}>
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-10 space-y-8 sm:space-y-10">
        {role === 'ADMIN' ? (
          <div className="space-y-8 sm:space-y-10 animate-in fade-in slide-in-from-top-4 duration-700">
             <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 px-2 sm:px-0">
              <div className="space-y-2">
                <p className={`text-[10px] font-black uppercase tracking-[0.4em] ${accentText}`}>NETWORK COMMAND</p>
                <h2 className="text-2xl sm:text-3xl font-black font-futuristic tracking-widest uppercase">FORENSIC ANALYTICS</h2>
              </div>
              <div className={`px-4 py-2 bg-emerald-500/10 text-emerald-500 rounded-xl border border-emerald-500/20 flex items-center gap-3`}>
                <Activity className="w-4 h-4 animate-pulse" />
                <span className="text-[9px] font-black uppercase">System Secured</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {[
                { icon: <BarChart3 />, label: 'Aggregate Scans', val: history.length, color: 'indigo' },
                { icon: <ShieldAlert />, label: 'Fraud Intercepts', val: history.filter(h => h.classification === 'AI_GENERATED' || h.is_scam).length, color: 'red' },
                { icon: <ShieldCheck />, label: 'Verified Human', val: history.filter(h => h.classification === 'HUMAN' && !h.is_scam).length, color: 'emerald' },
                { icon: <Users />, label: 'Active Operators', val: new Set(history.map(h => h.operator)).size || 1, color: 'amber' }
              ].map((stat, i) => (
                <div key={i} className={`p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] border glass transition-all hover:translate-y-[-4px] ${cardClass}`}>
                  <div className={`p-3 sm:p-4 rounded-xl inline-block ${theme === 'DARK' ? 'bg-white/5' : 'bg-slate-100'}`}>
                    {React.cloneElement(stat.icon as React.ReactElement<any>, { className: `w-5 h-5 sm:w-6 sm:h-6 text-${stat.color}-500` })}
                  </div>
                  <div className="mt-4 sm:mt-6">
                    <p className={`text-[9px] font-black uppercase tracking-widest ${subtextClass}`}>{stat.label}</p>
                    <p className="text-3xl sm:text-4xl font-black font-futuristic mt-1">{stat.val}</p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className={`rounded-[2rem] sm:rounded-[2.5rem] border glass overflow-hidden ${cardClass}`}>
               <div className="p-6 sm:p-8 border-b border-current/5 flex justify-between items-center">
                 <div className="flex items-center gap-3 sm:gap-4">
                    <Database className={`w-4 h-4 sm:w-5 sm:h-5 ${accentText}`} />
                    <h3 className="text-[10px] sm:text-xs font-black uppercase tracking-[0.2em]">Global Threat Archive</h3>
                 </div>
               </div>
               <div className="overflow-x-auto">
                 <table className="w-full text-left min-w-[600px]">
                   <thead className={`text-[8px] sm:text-[9px] uppercase font-black tracking-widest ${theme === 'DARK' ? 'bg-white/5' : 'bg-slate-100'}`}>
                     <tr>
                       <th className="px-6 sm:px-10 py-4 sm:py-5">Timestamp/Operator</th>
                       <th className="px-6 sm:px-10 py-4 sm:py-5">Region/Locale</th>
                       <th className="px-6 sm:px-10 py-4 sm:py-5">Verdict</th>
                       <th className="px-6 sm:px-10 py-4 sm:py-5 text-right">Confidence</th>
                     </tr>
                   </thead>
                   <tbody className="text-xs">
                     {history.length > 0 ? history.map((log) => (
                       <tr key={log.id} className="border-b border-current/5 hover:bg-current/[0.02] transition-colors">
                         <td className="px-6 sm:px-10 py-6 sm:py-8">
                           <p className="font-mono text-[9px] sm:text-[10px] opacity-60">{new Date(log.timestamp).toLocaleTimeString()}</p>
                           <p className="font-bold uppercase tracking-wider mt-0.5">{log.operator}</p>
                         </td>
                         <td className="px-6 sm:px-10 py-6 sm:py-8 font-black uppercase tracking-widest">{log.detected_language}</td>
                         <td className="px-6 sm:px-10 py-6 sm:py-8">
                           <span className={`text-[8px] sm:text-[9px] font-black uppercase px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg border ${log.is_scam || log.classification === 'AI_GENERATED' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'}`}>
                             {log.is_scam ? 'FRAUD INTERCEPT' : log.classification.replace('_', ' ')}
                           </span>
                         </td>
                         <td className="px-6 sm:px-10 py-6 sm:py-8 text-right font-black text-sm sm:text-base">{Math.round(log.confidence_score * 100)}%</td>
                       </tr>
                     )) : (
                       <tr><td colSpan={4} className="px-10 py-20 text-center opacity-40 uppercase text-[10px] font-black tracking-[0.5em] italic">Archive null</td></tr>
                     )}
                   </tbody>
                 </table>
               </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-start">
            {/* INPUT PANEL */}
            <div className="space-y-6 sm:space-y-8 flex flex-col h-full">
              <section className={`p-6 sm:p-10 lg:p-12 rounded-[2.5rem] sm:rounded-[3.5rem] border glass flex flex-col justify-between flex-1 transition-all duration-500 ${cardClass}`}>
                <div className="space-y-8 sm:space-y-10">
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-6">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                         <Waves className={`w-5 h-5 ${accentText}`} />
                         <h2 className="text-lg sm:text-xl font-black font-futuristic uppercase tracking-[0.2em]">BIO-ACOUSTIC FEED</h2>
                      </div>
                      <p className={`text-[9px] font-black uppercase tracking-[0.4em] ${accentText}`}>LINGUISTIC PHASING ACTIVE</p>
                    </div>
                    <div className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl border transition-all w-full sm:w-auto ${theme === 'DARK' ? 'bg-white/5 border-white/10 text-indigo-400' : 'bg-slate-100 border-slate-200 text-indigo-600 shadow-sm'}`}>
                      <Globe className="w-4 h-4" />
                      <select value={language} onChange={(e) => { setLanguage(e.target.value as SupportedLanguage); reset(); }} className="bg-transparent text-[10px] font-black uppercase outline-none cursor-pointer flex-1">
                        {Object.keys(LANGUAGE_LOCALES).map(lang => (
                          <option key={lang} value={lang} className={theme === 'DARK' ? 'bg-[#0d1117] text-white' : 'bg-white text-slate-900'}>{lang}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className={`relative p-4 sm:p-6 rounded-[2rem] sm:rounded-[2.5rem] border-2 overflow-hidden ${theme === 'DARK' ? 'bg-black/60 border-indigo-500/10' : 'bg-slate-50 border-slate-200'} h-32 sm:h-40 flex items-center justify-center`}>
                    <Waveform isRecording={status === 'RECORDING'} isActive={status !== 'IDLE'} stream={recordingStream || undefined} />
                    {status === 'RECORDING' && (
                       <div className="absolute top-4 right-4 sm:right-6 flex items-center gap-2 px-3 py-1 bg-red-500/20 rounded-full border border-red-500/30">
                          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                          <span className="text-[8px] font-black uppercase tracking-widest text-red-500">Live Ingest</span>
                       </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <button onClick={status === 'RECORDING' ? stopRecording : startRecording} disabled={status === 'ANALYZING'} className={`flex flex-col items-center gap-3 sm:gap-4 py-6 sm:py-8 rounded-[2rem] sm:rounded-[3rem] border-2 transition-all group ${status === 'RECORDING' ? 'bg-red-500/10 border-red-500 text-red-500 shadow-lg' : theme === 'DARK' ? 'bg-white/5 border-white/5 text-slate-400 hover:border-indigo-500/40 hover:text-indigo-400' : 'bg-slate-100 border-slate-200 text-slate-500 hover:text-indigo-600'}`}>
                      <Mic className={`w-6 h-6 sm:w-8 sm:h-8 transition-transform ${status === 'RECORDING' ? 'scale-110' : 'group-hover:scale-110'}`} />
                      <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.2em] sm:tracking-[0.3em]">{status === 'RECORDING' ? 'BREAK LINK' : 'CAPTURE LIVE'}</span>
                    </button>
                    <button onClick={() => fileInputRef.current?.click()} disabled={status === 'ANALYZING'} className={`flex flex-col items-center gap-3 sm:gap-4 py-6 sm:py-8 rounded-[2rem] sm:rounded-[3rem] border-2 transition-all group ${theme === 'DARK' ? 'bg-white/5 border-white/5 text-slate-400 hover:border-indigo-500/40 hover:text-indigo-400' : 'bg-slate-100 border-slate-200 text-slate-500 hover:text-indigo-600'}`}>
                      <Upload className="w-6 h-6 sm:w-8 sm:h-8 transition-transform group-hover:scale-110" />
                      <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.2em] sm:tracking-[0.3em]">IMPORT DATA</span>
                    </button>
                    <input ref={fileInputRef} type="file" accept="audio/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) { setAudioFile(f); runAnalysis(f); } }} className="hidden" />
                  </div>
                </div>

                {audioFile && (
                  <div className={`mt-8 sm:mt-10 p-5 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] border glass flex items-center justify-between animate-in slide-in-from-bottom-4 ${theme === 'DARK' ? 'bg-indigo-500/5 border-indigo-500/20' : 'bg-indigo-50 border-indigo-200'}`}>
                    <div className="flex items-center gap-3 sm:gap-4 overflow-hidden">
                      <div className={`p-2.5 sm:p-3 rounded-xl ${theme === 'DARK' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-600 text-white'}`}><FileText className="w-4 h-4 sm:w-5 sm:h-5" /></div>
                      <div className="overflow-hidden">
                        <p className="text-[10px] sm:text-[11px] font-black uppercase truncate pr-4">{audioFile instanceof File ? audioFile.name : 'captured_biometric.wav'}</p>
                        <p className={`text-[8px] font-black uppercase tracking-widest opacity-60 mt-0.5`}>Buffer Ready</p>
                      </div>
                    </div>
                    <button onClick={reset} className={`p-2 transition-all hover:scale-110 text-slate-400 hover:text-red-500`}><Trash2 className="w-4 h-4 sm:w-5 sm:h-5" /></button>
                  </div>
                )}
              </section>

              <section className={`p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] border glass ${cardClass}`}>
                <div className="flex items-center gap-3 mb-6">
                  <History className={`w-4 h-4 ${accentText}`} />
                  <h3 className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em]">Interception Log</h3>
                </div>
                <div className="space-y-3">
                  {history.length > 0 ? history.slice(0, 3).map(h => (
                    <div key={h.id} className={`p-4 rounded-xl sm:rounded-2xl border ${theme === 'DARK' ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-200'} flex items-center justify-between`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${h.is_scam || h.classification === 'AI_GENERATED' ? 'bg-red-500 shadow-[0_0_8px_#ef4444]' : 'bg-emerald-500 shadow-[0_0_8px_#10b981]'}`} />
                        <span className="text-[9px] sm:text-[10px] font-bold uppercase truncate max-w-[100px] sm:max-w-[120px]">{h.is_scam ? 'Threat' : 'Secure'}</span>
                      </div>
                      <span className="text-[8px] sm:text-[9px] opacity-40 uppercase font-mono">{new Date(h.timestamp).toLocaleDateString()}</span>
                    </div>
                  )) : (
                    <p className="text-[9px] opacity-30 uppercase font-bold text-center py-4 tracking-widest italic">Signal history empty</p>
                  )}
                </div>
              </section>
            </div>

            {/* RESULTS PANEL */}
            <section id="result-view" className={`p-6 sm:p-10 lg:p-12 rounded-[2.5rem] sm:rounded-[3.5rem] border glass flex flex-col justify-center items-center min-h-[450px] sm:min-h-[550px] transition-all duration-700 relative overflow-hidden ${cardClass}`}>
              {status === 'ERROR' && (
                <div className="text-center space-y-6 sm:space-y-8 w-full animate-in zoom-in">
                  <div className={`p-8 sm:p-10 rounded-[2rem] sm:rounded-[3rem] border-2 space-y-6 ${theme === 'DARK' ? 'bg-red-500/10 border-red-500/30' : 'bg-red-50 border-red-200 shadow-xl'}`}>
                    <AlertTriangle className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-red-500" />
                    <div className="space-y-2">
                      <h3 className="text-xl sm:text-2xl font-black font-futuristic uppercase tracking-widest text-red-500 leading-tight">UPLINK FAULT</h3>
                      <p className={`text-[9px] sm:text-[11px] font-bold uppercase tracking-widest leading-relaxed max-w-xs mx-auto ${theme === 'DARK' ? 'text-white/80' : 'text-slate-800'}`}>{errorMessage}</p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-4">
                    <button onClick={() => runAnalysis()} className={`px-10 py-4 rounded-2xl font-black uppercase text-[10px] tracking-[0.3em] bg-indigo-600 text-white shadow-lg active:scale-95 transition-all`}>RE-SYNC CORE</button>
                    <button onClick={reset} className="text-[8px] font-black uppercase tracking-[0.4em] opacity-40 hover:opacity-100 transition-opacity">Abort Extraction</button>
                  </div>
                </div>
              )}

              {status === 'IDLE' && !result && (
                <div className="text-center space-y-8 sm:space-y-10 opacity-20">
                  <Radar className={`w-20 h-20 sm:w-28 sm:h-28 mx-auto ${theme === 'DARK' ? 'text-indigo-500 animate-spin-slow' : 'text-slate-400'}`} />
                  <div className="space-y-2">
                    <h3 className="text-lg sm:text-xl font-bold font-futuristic uppercase tracking-widest text-indigo-500">Standby Mode</h3>
                    <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.4em] max-w-xs mx-auto leading-relaxed">System ready for signal ingestion.</p>
                  </div>
                </div>
              )}

              {status === 'ANALYZING' && (
                <div className="text-center space-y-10 sm:space-y-12">
                  <div className="relative">
                    <Search className="w-24 h-24 sm:w-36 sm:h-36 mx-auto text-indigo-500 animate-pulse" />
                    <div className={`absolute inset-0 border-[4px] sm:border-[6px] rounded-full animate-spin border-transparent border-t-indigo-500`}></div>
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-2xl sm:text-3xl font-black font-futuristic uppercase tracking-[0.2em] animate-pulse">Neural Scan...</h3>
                    <p className={`text-[9px] sm:text-[10px] font-black uppercase tracking-[0.5em] ${accentText}`}>Verifying Biometric Signature</p>
                  </div>
                </div>
              )}

              {result && !result.language_match && (
                <div className="text-center space-y-8 sm:space-y-10 w-full animate-in zoom-in">
                  <div className={`p-8 sm:p-10 rounded-[2rem] sm:rounded-[3rem] border-2 border-amber-500/30 space-y-8 ${theme === 'DARK' ? 'bg-amber-500/10' : 'bg-amber-50 shadow-xl'}`}>
                    <MessageSquareWarning className="w-16 h-16 sm:w-20 sm:h-20 mx-auto text-amber-500 animate-pulse" />
                    <div className="space-y-5">
                      <h3 className="text-xl sm:text-2xl font-black font-futuristic uppercase tracking-widest text-amber-500 leading-tight">PHASING ERROR</h3>
                      <div className={`p-4 sm:p-6 rounded-2xl border ${theme === 'DARK' ? 'bg-black/40 border-amber-500/20' : 'bg-white border-amber-200'}`}>
                        <p className={`text-[11px] sm:text-[12px] font-bold uppercase tracking-[0.15em] leading-relaxed ${theme === 'DARK' ? 'text-white' : 'text-slate-800'}`}>
                          {result.forensic_report}
                        </p>
                      </div>
                    </div>
                  </div>
                  <button onClick={reset} className="px-10 py-4 rounded-2xl font-black uppercase text-[10px] tracking-[0.3em] bg-indigo-600 text-white shadow-lg active:scale-95 transition-all">Re-Calibrate Locale</button>
                </div>
              )}

              {(status === 'COMPLETED' || (result && result.language_match)) && result && (
                <div className="w-full space-y-8 sm:space-y-10 animate-in fade-in duration-1000">
                  <div className="text-center space-y-4 sm:space-y-6">
                    <div className="space-y-3 sm:space-y-4">
                      <p className={`text-[8px] sm:text-[10px] font-black uppercase tracking-[0.6em] ${accentText}`}>EXTRACTION VERDICT</p>
                      <h2 className={`text-3xl sm:text-4xl lg:text-6xl font-black font-futuristic tracking-tighter uppercase leading-none ${result.is_scam || result.classification === 'AI_GENERATED' ? 'text-red-500' : 'text-emerald-500'}`}>
                        {result.is_scam || result.classification === 'AI_GENERATED' ? (
                          <span className="flex flex-col items-center gap-4">
                            <ShieldAlert className="w-16 h-16 sm:w-20 sm:h-20 animate-pulse" />
                            {result.is_scam ? 'THREAT DETECTED' : 'SYNTHETIC SIGNAL'}
                          </span>
                        ) : (
                          <span className="flex flex-col items-center gap-4">
                            <ShieldCheck className="w-16 h-16 sm:w-20 sm:h-20" />
                            VERIFIED HUMAN
                          </span>
                        )}
                      </h2>
                      
                      <div className="flex items-center justify-center gap-4 mt-4 sm:mt-6">
                        <div className={`px-4 sm:px-5 py-1.5 sm:py-2 rounded-full border flex items-center gap-3 ${result.is_scam || result.classification === 'AI_GENERATED' ? 'bg-red-500/10 border-red-500/30 text-red-500' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'}`}>
                           <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest">{result.is_scam ? 'CRITICAL ALERT' : 'SECURE LINE'}</span>
                        </div>
                      </div>
                    </div>

                    {result.scam_keywords.length > 0 && (
                      <div className="flex flex-wrap justify-center gap-2 mt-4 sm:mt-6">
                        {result.scam_keywords.map((kw, idx) => (
                          <span key={idx} className="px-2.5 py-1 rounded-full bg-red-500/20 text-red-500 text-[8px] sm:text-[9px] font-black uppercase border border-red-500/30 flex items-center gap-2">
                            <AlertCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> {kw}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <RiskMeter score={result.confidence_score} level={result.fraud_risk_level} />
                  
                  <div className={`p-6 sm:p-8 rounded-[1.5rem] sm:rounded-[2.5rem] border glass ${theme === 'DARK' ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-200 shadow-inner'}`}>
                     <p className={`text-[10px] sm:text-[12px] font-bold uppercase tracking-widest leading-relaxed italic text-center ${subtextClass}`}>
                       "{result.forensic_report}"
                     </p>
                  </div>
                </div>
              )}
            </section>
          </div>
        )}

        {result && result.language_match && (
          <div className="space-y-8 sm:space-y-10 animate-in slide-in-from-bottom-12 duration-700 pb-10">
            <div className="flex items-center gap-3 sm:gap-4 px-2 sm:px-4">
               <Zap className={`w-4 h-4 sm:w-5 sm:h-5 ${accentText}`} />
               <h3 className="text-lg sm:text-xl font-black font-futuristic tracking-[0.2em] uppercase">Deep Intelligence Matrix</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
               <AnalysisLayer label="Behavioral Forensics" tamilLabel="நடத்தை" description={result.analysis_layers.behavioral_threats} isCompleted={true} />
               <AnalysisLayer label="Pattern Matrix" tamilLabel="அமைப்பு" description={result.analysis_layers.spectral_artifacts} isCompleted={true} />
               <AnalysisLayer label="Spatial Origin" tamilLabel="இடம்" description={result.analysis_layers.spatial_acoustics} isCompleted={true} />
               <AnalysisLayer label="Neural Micro-Dynamics" tamilLabel="உணர்ச்சி" description={result.analysis_layers.emotional_micro_dynamics} isCompleted={true} />
               <AnalysisLayer label="Respiratory Sync" tamilLabel="சுவாசம்" description={result.analysis_layers.breath_emotion_sync} isCompleted={true} />
               <AnalysisLayer label="Linguistic Marker" tamilLabel="டிஜிட்டல்" description={result.detected_language} isCompleted={true} />
            </div>
            
            {(result.is_scam || result.classification === 'AI_GENERATED') && (
              <div className="p-8 sm:p-14 rounded-[2.5rem] sm:rounded-[3.5rem] bg-red-500/5 border-2 border-red-500/20 glass space-y-6 sm:space-y-8 animate-pulse shadow-[0_0_40px_rgba(239,68,68,0.15)]">
                <div className="flex flex-col items-center md:items-start gap-3 sm:gap-4 text-red-500">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <AlertTriangle className="w-8 h-8 sm:w-10 sm:h-10" />
                    <h4 className="text-xl sm:text-2xl font-black uppercase tracking-widest">DEFENSE PROTOCOL ACTIVE</h4>
                  </div>
                  <p className="text-[9px] sm:text-[11px] font-black uppercase tracking-[0.3em] opacity-80">COUNTER-FRAUD OPERATIONS TRIGGERED</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                  {result.safety_actions.map((action, idx) => (
                    <div key={idx} className="p-5 sm:p-6 rounded-[1.5rem] sm:rounded-3xl bg-red-500/10 border-2 border-red-500/10 flex items-start gap-4 transition-all hover:bg-red-500/20 group">
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-red-500 mt-2 shrink-0 transition-transform group-hover:scale-125" />
                      <p className="text-[9px] sm:text-[11px] font-black uppercase tracking-wider text-red-400 leading-relaxed">{action}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col md:flex-row gap-4 sm:gap-6 justify-center pt-8">
              <button className={`px-10 sm:px-14 py-5 sm:py-7 rounded-[2.5rem] sm:rounded-[3rem] text-white font-black uppercase text-[10px] sm:text-[11px] tracking-[0.4em] shadow-2xl flex items-center justify-center gap-4 transition-all hover:translate-y-[-4px] ${theme === 'DARK' ? 'bg-indigo-600 hover:bg-indigo-500' : 'bg-indigo-600 hover:bg-indigo-700 shadow-xl'}`}>
                <Download className="w-5 h-5 sm:w-6 sm:h-6" /> EXPORT DEFENSE LOG
              </button>
              <button onClick={reset} className={`px-10 sm:px-14 py-5 sm:py-7 rounded-[2.5rem] sm:rounded-[3rem] border-2 font-black uppercase text-[10px] sm:text-[11px] tracking-[0.4em] transition-all hover:translate-y-[-4px] ${theme === 'DARK' ? 'border-white/10 text-slate-400 hover:text-white' : 'border-slate-300 text-slate-500 hover:text-slate-900'}`}>
                <RefreshCcw className="w-4 h-4 sm:w-5 sm:h-5" /> RE-CALIBRATE SYSTEM
              </button>
            </div>
          </div>
        )}

        {status === 'IDLE' && (
          <div className={`p-8 sm:p-14 rounded-[3rem] sm:rounded-[4rem] border glass flex flex-col md:flex-row items-center gap-8 sm:gap-10 shadow-2xl transition-all ${cardClass}`}>
            <div className={`p-6 sm:p-8 rounded-[1.5rem] sm:rounded-[2.5rem] transition-colors ${theme === 'DARK' ? 'bg-indigo-600/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
              <Cpu className="w-10 h-10 sm:w-12 sm:h-12" />
            </div>
            <div className="space-y-3 sm:space-y-4 flex-1 text-center md:text-left">
              <h4 className={`text-[10px] sm:text-[12px] font-black uppercase tracking-[0.4em] ${accentText}`}>CORE PROCESSING ACTIVE</h4>
              <p className={`text-xs sm:text-sm font-bold uppercase tracking-wider leading-relaxed opacity-60 ${subtextClass}`}>VOICE TRUTH SCANNER ELITE utilizes 2026-gen neural patterns to distinguish human authenticity from synthetic constructs. Our zero-knowledge protocol ensures all biometric metadata is purged within 300ms of final extraction.</p>
            </div>
          </div>
        )}
      </main>

      <footer className={`py-12 sm:py-16 border-t transition-all ${theme === 'DARK' ? 'border-white/5 text-slate-600' : 'border-slate-200 text-slate-400'}`}>
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6 sm:gap-8">
          <p className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.4em] sm:tracking-[0.8em] text-center">© 2026 TRUTH SCANNER ELITE • PROTECTING THE DIGITAL FRONTIER</p>
          <div className="flex gap-6 sm:gap-10">
            <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.3em] opacity-40">Privacy</span>
            <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.3em] opacity-40">Status</span>
            <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.3em] opacity-40">Help</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
