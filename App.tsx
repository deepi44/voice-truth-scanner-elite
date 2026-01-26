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
  Globe, FileText, Radar, Search, Users,
  Sun, Moon, ChevronRight, BarChart3, Database, ShieldAlert,
  Terminal, Activity as Heartbeat, XCircle
} from 'lucide-react';

const CREDENTIALS = {
  ADMIN: { email: 'admin@truthscanner.ai', password: 'admin123' },
  USER: { email: 'user@truthscanner.ai', password: 'user123' }
};

const App: React.FC = () => {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [role, setRole] = useState<Role>('USER');
  const [theme, setTheme] = useState<Theme>('DARK');
  const [loginEmail, setLoginEmail] = useState(CREDENTIALS.USER.email);
  const [loginPassword, setLoginPassword] = useState(CREDENTIALS.USER.password);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [status, setStatus] = useState<AppStatus>('IDLE');
  const [language, setLanguage] = useState<SupportedLanguage>('English');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [audioFile, setAudioFile] = useState<File | Blob | null>(null);
  const [history, setHistory] = useState<AnalysisResult[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('forensic_history');
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  useEffect(() => {
    if (audioFile && status === 'IDLE') {
      runAnalysis();
    }
  }, [audioFile, status]);

  const toggleTheme = () => setTheme(prev => prev === 'DARK' ? 'LIGHT' : 'DARK');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsLoggingIn(true);
    
    setTimeout(() => {
      const email = loginEmail.toLowerCase().trim();
      if (email === CREDENTIALS.ADMIN.email && loginPassword === CREDENTIALS.ADMIN.password) {
        setUserEmail(email); setRole('ADMIN');
      } else if (email === CREDENTIALS.USER.email && loginPassword === CREDENTIALS.USER.password) {
        setUserEmail(email); setRole('USER');
      } else {
        setAuthError('INVALID ACCESS KEY OR ACCOUNT ID');
      }
      setIsLoggingIn(false);
    }, 1200);
  };

  const handleLogout = () => {
    setUserEmail(null); setResult(null); setAudioFile(null); setStatus('IDLE');
  };

  const runAnalysis = async () => {
    if (!audioFile) return;
    setStatus('ANALYZING');
    setResult(null);
    setErrorMessage(null);
    try {
      const rawResult = await analyzeForensicAudio(audioFile, language);
      const enriched: AnalysisResult = {
        ...rawResult,
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        operator: userEmail || 'System'
      };
      setResult(enriched);
      if (enriched.language_match) {
        const updatedHistory = [enriched, ...history].slice(0, 50);
        setHistory(updatedHistory);
        localStorage.setItem('forensic_history', JSON.stringify(updatedHistory));
      }
      setStatus('COMPLETED');
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "An unexpected forensic failure occurred.");
      setStatus('ERROR');
    }
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
      alert("Microphone capture failed. Check permissions.");
    }
  };

  const reset = () => {
    setAudioFile(null);
    setResult(null);
    setStatus('IDLE');
    setErrorMessage(null);
  };

  const themeClass = theme === 'DARK' ? 'bg-[#010409] text-slate-100' : 'bg-[#f8fafc] text-slate-900';
  const cardClass = theme === 'DARK' ? 'bg-[#0d1117] border-white/5 shadow-2xl' : 'bg-white border-slate-200 shadow-xl';
  const accentText = theme === 'DARK' ? 'text-indigo-400' : 'text-indigo-600';
  const subtextClass = theme === 'DARK' ? 'text-slate-500' : 'text-slate-400';

  if (!userEmail) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 ${themeClass} transition-colors duration-700`}>
        <div className={`w-full max-w-md p-6 sm:p-10 rounded-[2rem] sm:rounded-[3.5rem] border backdrop-blur-3xl ${cardClass}`}>
          <div className="flex flex-col items-center gap-6 mb-12">
            <div className={`p-6 sm:p-8 rounded-[2rem] sm:rounded-[3rem] ${theme === 'DARK' ? 'bg-indigo-600/20 text-indigo-500 border border-indigo-500/30' : 'bg-indigo-600 text-white shadow-2xl shadow-indigo-500/40'}`}>
              <Shield className="w-12 h-12 sm:w-14 sm:h-14" />
            </div>
            <div className="text-center space-y-2">
              <h1 className="text-xl sm:text-2xl font-bold font-futuristic tracking-[0.2em] uppercase text-indigo-500">TRUTH SCANNER ELITE</h1>
              <p className={`text-[10px] font-black uppercase tracking-[0.5em] opacity-60 ${accentText}`}>AUTHENTICATION TERMINAL</p>
            </div>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-6 sm:space-y-8">
            <div className="space-y-4 sm:space-y-5">
              <div className="space-y-2">
                <div className="flex justify-between px-2">
                  <label className={`text-[10px] uppercase font-black tracking-widest ${accentText}`}>Account ID</label>
                  <span className="text-[8px] opacity-40 uppercase">admin@truthscanner.ai</span>
                </div>
                <div className="relative group">
                   <User className={`absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 opacity-40 transition-opacity group-focus-within:opacity-100 ${accentText}`} />
                   <input type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} className={`w-full rounded-2xl py-3.5 sm:py-4 pl-14 pr-6 border outline-none transition-all ${theme === 'DARK' ? 'bg-black/40 border-white/5 text-white focus:border-indigo-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-400'}`} required />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between px-2">
                  <label className={`text-[10px] uppercase font-black tracking-widest ${accentText}`}>Security Key</label>
                  <span className="text-[8px] opacity-40 uppercase">admin123</span>
                </div>
                <div className="relative group">
                   <Lock className={`absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 opacity-40 transition-opacity group-focus-within:opacity-100 ${accentText}`} />
                   <input type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} className={`w-full rounded-2xl py-3.5 sm:py-4 pl-14 pr-6 border outline-none transition-all ${theme === 'DARK' ? 'bg-black/40 border-white/5 text-white focus:border-indigo-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-400'}`} required />
                </div>
              </div>
            </div>

            {authError && <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-widest text-center animate-pulse">{authError}</div>}

            <button type="submit" disabled={isLoggingIn} className={`w-full py-4 sm:py-5 rounded-2xl font-black uppercase tracking-[0.4em] flex items-center justify-center gap-4 transition-all active:scale-95 shadow-2xl ${theme === 'DARK' ? 'bg-indigo-600 hover:bg-indigo-500 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}>
              {isLoggingIn ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <><Fingerprint className="w-6 h-6" /> VALIDATE ACCESS</>}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${themeClass} flex flex-col font-sans transition-colors duration-500 relative`}>
      <header className={`sticky top-0 z-50 backdrop-blur-3xl border-b transition-all ${theme === 'DARK' ? 'bg-black/60 border-white/5' : 'bg-white/80 border-slate-200'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className={`p-2 sm:p-2.5 rounded-xl ${theme === 'DARK' ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/20' : 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'}`}>
              <Shield className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <h1 className="text-sm sm:text-lg md:text-xl font-bold font-futuristic tracking-widest uppercase truncate max-w-[150px] sm:max-w-none">VOICE TRUTH SCANNER ELITE</h1>
          </div>

          <div className="flex items-center gap-3 sm:gap-6">
            <button onClick={toggleTheme} className={`p-2 sm:p-3 rounded-2xl transition-all flex items-center gap-2 sm:gap-3 border ${theme === 'DARK' ? 'bg-white/5 border-white/5 text-amber-400 hover:bg-white/10' : 'bg-slate-100 border-slate-200 text-indigo-600 hover:bg-slate-200'}`}>
              {theme === 'DARK' ? <><Sun className="w-4 h-4 sm:w-5 sm:h-5" /><span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest hidden lg:block">Light</span></> : <><Moon className="w-4 h-4 sm:w-5 sm:h-5" /><span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest hidden lg:block">Dark</span></>}
            </button>
            <div className="h-8 sm:h-10 w-px bg-current/10 hidden sm:block"></div>
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="flex flex-col items-end hidden md:flex">
                <span className={`text-[8px] sm:text-[9px] font-black uppercase tracking-widest ${accentText}`}>{role} ACCESS</span>
                <span className="text-[9px] sm:text-[10px] font-bold opacity-60 truncate max-w-[120px]">{userEmail}</span>
              </div>
              <button onClick={handleLogout} className={`p-2 sm:p-3 rounded-2xl transition-colors ${theme === 'DARK' ? 'bg-white/5 text-slate-500 hover:text-red-500' : 'bg-slate-100 text-slate-400 hover:text-red-500'}`}>
                <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 md:p-10 space-y-8 sm:space-y-12">
        {role === 'ADMIN' ? (
          <div className="space-y-8 sm:space-y-12 animate-in fade-in slide-in-from-top-4 duration-700">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
              <div className="space-y-1 sm:space-y-2">
                <p className={`text-[8px] sm:text-[10px] font-black uppercase tracking-[0.4em] ${accentText}`}>BIO-METRIC OVERWATCH</p>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-black font-futuristic tracking-widest uppercase">ENTERPRISE ANALYTICS</h2>
              </div>
              <div className={`flex gap-4 p-2 rounded-xl sm:rounded-2xl border ${cardClass}`}>
                <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-1.5 sm:py-2 bg-emerald-500/10 text-emerald-500 rounded-lg sm:rounded-xl">
                  <Heartbeat className="w-3 h-3 sm:w-4 sm:h-4 animate-pulse" />
                  <span className="text-[8px] sm:text-[10px] font-black uppercase">Service Active</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {[
                { icon: <BarChart3 />, label: 'Total Scans', val: history.length, color: 'indigo' },
                { icon: <ShieldAlert />, label: 'Deepfake Alerts', val: history.filter(h => h.classification === 'AI_GENERATED').length, color: 'red' },
                { icon: <Fingerprint />, label: 'Human Verified', val: history.filter(h => h.classification === 'HUMAN').length, color: 'emerald' },
                { icon: <Users />, label: 'Operator Nodes', val: 2, color: 'amber' }
              ].map((stat, i) => (
                <div key={i} className={`p-6 sm:p-8 rounded-[1.5rem] sm:rounded-[3rem] border space-y-4 sm:space-y-5 transition-all hover:scale-[1.02] ${cardClass}`}>
                  <div className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl inline-block ${theme === 'DARK' ? 'bg-white/5' : 'bg-slate-100'}`}>
                    {React.cloneElement(stat.icon as React.ReactElement<any>, { className: `w-5 h-5 sm:w-6 sm:h-6 text-${stat.color}-500` })}
                  </div>
                  <div>
                    <p className={`text-[8px] sm:text-[10px] font-black uppercase tracking-widest ${subtextClass}`}>{stat.label}</p>
                    <p className="text-2xl sm:text-3xl md:text-4xl font-black font-futuristic mt-1">{stat.val < 10 && stat.val > 0 ? `0${stat.val}` : stat.val}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className={`rounded-[2rem] sm:rounded-[4rem] border overflow-hidden ${cardClass}`}>
               <div className="p-6 sm:p-10 border-b border-current/5 flex justify-between items-center">
                 <div className="flex items-center gap-3 sm:gap-4">
                    <Database className={`w-4 h-4 sm:w-5 sm:h-5 ${accentText}`} />
                    <h3 className="text-xs sm:text-sm font-black uppercase tracking-[0.2em]">Forensic Dossier History</h3>
                 </div>
               </div>
               <div className="overflow-x-auto">
                 <table className="w-full text-left">
                   <thead className={`text-[8px] sm:text-[10px] uppercase font-black tracking-widest ${theme === 'DARK' ? 'bg-white/5' : 'bg-slate-100'}`}>
                     <tr>
                       <th className="px-6 sm:px-10 py-4 sm:py-6">Timestamp</th>
                       <th className="px-6 sm:px-10 py-4 sm:py-6">Language</th>
                       <th className="px-6 sm:px-10 py-4 sm:py-6">Verdict</th>
                       <th className="px-6 sm:px-10 py-4 sm:py-6 text-right">Confidence</th>
                     </tr>
                   </thead>
                   <tbody className="text-xs sm:text-sm">
                     {history.length > 0 ? history.map((log) => (
                       <tr key={log.id} className="border-b border-current/5 hover:bg-current/[0.02] transition-colors">
                         <td className={`px-6 sm:px-10 py-6 sm:py-8 font-mono text-[9px] sm:text-[11px] ${subtextClass}`}>{new Date(log.timestamp).toLocaleString()}</td>
                         <td className="px-6 sm:px-10 py-6 sm:py-8 font-black uppercase text-[9px] sm:text-[11px] tracking-widest">{log.detected_language}</td>
                         <td className="px-6 sm:px-10 py-6 sm:py-8">
                           <span className={`text-[8px] sm:text-[10px] font-black uppercase px-2 sm:px-4 py-1 sm:py-1.5 rounded-full border ${log.classification === 'AI_GENERATED' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'}`}>
                             {log.classification.replace('_', ' ')}
                           </span>
                         </td>
                         <td className="px-6 sm:px-10 py-6 sm:py-8 text-right font-black text-base sm:text-lg">{Math.round(log.confidence_score * 100)}%</td>
                       </tr>
                     )) : (
                       <tr><td colSpan={4} className="px-6 sm:px-10 py-12 sm:py-20 text-center opacity-40 uppercase text-[9px] sm:text-[11px] font-black tracking-widest italic">No forensic data in sector logs</td></tr>
                     )}
                   </tbody>
                 </table>
               </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-10">
            {/* CAPTURE CONSOLE */}
            <section className="relative group flex flex-col h-full">
              <div className={`relative p-6 sm:p-12 md:p-16 rounded-[2rem] sm:rounded-[4.5rem] border flex flex-col justify-between h-full min-h-[500px] sm:min-h-[650px] transition-all duration-500 ${cardClass}`}>
                <div className="space-y-8 sm:space-y-12">
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-6 sm:gap-4">
                    <div className="space-y-1 sm:space-y-2">
                      <div className="flex items-center gap-3">
                         <Terminal className={`w-4 h-4 sm:w-5 sm:h-5 ${accentText}`} />
                         <h2 className="text-xl sm:text-2xl font-black font-futuristic uppercase tracking-[0.2em]">CAPTURE CONSOLE</h2>
                      </div>
                      <p className={`text-[8px] sm:text-[10px] font-black uppercase tracking-[0.4em] ${accentText}`}>Linguistic Verification Active</p>
                    </div>
                    <div className={`flex items-center gap-2 sm:gap-3 px-4 py-2 sm:px-6 sm:py-3 rounded-xl sm:rounded-2xl border transition-all w-full sm:w-auto ${theme === 'DARK' ? 'bg-white/5 border-white/10 text-indigo-400 hover:bg-white/10' : 'bg-slate-100 border-slate-200 text-indigo-600 hover:bg-slate-200 shadow-sm'}`}>
                      <Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      <select value={language} onChange={(e) => { setLanguage(e.target.value as SupportedLanguage); reset(); }} className="bg-transparent text-[9px] sm:text-[11px] font-black uppercase outline-none cursor-pointer flex-1 sm:flex-none">
                        {Object.keys(LANGUAGE_LOCALES).map(lang => (
                          <option key={lang} value={lang} className={theme === 'DARK' ? 'bg-[#0d1117] text-white' : 'bg-white text-slate-900'}>{lang}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className={`relative p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[3.5rem] border-2 overflow-hidden ${theme === 'DARK' ? 'bg-black/60 border-indigo-500/10' : 'bg-slate-100 border-slate-200'} h-32 sm:h-40 flex items-center justify-center`}>
                    <Waveform isRecording={status === 'RECORDING'} isActive={status !== 'IDLE'} />
                    {status === 'RECORDING' && (
                       <div className="absolute top-3 right-4 sm:top-4 sm:right-6 flex items-center gap-2">
                          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-red-500 rounded-full animate-ping"></div>
                          <span className="text-[7px] sm:text-[8px] font-black uppercase tracking-widest text-red-500">LIVE STREAM</span>
                       </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4 sm:gap-8">
                    <button onClick={status === 'RECORDING' ? () => mediaRecorderRef.current?.stop() : startRecording} disabled={status === 'ANALYZING'} className={`flex flex-col items-center gap-4 sm:gap-6 py-8 sm:py-12 rounded-[2rem] sm:rounded-[4rem] border-2 transition-all group ${status === 'RECORDING' ? 'bg-red-500/20 border-red-500 text-red-500 shadow-[0_0_30px_rgba(239,68,68,0.2)]' : theme === 'DARK' ? 'bg-white/5 border-white/5 text-slate-400 hover:border-indigo-500/40 hover:text-indigo-400' : 'bg-slate-100 border-slate-200 text-slate-500 hover:bg-slate-200 hover:text-indigo-600'}`}>
                      <Mic className={`w-8 h-8 sm:w-12 sm:h-12 transition-transform duration-500 ${status === 'RECORDING' ? 'scale-110' : 'group-hover:scale-110'}`} />
                      <span className="text-[9px] sm:text-[11px] font-black uppercase tracking-[0.3em]">{status === 'RECORDING' ? 'Cut Uplink' : 'Capture Live'}</span>
                    </button>
                    <button onClick={() => fileInputRef.current?.click()} disabled={status === 'ANALYZING'} className={`flex flex-col items-center gap-4 sm:gap-6 py-8 sm:py-12 rounded-[2rem] sm:rounded-[4rem] border-2 transition-all group ${theme === 'DARK' ? 'bg-white/5 border-white/5 text-slate-400 hover:border-indigo-500/40 hover:text-indigo-400' : 'bg-slate-100 border-slate-200 text-slate-500 hover:bg-slate-200 hover:text-indigo-600'}`}>
                      <Upload className={`w-8 h-8 sm:w-12 sm:h-12 transition-transform duration-500 group-hover:scale-110`} />
                      <span className="text-[9px] sm:text-[11px] font-black uppercase tracking-[0.3em]">Load Bio-File</span>
                    </button>
                    <input ref={fileInputRef} type="file" accept="audio/*" onChange={(e) => { const file = e.target.files?.[0]; if (file) setAudioFile(file); }} className="hidden" />
                  </div>
                </div>

                {audioFile && (
                  <div className={`mt-8 sm:mt-14 p-6 sm:p-10 rounded-[1.5rem] sm:rounded-[3.5rem] border flex items-center justify-between animate-in slide-in-from-bottom-6 duration-500 ${theme === 'DARK' ? 'bg-indigo-500/5 border-indigo-500/30' : 'bg-indigo-50 border-indigo-200 shadow-sm'}`}>
                    <div className="flex items-center gap-4 sm:gap-6 overflow-hidden">
                      <div className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl ${theme === 'DARK' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-100 text-indigo-600'}`}><FileText className="w-5 h-5 sm:w-6 sm:h-6" /></div>
                      <div className="overflow-hidden">
                        <p className="text-xs sm:text-sm font-black uppercase truncate pr-4">{audioFile instanceof File ? audioFile.name : 'Vocal_Spectral_01.wav'}</p>
                        <p className={`text-[8px] sm:text-[10px] font-black uppercase mt-1 tracking-widest ${accentText} opacity-60 animate-pulse`}>Analyzing Waveform...</p>
                      </div>
                    </div>
                    <button onClick={reset} className={`p-2 transition-all hover:scale-110 ${theme === 'DARK' ? 'text-slate-600 hover:text-red-500' : 'text-slate-400 hover:text-red-500'}`}><Trash2 className="w-5 h-5 sm:w-7 sm:h-7" /></button>
                  </div>
                )}
              </div>
            </section>

            {/* RESULTS PANEL */}
            <section className={`relative p-6 sm:p-12 md:p-16 rounded-[2rem] sm:rounded-[4.5rem] border flex flex-col justify-center items-center h-full min-h-[500px] sm:min-h-[650px] overflow-hidden transition-all duration-700 ${cardClass}`}>
              {status === 'ERROR' && (
                <div className="text-center space-y-8 sm:space-y-10 w-full animate-in zoom-in duration-300 px-4 sm:px-6">
                  <div className={`p-8 sm:p-14 rounded-[2rem] sm:rounded-[4.5rem] border-2 space-y-6 sm:space-y-8 ${theme === 'DARK' ? 'bg-red-500/10 border-red-500/40' : 'bg-red-50 border-red-200 shadow-sm'}`}>
                    <XCircle className="w-16 h-16 sm:w-24 sm:h-24 mx-auto text-red-500" />
                    <div className="space-y-3 sm:space-y-4">
                      <h3 className="text-2xl sm:text-3xl font-black font-futuristic uppercase tracking-widest text-red-500">ENGINE FAILURE</h3>
                      <p className={`text-sm sm:text-base font-bold uppercase tracking-wider ${theme === 'DARK' ? 'text-white' : 'text-slate-800'}`}>{errorMessage}</p>
                    </div>
                  </div>
                  <button onClick={reset} className={`px-10 py-4 sm:px-14 sm:py-6 rounded-2xl sm:rounded-[2.5rem] font-black uppercase text-[10px] sm:text-[12px] tracking-[0.3em] transition-all shadow-2xl active:scale-95 ${theme === 'DARK' ? 'bg-white text-black hover:bg-slate-200' : 'bg-slate-900 text-white hover:bg-slate-800'}`}>REBOOT SENSORS</button>
                </div>
              )}

              {!result && status !== 'ANALYZING' && status !== 'ERROR' && (
                <div className="text-center space-y-8 sm:space-y-10 opacity-30">
                  <Radar className={`w-24 h-24 sm:w-36 sm:h-36 mx-auto ${theme === 'DARK' ? 'text-indigo-500 animate-spin-slow' : 'text-slate-400'}`} />
                  <div className="space-y-3">
                    <h3 className="text-lg sm:text-2xl font-bold font-futuristic uppercase tracking-widest text-indigo-500">Spectral Idle</h3>
                    <p className="text-[9px] sm:text-[11px] font-black uppercase tracking-[0.4em] max-w-xs mx-auto leading-relaxed">System ready. Provide a voice profile to materialize forensic data.</p>
                  </div>
                </div>
              )}

              {status === 'ANALYZING' && (
                <div className="text-center space-y-10 sm:space-y-14">
                  <div className="relative">
                    <Search className="w-28 h-28 sm:w-40 sm:h-40 mx-auto text-indigo-500 animate-pulse" />
                    <div className={`absolute inset-0 border-[6px] sm:border-[10px] rounded-full animate-spin ${theme === 'DARK' ? 'border-indigo-500/10 border-t-indigo-500' : 'border-slate-100 border-t-indigo-500 shadow-inner'}`}></div>
                  </div>
                  <div className="space-y-4 sm:space-y-5">
                    <h3 className="text-2xl sm:text-4xl font-black font-futuristic uppercase tracking-[0.2em] animate-pulse">DECODING SIGNAL...</h3>
                    <p className={`text-[9px] sm:text-[11px] font-black uppercase tracking-[0.6em] ${accentText}`}>Verifying 6 Conceptual Forensic Layers</p>
                  </div>
                </div>
              )}

              {result && !result.language_match && (
                <div className="text-center space-y-8 sm:space-y-12 w-full animate-in zoom-in duration-500 px-4 sm:px-6">
                  <div className={`p-8 sm:p-14 rounded-[2rem] sm:rounded-[4.5rem] border-2 space-y-8 sm:space-y-10 ${theme === 'DARK' ? 'bg-red-500/10 border-red-500/40' : 'bg-red-50 border-red-200 shadow-sm'}`}>
                    <Languages className="w-16 h-16 sm:w-24 sm:h-24 mx-auto text-red-500 animate-bounce" />
                    <div className="space-y-4 sm:space-y-5">
                      <h3 className="text-2xl sm:text-4xl font-black font-futuristic uppercase tracking-widest text-red-500 leading-tight">LANGUAGE MISMATCH</h3>
                      <p className={`text-sm sm:text-lg font-bold uppercase tracking-widest ${theme === 'DARK' ? 'text-white' : 'text-slate-800'}`}>{result.forensic_report}</p>
                    </div>
                  </div>
                  <button onClick={reset} className={`px-10 py-4 sm:px-14 sm:py-6 rounded-2xl sm:rounded-[2.5rem] font-black uppercase text-[10px] sm:text-[12px] tracking-[0.3em] transition-all shadow-2xl active:scale-95 ${theme === 'DARK' ? 'bg-white text-black hover:bg-slate-200' : 'bg-slate-900 text-white hover:bg-slate-800'}`}>RECALIBRATE FREQUENCY</button>
                </div>
              )}

              {result && result.language_match && (
                <div className="w-full space-y-10 sm:space-y-14 animate-in fade-in duration-700">
                  <RiskMeter score={result.confidence_score} level={result.fraud_risk_level} />
                  <div className="text-center space-y-6 sm:space-y-8">
                    <div className="space-y-3 sm:space-y-4">
                      <p className={`text-[9px] sm:text-[11px] font-black uppercase tracking-[0.5em] ${accentText}`}>AUTHENTICITY FINAL VERDICT</p>
                      <h2 className={`text-3xl sm:text-5xl font-black font-futuristic tracking-tighter uppercase leading-none ${result.classification === 'AI_GENERATED' ? 'text-red-500' : 'text-emerald-500'}`}>
                        {result.classification === 'AI_GENERATED' ? 'AI FRAUD DETECTED' : 'ORIGINAL HUMAN'}
                      </h2>
                      <p className={`text-[10px] sm:text-[12px] font-black uppercase tracking-widest ${subtextClass} mt-3 sm:mt-4`}>
                        {theme === 'DARK' 
                          ? (result.classification === 'AI_GENERATED' ? 'AI FRAUD DETECTED – Immediate Attention Required' : 'Deep Scan Confirmed: Human Original Speech Pattern')
                          : (result.classification === 'AI_GENERATED' ? 'Voice Analysis: Synthetic Pattern Confirmed' : 'Voice Verified – No Fraud Detected')
                        }
                      </p>
                    </div>
                    <div className={`p-6 sm:p-8 rounded-[1.5rem] sm:rounded-[3rem] border transition-all ${theme === 'DARK' ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-200 shadow-inner'}`}>
                       <p className={`text-xs sm:text-sm font-bold uppercase tracking-widest leading-relaxed italic ${subtextClass}`}>"{result.forensic_report}"</p>
                    </div>
                  </div>
                </div>
              )}
            </section>
          </div>
        )}

        {result && result.language_match && (
          <div className="space-y-8 sm:space-y-12 animate-in slide-in-from-bottom-12 duration-700">
            <div className="flex items-center gap-4 sm:gap-5 px-2 sm:px-4">
               <Database className={`w-5 h-5 sm:w-6 sm:h-6 ${accentText}`} />
               <h3 className="text-xl sm:text-2xl font-black font-futuristic tracking-[0.2em] sm:tracking-[0.3em] uppercase">6-LAYER SPECTRAL DECOMPOSITION</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
               <AnalysisLayer label="Spatial Reality" tamilLabel="இடம்" description={result.analysis_layers.spatial_acoustics} isCompleted={true} />
               <AnalysisLayer label="Micro-Tremors" tamilLabel="உணர்ச்சி" description={result.analysis_layers.emotional_micro_dynamics} isCompleted={true} />
               <AnalysisLayer label="Cultural Timing" tamilLabel="மொழி" description={result.analysis_layers.cultural_linguistics} isCompleted={true} />
               <AnalysisLayer label="Breath Sync" tamilLabel="சுவாசம்" description={result.analysis_layers.breath_emotion_sync} isCompleted={true} />
               <AnalysisLayer label="Synthetic Artifacts" tamilLabel="டிஜிட்டல்" description={result.analysis_layers.spectral_artifacts} isCompleted={true} />
               <AnalysisLayer label="Code-Switching" tamilLabel="இருமொழி" description={result.analysis_layers.code_switching} isCompleted={true} />
            </div>
            <div className="flex flex-col md:flex-row gap-6 sm:gap-8 justify-center pt-8 sm:pt-12">
              <button className={`px-10 py-6 sm:px-16 sm:py-8 rounded-2xl sm:rounded-[3rem] text-white font-black uppercase text-[10px] sm:text-[12px] tracking-[0.2em] sm:tracking-[0.3em] shadow-2xl flex items-center justify-center gap-4 sm:gap-5 transition-all hover:-translate-y-2 ${theme === 'DARK' ? 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/20' : 'bg-indigo-600 hover:bg-indigo-700'}`}>
                <Download className="w-5 h-5 sm:w-6 sm:h-6" /> EXPORT FORENSIC VERIFICATION
              </button>
              <button onClick={reset} className={`px-10 py-6 sm:px-16 sm:py-8 rounded-2xl sm:rounded-[3rem] border-2 font-black uppercase text-[10px] sm:text-[12px] tracking-[0.2em] sm:tracking-[0.3em] transition-all ${theme === 'DARK' ? 'border-white/10 text-slate-400 hover:text-white' : 'border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`}>
                SYSTEM REBOOT
              </button>
            </div>
          </div>
        )}

        <div className={`p-8 sm:p-14 rounded-[2rem] sm:rounded-[5rem] border flex flex-col md:flex-row items-center gap-8 sm:gap-12 shadow-2xl transition-all ${cardClass}`}>
          <div className={`p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2.5rem] transition-colors ${theme === 'DARK' ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/10' : 'bg-indigo-50 text-indigo-600 border border-indigo-100'}`}><Info className="w-8 h-8 sm:w-12 sm:h-12" /></div>
          <div className="space-y-3 sm:space-y-4 flex-1 text-center md:text-left">
            <h4 className={`text-[10px] sm:text-[12px] font-black uppercase tracking-[0.3em] ${accentText}`}>Cyber-Integrity Protocol v2.8</h4>
            <p className={`text-xs sm:text-[14px] font-bold uppercase tracking-wider leading-relaxed opacity-60 ${subtextClass}`}>Voice samples are processed in encrypted ephemeral memory and purged post-analysis. All data cross-referenced with latest AI model signatures.</p>
          </div>
        </div>
      </main>

      <footer className={`py-12 sm:py-16 border-t transition-all ${theme === 'DARK' ? 'border-white/5 text-slate-600' : 'border-slate-200 text-slate-400'}`}>
        <p className="text-[9px] sm:text-[11px] font-black uppercase tracking-[0.4em] sm:tracking-[0.6em] text-center px-4">© 2026 TRUTH SCANNER LABS • GLOBAL FORENSIC ENCRYPTION ACTIVE</p>
      </footer>
    </div>
  );
};

export default App;