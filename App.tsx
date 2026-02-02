import React, { useState, useEffect, useRef } from 'react';
import { 
  Role, 
  AppStatus, 
  AnalysisResult, 
  SupportedLanguage, 
  LANGUAGE_LOCALES, 
  LANGUAGE_METADATA, 
  Theme 
} from './types';
import { analyzeForensicAudio, simulateForensicDiagnostic } from './services/geminiService';
import Waveform from './components/Waveform';
import RiskMeter from './components/RiskMeter';
import AnalysisLayer from './components/AnalysisLayer';
import { 
  Shield, Upload, Mic, Trash2, Download, 
  Lock, User, Fingerprint, LogOut, 
  Globe, FileText, Radar, Search, Activity, 
  Sun, Moon, ShieldAlert,
  RefreshCcw, ShieldCheck, ShieldX, X,
  Zap, AlertTriangle, AlertOctagon, Link,
  Waves, Cpu, Network, Database,
  TrendingUp, BarChart3, AlertCircle, Key, Users, Ban
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
  const [isInstantMode, setIsInstantMode] = useState(false);
  const [audioUrl, setAudioUrl] = useState('');
  const [showUrlPanel, setShowUrlPanel] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.body.className = theme === 'DARK' ? 'dark-theme' : 'light-theme';
    const saved = localStorage.getItem('forensic_history_v11');
    if (saved) setHistory(JSON.parse(saved));
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'DARK' ? 'LIGHT' : 'DARK');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsLoggingIn(true);
    
    // STEP 1: Security Validation
    const email = loginEmail.toLowerCase().trim();
    if (!email.includes('@truthscanner.ai')) {
      setTimeout(() => {
        setAuthError('SECURITY_FAULT: External emails are blacklisted.');
        setIsLoggingIn(false);
      }, 800);
      return;
    }

    setTimeout(() => {
      if ((email === CREDENTIALS.ADMIN.email && loginPassword === CREDENTIALS.ADMIN.password) ||
          (email === CREDENTIALS.USER.email && loginPassword === CREDENTIALS.USER.password)) {
        setUserEmail(email); 
        setRole(email === CREDENTIALS.ADMIN.email ? 'ADMIN' : 'USER');
      } else {
        setAuthError('AUTHENTICATION_REJECTED: Unauthorized Access Token.');
      }
      setIsLoggingIn(false);
    }, 1200);
  };

  const handleLogout = () => { 
    setUserEmail(null); 
    setResult(null); 
    setAudioFile(null); 
    setStatus('IDLE'); 
  };

  const runAnalysis = async (fileToAnalyze?: File | Blob) => {
    const file = fileToAnalyze || audioFile;
    if (!file && !isInstantMode) return;
    
    setStatus('ANALYZING');
    setResult(null);
    setErrorMessage(null);
    
    try {
      let res: AnalysisResult;
      if (isInstantMode && !file) {
        res = await simulateForensicDiagnostic(language);
      } else {
        if (!file) throw new Error("SIGNAL_MISSING: No biometric input detected.");
        res = await analyzeForensicAudio(file, language);
      }
      finishAnalysis(res);
    } catch (err: any) {
      setErrorMessage(err.message || "FORENSIC_LINK_FAILED");
      setStatus('ERROR');
    }
  };

  const finishAnalysis = (res: AnalysisResult) => {
    setResult(res);
    setStatus('COMPLETED');
    const updatedHistory = [{ ...res, id: crypto.randomUUID() }, ...history].slice(0, 50);
    setHistory(updatedHistory);
    localStorage.setItem('forensic_history_v11', JSON.stringify(updatedHistory));
  };

  const handleUrlUplink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!audioUrl) return;
    setStatus('ANALYZING');
    setShowUrlPanel(false);
    try {
      const response = await fetch(audioUrl);
      if (!response.ok) throw new Error("REMOTE_UPLINK_TIMEOUT");
      const blob = await response.blob();
      setAudioFile(blob);
      runAnalysis(blob);
    } catch (err: any) {
      setErrorMessage("UPLINK_ABORTED: Remote fetch failed (CORS/Network Error). Use manual upload.");
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
      recorder.ondataavailable = (e) => audioChunksRef.current.push(e.data);
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
      setErrorMessage("HARDWARE_FAILURE: Microphone access denied.");
      setStatus('ERROR');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  const reset = () => { 
    setAudioFile(null); 
    setResult(null); 
    setStatus('IDLE'); 
    setErrorMessage(null); 
    setAudioUrl(''); 
    setShowUrlPanel(false);
  };

  const deleteHistoryItem = (id: string) => {
    const updated = history.filter(item => item.id !== id);
    setHistory(updated);
    localStorage.setItem('forensic_history_v11', JSON.stringify(updated));
  };

  // ADMIN DASHBOARD CALCULATIONS
  const totalScans = history.length;
  const threatCount = history.filter(h => h.classification === 'AI_GENERATED' || !h.language_match).length;
  const humanCount = totalScans - threatCount;
  const avgConfidence = totalScans > 0 ? (history.reduce((acc, curr) => acc + curr.confidence_score, 0) / totalScans) * 100 : 0;

  // THEME VARS
  const themeClass = theme === 'DARK' ? 'bg-transparent text-slate-100' : 'bg-transparent text-slate-900';
  const cardClass = theme === 'DARK' ? 'bg-[#0d1117]/90 border-white/5 shadow-2xl' : 'bg-white/95 border-slate-200 shadow-xl';
  const accentText = theme === 'DARK' ? 'text-indigo-400' : 'text-indigo-700';
  const headingText = theme === 'DARK' ? 'text-white' : 'text-slate-950';
  const subtextClass = theme === 'DARK' ? 'text-slate-400' : 'text-slate-800';
  const mutedText = theme === 'DARK' ? 'text-slate-500' : 'text-slate-600';
  const meta = LANGUAGE_METADATA[language];

  if (!userEmail) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 sm:p-6`}>
        <div className={`w-full max-w-md p-8 sm:p-14 rounded-[2.5rem] sm:rounded-[4.5rem] border glass ${cardClass} relative overflow-hidden`}>
          {isLoggingIn && (
            <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-md flex flex-col items-center justify-center text-white space-y-6">
              <RefreshCcw className="w-12 h-12 animate-spin text-indigo-400" />
              <p className="text-[10px] font-black uppercase tracking-[1em] animate-pulse">Validating Neural Key</p>
            </div>
          )}
          <div className="flex flex-col items-center gap-8 sm:gap-12 mb-10 sm:mb-16">
            <div className="p-10 sm:p-12 rounded-[2.5rem] bg-indigo-600 text-white shadow-[0_0_50px_rgba(79,70,229,0.3)]">
              <Shield className="w-14 h-14 sm:w-20 h-20" />
            </div>
            <div className="text-center">
              <h1 className={`text-3xl sm:text-4xl font-black font-futuristic tracking-[0.2em] uppercase ${accentText}`}>TRUTH SCANNER</h1>
              <p className={`text-[10px] sm:text-[12px] font-black uppercase tracking-[0.6em] ${mutedText}`}>ELITE FORENSIC SUITE v4.5</p>
            </div>
          </div>
          <form onSubmit={handleLogin} className="space-y-6 sm:space-y-10">
            <div className="space-y-4 sm:space-y-6">
              <div className="relative">
                <User className={`absolute left-5 sm:left-6 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 h-5 ${mutedText}`} />
                <input type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} placeholder="OPERATOR EMAIL" className={`w-full rounded-2xl py-4 sm:py-6 pl-14 sm:pl-18 pr-8 border outline-none text-xs sm:text-sm font-bold transition-all ${theme === 'DARK' ? 'bg-black/40 border-white/5 text-white focus:border-indigo-500' : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-indigo-700'}`} required />
              </div>
              <div className="relative">
                <Lock className={`absolute left-5 sm:left-6 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 h-5 ${mutedText}`} />
                <input type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} placeholder="NEURAL ACCESS TOKEN" className={`w-full rounded-2xl py-4 sm:py-6 pl-14 sm:pl-18 pr-8 border outline-none text-xs sm:text-sm font-bold transition-all ${theme === 'DARK' ? 'bg-black/40 border-white/5 text-white focus:border-indigo-500' : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-indigo-700'}`} required />
              </div>
            </div>
            {authError && (
              <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                <AlertOctagon className="w-5 h-5 text-red-500" />
                <p className="text-[10px] font-black uppercase text-red-500 tracking-widest leading-relaxed">{authError}</p>
              </div>
            )}
            <button type="submit" className="w-full py-5 sm:py-7 rounded-[2rem] font-black uppercase tracking-[0.3em] sm:tracking-[0.4em] bg-indigo-600 text-white shadow-2xl hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center gap-5 text-sm">
              <Fingerprint className="w-7 h-7" /> AUTHORIZE UPLINK
            </button>
            <div className="flex justify-center gap-10 sm:gap-14 pt-2">
               <button type="button" onClick={() => { setLoginEmail(CREDENTIALS.ADMIN.email); setLoginPassword(CREDENTIALS.ADMIN.password); }} className={`text-[10px] font-black uppercase tracking-widest ${accentText} opacity-60 hover:opacity-100 transition-opacity`}>ADMIN_UPLINK</button>
               <button type="button" onClick={() => { setLoginEmail(CREDENTIALS.USER.email); setLoginPassword(CREDENTIALS.USER.password); }} className={`text-[10px] font-black uppercase tracking-widest text-emerald-600 opacity-60 hover:opacity-100 transition-opacity`}>USER_UPLINK</button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-500 relative ${themeClass}`}>
      <header className={`sticky top-0 z-50 glass border-b px-6 sm:px-12 flex justify-between items-center h-16 sm:h-24 ${theme === 'DARK' ? 'bg-black/80 border-white/5' : 'bg-white/95 border-slate-300'}`}>
        <div className="flex items-center gap-4 sm:gap-6">
          <Shield className={`w-7 h-7 sm:w-10 h-10 ${accentText}`} />
          <div className="flex flex-col">
            <h1 className={`text-base sm:text-2xl font-black font-futuristic tracking-[0.2em] uppercase leading-none ${headingText}`}>TRUTH SCANNER</h1>
            <span className={`text-[8px] sm:text-[10px] font-bold uppercase tracking-[0.5em] ${mutedText}`}>ELITE_OPERATIVE_NODE</span>
          </div>
        </div>
        <div className="flex items-center gap-3 sm:gap-8">
          <button onClick={toggleTheme} className={`p-2 sm:p-4 rounded-xl sm:rounded-2xl border transition-all ${theme === 'DARK' ? 'bg-white/5 border-white/10' : 'bg-slate-100 border-slate-300'}`}>
            {theme === 'DARK' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-indigo-800" />}
          </button>
          <button onClick={handleLogout} className="p-2 sm:p-4 rounded-xl sm:rounded-2xl text-red-600 border border-red-200 hover:bg-red-500/10 transition-colors"><LogOut className="w-5 h-5" /></button>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-10 lg:p-14 space-y-10 sm:space-y-16">
        {role === 'ADMIN' ? (
          <div className="space-y-12 animate-in fade-in slide-in-from-top-4 duration-1000">
            {/* ADMIN COMMAND CENTER */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
               {[
                 { label: 'Network Requests', val: totalScans, icon: Network, color: 'text-indigo-500' },
                 { label: 'Fraud Incidents', val: threatCount, icon: ShieldAlert, color: 'text-red-600' },
                 { label: 'Active Operators', val: 14, icon: Users, color: 'text-emerald-500' },
                 { label: 'System Accuracy', val: `${Math.round(avgConfidence)}%`, icon: TrendingUp, color: 'text-amber-500' }
               ].map((stat, i) => (
                 <div key={i} className={`p-8 rounded-[2.5rem] border glass flex flex-col justify-between h-48 sm:h-52 ${cardClass}`}>
                    <div className="flex justify-between items-start">
                       <p className={`text-[10px] font-black uppercase tracking-widest ${mutedText}`}>{stat.label}</p>
                       <stat.icon className={`w-7 h-7 ${stat.color}`} />
                    </div>
                    <h4 className={`text-4xl sm:text-5xl font-black font-futuristic ${headingText}`}>{stat.val}</h4>
                    <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-emerald-500">
                       <TrendingUp className="w-3 h-3" /> +2.4% vs L-HOUR
                    </div>
                 </div>
               ))}
            </div>

             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 px-4">
                <div className="space-y-3">
                   <p className={`text-[12px] font-black uppercase tracking-[0.5em] ${accentText}`}>CORE ANALYTICS FEED</p>
                   <h2 className={`text-3xl sm:text-5xl font-black font-futuristic tracking-tighter uppercase ${headingText}`}>CENTRAL DASHBOARD</h2>
                </div>
                <div className="flex gap-4 w-full sm:w-auto">
                   <button onClick={() => { if(window.confirm('PURGE GLOBAL ARCHIVE?')) setHistory([]); }} className="flex-1 sm:flex-none px-8 py-4 rounded-2xl border border-red-500/30 text-red-600 font-black uppercase text-[10px] tracking-widest hover:bg-red-500/10 transition-all flex items-center justify-center gap-3">
                     <ShieldX className="w-5 h-5" /> PURGE
                   </button>
                   <button className="flex-1 sm:flex-none px-8 py-4 rounded-2xl bg-indigo-600 text-white font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-3 shadow-xl">
                      <Ban className="w-5 h-5" /> BLOCK_IP
                   </button>
                </div>
             </div>
             
             <div className={`rounded-[3.5rem] border overflow-hidden ${cardClass}`}>
                <div className="overflow-x-auto">
                  <table className="w-full text-left min-w-[900px]">
                    <thead className={`text-[11px] sm:text-[13px] font-black uppercase tracking-[0.2em] ${theme === 'DARK' ? 'bg-white/5 text-slate-400' : 'bg-slate-100 text-slate-600'}`}>
                        <tr>
                          <th className="px-10 py-8">Extraction_ID</th>
                          <th className="px-10 py-8">Gateway</th>
                          <th className="px-10 py-8">Verdict</th>
                          <th className="px-10 py-8">Language_Status</th>
                          <th className="px-10 py-8 text-right">Confidence</th>
                          <th className="px-10 py-8 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className={`text-sm ${theme === 'DARK' ? 'text-slate-300' : 'text-slate-900'}`}>
                        {history.length > 0 ? history.map(h => (
                          <tr key={h.id} className="border-b border-current/5 hover:bg-indigo-600/5 transition-colors">
                            <td className="px-10 py-8 font-mono text-xs opacity-50">{h.id.slice(0, 12)}...</td>
                            <td className="px-10 py-8 font-black uppercase flex items-center gap-2">
                               <Globe className="w-4 h-4 text-indigo-500" /> {h.detected_language}
                            </td>
                            <td className="px-10 py-8">
                                <span className={`text-[10px] font-black px-4 py-2 rounded-xl flex items-center gap-3 w-fit ${h.classification === 'AI_GENERATED' ? 'bg-red-600/10 text-red-600' : 'bg-emerald-600/10 text-emerald-600'}`}>
                                  {h.classification === 'AI_GENERATED' ? <ShieldAlert className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />} 
                                  {h.classification === 'AI_GENERATED' ? 'AI_FRAUD' : 'HUMAN_ORIGINAL'}
                                </span>
                            </td>
                            <td className="px-10 py-8">
                               <span className={`text-[9px] font-black uppercase px-3 py-1 rounded-md ${h.language_match ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'}`}>
                                  {h.language_match ? 'SYNC_OK' : 'MISMATCH'}
                               </span>
                            </td>
                            <td className="px-10 py-8 text-right font-black text-2xl">{Math.round(h.confidence_score * 100)}%</td>
                            <td className="px-10 py-8 text-right">
                               <button onClick={() => deleteHistoryItem(h.id)} className="p-3 text-red-500 hover:bg-red-500/10 rounded-xl transition-all"><Trash2 className="w-5 h-5" /></button>
                            </td>
                          </tr>
                        )) : (
                          <tr>
                            <td colSpan={6} className="px-10 py-32 text-center">
                               <p className={`text-[12px] font-black uppercase tracking-[1em] ${mutedText} italic opacity-40`}>Network synchronized. Archive empty.</p>
                            </td>
                          </tr>
                        )}
                    </tbody>
                  </table>
                </div>
             </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 sm:gap-16 items-stretch">
            {/* USER TERMINAL */}
            <div className="space-y-10 sm:space-y-14 flex flex-col">
               <section className={`p-8 sm:p-16 rounded-[3rem] sm:rounded-[5rem] border glass flex flex-col justify-between flex-1 ${cardClass}`}>
                  <div className="space-y-10 sm:space-y-16">
                     <div className="flex flex-col sm:flex-row justify-between items-start gap-8">
                        <div className="space-y-3">
                           <div className="flex items-center gap-5">
                              <Network className={`w-8 h-8 ${accentText} animate-pulse`} />
                              <h2 className={`text-2xl sm:text-4xl font-black font-futuristic uppercase tracking-tighter ${headingText}`}>NEURAL GATEWAY</h2>
                           </div>
                           <p className={`text-[10px] sm:text-[13px] font-black uppercase tracking-[0.4em] sm:tracking-[0.6em] ${accentText} opacity-90`}>SECURE NODE: {meta.nativeName}</p>
                        </div>
                        <div className="w-full sm:w-auto relative group">
                           <Globe className={`absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 ${accentText} group-hover:animate-spin-slow transition-all`} />
                           <select value={language} onChange={(e) => { setLanguage(e.target.value as SupportedLanguage); reset(); }} className={`w-full sm:w-auto pl-16 pr-10 py-4 sm:py-5 rounded-[2rem] border text-[11px] sm:text-xs font-black uppercase cursor-pointer outline-none transition-all ${theme === 'DARK' ? 'bg-black/40 border-white/10 text-indigo-400 hover:border-indigo-500' : 'bg-slate-50 border-slate-300 text-slate-900 hover:border-indigo-700 shadow-sm'}`}>
                              {Object.keys(LANGUAGE_LOCALES).map(l => <option key={l} value={l}>{l}</option>)}
                           </select>
                        </div>
                     </div>

                     <div className={`p-10 rounded-[3rem] sm:rounded-[4rem] border-2 h-56 sm:h-72 flex items-center justify-center transition-all overflow-hidden ${theme === 'DARK' ? 'bg-black/60 border-indigo-500/10' : 'bg-slate-50 border-slate-300'}`}>
                        <Waveform isRecording={status === 'RECORDING'} isActive={status !== 'IDLE'} stream={recordingStream || undefined} />
                     </div>

                     <div className="grid grid-cols-3 gap-4 sm:gap-10">
                        <button onClick={status === 'RECORDING' ? stopRecording : startRecording} disabled={status === 'ANALYZING'} className={`flex flex-col items-center gap-5 sm:gap-10 py-10 sm:py-16 rounded-[3rem] sm:rounded-[4.5rem] border-2 transition-all active:scale-95 group ${status === 'RECORDING' ? 'bg-red-600 border-red-500 text-white shadow-[0_0_60px_rgba(220,38,38,0.4)] animate-pulse' : theme === 'DARK' ? 'bg-white/5 border-white/5 text-slate-500 hover:text-indigo-400 hover:border-indigo-500/40' : 'bg-white border-slate-200 text-slate-700 hover:text-indigo-700 hover:border-indigo-700 shadow-sm'}`}>
                           <Mic className="w-8 h-8 sm:w-14 h-14 group-hover:scale-110 transition-all" />
                           <span className="text-[10px] sm:text-[12px] font-black uppercase tracking-[0.2em] sm:tracking-[0.4em]">{status === 'RECORDING' ? 'STOP' : 'LIVE'}</span>
                        </button>
                        <button onClick={() => fileInputRef.current?.click()} disabled={status === 'ANALYZING'} className={`flex flex-col items-center gap-5 sm:gap-10 py-10 sm:py-16 rounded-[3rem] sm:rounded-[4.5rem] border-2 transition-all active:scale-95 group ${theme === 'DARK' ? 'bg-white/5 border-white/5 text-slate-500 hover:text-indigo-400 hover:border-indigo-500/40' : 'bg-white border-slate-200 text-slate-700 hover:text-indigo-700 hover:border-indigo-700 shadow-sm'}`}>
                           <Upload className="w-8 h-8 sm:w-14 h-14 group-hover:scale-110 transition-all" />
                           <span className="text-[10px] sm:text-[12px] font-black uppercase tracking-[0.2em] sm:tracking-[0.4em]">FILE</span>
                        </button>
                        <button onClick={() => setShowUrlPanel(!showUrlPanel)} disabled={status === 'ANALYZING'} className={`flex flex-col items-center gap-5 sm:gap-10 py-10 sm:py-16 rounded-[3rem] sm:rounded-[4.5rem] border-2 transition-all active:scale-95 group ${showUrlPanel ? 'bg-indigo-600 border-indigo-500 text-white shadow-2xl' : theme === 'DARK' ? 'bg-white/5 border-white/5 text-slate-500 hover:text-indigo-400 hover:border-indigo-500/40' : 'bg-white border-slate-200 text-slate-700 hover:text-indigo-700 hover:border-indigo-700 shadow-sm'}`}>
                           <Link className="w-8 h-8 sm:w-14 h-14 group-hover:scale-110 transition-all" />
                           <span className="text-[10px] sm:text-[12px] font-black uppercase tracking-[0.2em] sm:tracking-[0.4em]">URL</span>
                        </button>
                        <input ref={fileInputRef} type="file" accept="audio/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) { setAudioFile(f); runAnalysis(f); } }} className="hidden" />
                     </div>
                  </div>

                  {showUrlPanel && (
                    <form onSubmit={handleUrlUplink} className="mt-10 p-10 rounded-[3rem] border border-indigo-600/30 bg-indigo-600/5 space-y-8 animate-in slide-in-from-top-4 duration-500">
                       <div className="flex items-center gap-4">
                          <Link className="w-5 h-5 text-indigo-600" />
                          <p className="text-[11px] font-black uppercase tracking-[0.3em] text-indigo-700">REMOTE_BIOMETRIC_UPLINK</p>
                       </div>
                       <input type="url" value={audioUrl} onChange={(e) => setAudioUrl(e.target.value)} placeholder="https://source.com/signal.mp3" className={`w-full py-5 px-8 rounded-2xl border outline-none font-bold text-sm ${theme === 'DARK' ? 'bg-black/60 border-white/10 text-white focus:border-indigo-500' : 'bg-white border-slate-300 text-slate-900 focus:border-indigo-700'}`} required />
                       <button type="submit" className="w-full py-5 bg-indigo-600 text-white rounded-[2rem] font-black uppercase tracking-[0.5em] shadow-xl text-xs hover:bg-indigo-700 transition-all">EXTRACT REMOTE SIGNAL</button>
                    </form>
                  )}

                  {audioFile && (
                    <div className={`mt-10 p-8 rounded-[3.5rem] border flex items-center justify-between shadow-2xl ${theme === 'DARK' ? 'bg-indigo-600/10 border-indigo-500/40' : 'bg-indigo-50 border-indigo-300'}`}>
                       <div className="flex items-center gap-6 overflow-hidden">
                          <FileText className={`w-10 h-10 ${accentText}`} />
                          <div className="truncate">
                             <p className={`font-black uppercase text-base truncate ${headingText}`}>{audioFile instanceof File ? audioFile.name : 'signal_buffer.bin'}</p>
                             <p className={`text-[10px] font-bold uppercase tracking-[0.5em] ${mutedText}`}>SOURCE_LOCKED</p>
                          </div>
                       </div>
                       <button onClick={reset} className="p-4 text-red-500 hover:bg-red-500/10 rounded-2xl transition-all"><X className="w-7 h-7" /></button>
                    </div>
                  )}
               </section>
            </div>

            {/* FORENSIC READOUT PANEL */}
            <section className={`p-8 sm:p-20 rounded-[4rem] sm:rounded-[6rem] border glass flex flex-col justify-center items-center h-full min-h-[600px] sm:min-h-[850px] transition-all relative overflow-hidden ${cardClass}`}>
               {status === 'ANALYZING' && (
                  <div className="text-center space-y-12 sm:space-y-20">
                     <div className="relative">
                        <Radar className={`w-48 h-48 sm:w-64 h-64 mx-auto animate-spin-slow ${accentText} opacity-30`} />
                        <Search className={`absolute inset-0 m-auto w-24 h-24 sm:w-32 h-32 animate-pulse ${accentText}`} />
                     </div>
                     <div className="space-y-6">
                        <h3 className={`text-4xl sm:text-6xl font-black font-futuristic uppercase tracking-[0.5em] ${headingText}`}>ANALYZING</h3>
                        <p className={`text-[12px] sm:text-[14px] font-black uppercase tracking-[1em] ${accentText}`}>Verifying Bio-Signatures</p>
                     </div>
                  </div>
               )}

               {result && (
                  <div className="w-full space-y-16 animate-in zoom-in duration-1000">
                     <div className="text-center space-y-12">
                        <div className="flex flex-col items-center gap-10">
                           {(!result.language_match) ? (
                             <>
                               <div className="p-14 sm:p-20 rounded-[5rem] bg-amber-600/10 border-2 border-amber-600/50 animate-pulse">
                                  <Globe className="w-32 h-32 sm:w-48 h-48 text-amber-600" />
                               </div>
                               <div className="space-y-6 px-6">
                                  <h2 className="text-5xl sm:text-8xl font-black font-futuristic uppercase tracking-tighter text-amber-600 leading-none">GATEWAY_FAULT</h2>
                                  <p className="text-[14px] sm:text-[20px] font-black uppercase tracking-[0.5em] text-amber-700 opacity-90">Selected language does not match detected audio language</p>
                                  <div className="mt-10 p-8 rounded-[2rem] bg-amber-600 text-white text-[12px] sm:text-[16px] font-black uppercase tracking-[0.3em] mx-auto w-fit shadow-2xl">
                                     EXPECTED: {language.toUpperCase()} | DETECTED: {result.detected_language.toUpperCase()}
                                  </div>
                               </div>
                             </>
                           ) : result.classification === 'AI_GENERATED' ? (
                             <>
                               <div className="p-14 sm:p-20 rounded-[5rem] bg-red-600/10 border-2 border-red-600/50 animate-pulse shadow-[0_0_100px_rgba(220,38,38,0.25)]">
                                  <ShieldAlert className="w-32 h-32 sm:w-48 h-48 text-red-600" />
                               </div>
                               <div className="space-y-6 px-6">
                                  <h2 className="text-5xl sm:text-8xl font-black font-futuristic uppercase tracking-tighter text-red-600 leading-none">AI_GENERATED</h2>
                                  <p className="text-[14px] sm:text-[20px] font-black uppercase tracking-[0.5em] text-red-500 opacity-90">FRAUD VOICE DETECTED</p>
                               </div>
                             </>
                           ) : (
                             <>
                               <div className="p-14 sm:p-20 rounded-[5rem] bg-emerald-600/10 border-2 border-emerald-600/50 shadow-[0_0_100px_rgba(5,150,105,0.15)]">
                                  <ShieldCheck className="w-32 h-32 sm:w-48 h-48 text-emerald-600" />
                               </div>
                               <div className="space-y-6 px-6">
                                  <h2 className="text-5xl sm:text-8xl font-black font-futuristic uppercase tracking-tighter text-emerald-600 leading-none">HUMAN</h2>
                                  <p className="text-[14px] sm:text-[20px] font-black uppercase tracking-[0.5em] text-emerald-700 opacity-90">ORIGINAL VOICE VERIFIED</p>
                               </div>
                             </>
                           )}
                        </div>
                        <div className="flex flex-col sm:flex-row gap-10 items-center justify-center">
                           <RiskMeter score={result.confidence_score} level={result.fraud_risk_level} theme={theme} />
                           <div className={`p-8 rounded-[3rem] border-2 max-w-sm ${theme === 'DARK' ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
                              <div className="flex items-center gap-3 mb-4">
                                 <AlertCircle className={`w-5 h-5 ${result.classification === 'AI_GENERATED' ? 'text-red-500' : 'text-emerald-500'}`} />
                                 <h5 className={`text-[11px] font-black uppercase tracking-widest ${mutedText}`}>Forensic Summary</h5>
                              </div>
                              <p className={`text-sm font-bold uppercase tracking-tight leading-relaxed italic ${theme === 'DARK' ? 'text-slate-300' : 'text-slate-900'}`}>{result.analysis_summary}</p>
                           </div>
                        </div>
                     </div>
                  </div>
               )}

               {status === 'IDLE' && (
                  <div className="text-center space-y-12 sm:space-y-20 opacity-60">
                     <Radar className={`w-40 h-40 sm:w-64 h-64 mx-auto ${theme === 'DARK' ? 'text-indigo-500 animate-spin-slow' : 'text-slate-400'}`} />
                     <div className="space-y-6">
                        <h3 className={`text-3xl sm:text-4xl font-black font-futuristic uppercase tracking-[0.4em] ${accentText}`}>TERMINAL READY</h3>
                        <p className={`text-[12px] sm:text-[16px] font-black uppercase tracking-[0.6em] max-w-xs sm:max-w-md mx-auto leading-relaxed ${subtextClass}`}>Monitoring gateway for biometric signal ingestion. Selective node: {language}.</p>
                     </div>
                  </div>
               )}

               {status === 'ERROR' && (
                  <div className="text-center space-y-10 sm:space-y-14 animate-in zoom-in p-6 sm:p-12">
                     <AlertTriangle className="w-24 h-24 sm:w-40 h-40 mx-auto text-red-600" />
                     <div className="space-y-4 sm:space-y-6">
                        <h3 className="text-4xl sm:text-5xl font-black font-futuristic uppercase text-red-600 tracking-tighter">UPLINK_FAULT</h3>
                        <div className={`p-8 rounded-[2.5rem] border-2 border-red-500/20 bg-red-500/5 font-bold uppercase tracking-widest text-sm sm:text-base ${theme === 'DARK' ? 'text-red-400' : 'text-red-900'}`}>{errorMessage}</div>
                     </div>
                     <button onClick={reset} className="px-16 sm:px-24 py-5 sm:py-8 rounded-[2rem] sm:rounded-[4rem] font-black uppercase text-xs sm:text-sm bg-indigo-600 text-white shadow-2xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-4 mx-auto">
                        <RefreshCcw className="w-5 h-5" /> RE-SYNC CORE SYSTEM
                     </button>
                  </div>
               )}
            </section>
          </div>
        )}

        {result && (
           <div className="space-y-12 sm:space-y-20 animate-in slide-in-from-bottom-20 duration-1000 pb-20 sm:pb-40">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-10 px-8">
                 <div className="flex items-center gap-6 sm:gap-10">
                    <div className="p-5 sm:p-7 rounded-[2rem] bg-indigo-600/10 text-indigo-700 border border-indigo-600/20 shadow-xl">
                       <BarChart3 className="w-8 h-8 sm:w-12 h-12" />
                    </div>
                    <div className="space-y-1">
                       <h3 className={`text-3xl sm:text-5xl font-black font-futuristic tracking-tighter uppercase ${headingText}`}>INTELLIGENCE MATRIX</h3>
                       <p className={`text-[10px] sm:text-[12px] font-black uppercase tracking-[0.6em] ${mutedText}`}>SIGNAL BIOMETRIC DECOMPOSITION</p>
                    </div>
                 </div>
                 <button className={`px-12 py-5 rounded-[2rem] bg-white border border-slate-300 text-slate-950 font-black uppercase text-[10px] tracking-widest flex items-center gap-4 shadow-xl hover:translate-y-[-4px] transition-all`}>
                    <Download className="w-5 h-5" /> DOWNLOAD LOG
                 </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-12">
                 <AnalysisLayer label="Spatial Acoustics" localizedLabel={meta.layers.spatial} description={result.analysis_layers.spatial_acoustics} isCompleted={true} theme={theme} />
                 <AnalysisLayer label="Emotional Micro-Tremor" localizedLabel={meta.layers.emotional} description={result.analysis_layers.emotional_micro_dynamics} isCompleted={true} theme={theme} />
                 <AnalysisLayer label="Cultural Phonetics" localizedLabel={meta.layers.cultural} description={result.analysis_layers.cultural_linguistics} isCompleted={true} theme={theme} />
                 <AnalysisLayer label="Respiratory Sync" localizedLabel={meta.layers.respiratory} description={result.analysis_layers.breath_emotion_sync} isCompleted={true} theme={theme} />
                 <AnalysisLayer label="Spectral Artifacts" localizedLabel={meta.layers.spectral} description={result.analysis_layers.spectral_artifacts} isCompleted={true} theme={theme} />
                 <AnalysisLayer label="Linguistic Marker" localizedLabel={meta.layers.linguistic} description={result.analysis_layers.code_switching} isCompleted={true} theme={theme} />
              </div>

              <div className="flex justify-center pt-10">
                 <button onClick={reset} className="w-full sm:w-auto px-16 sm:px-32 py-8 sm:py-12 rounded-[2rem] sm:rounded-[6rem] bg-indigo-600 text-white font-black uppercase tracking-[0.5em] sm:tracking-[0.8em] shadow-[0_40px_80px_rgba(79,70,229,0.3)] hover:bg-indigo-700 hover:scale-[1.02] active:scale-95 transition-all text-sm sm:text-base flex items-center justify-center gap-8">
                    <RefreshCcw className="w-8 h-8" /> NEW SIGNAL EXTRACTION
                 </button>
              </div>
           </div>
        )}
      </main>

      <footer className={`py-14 sm:py-24 border-t transition-colors mt-auto ${theme === 'DARK' ? 'border-white/5 text-slate-700' : 'border-slate-300 text-slate-600'}`}>
         <div className="max-w-7xl mx-auto px-8 sm:px-14 flex flex-col md:flex-row justify-between items-center gap-10 sm:gap-16">
            <div className="flex flex-col md:flex-row items-center gap-6 sm:gap-10">
               <Shield className="w-6 h-6 sm:w-8 h-8 opacity-20" />
               <div className="text-center md:text-left">
                  <p className="text-[11px] sm:text-[14px] font-black uppercase tracking-[0.4em] sm:tracking-[0.6em] leading-none mb-2">VOICE TRUTH SCANNER v4.5 © 2026</p>
                  <p className={`text-[8px] sm:text-[10px] font-bold uppercase tracking-[0.3em] opacity-40`}>OPERATIONAL INFRASTRUCTURE BY GLOBAL SAFETY ALLIANCE</p>
               </div>
            </div>
            <div className="flex flex-wrap justify-center gap-8 sm:gap-16">
               {['NETWORK_STATUS: SECURE', 'LEGAL_COMPLIANCE', 'PRIVACY_PROTOCOL', 'UPLINK_ENCRYPTION: AES-512'].map(i => (
                 <span key={i} className="text-[9px] sm:text-[11px] font-black uppercase tracking-widest opacity-60 hover:opacity-100 cursor-pointer transition-all">{i}</span>
               ))}
            </div>
         </div>
      </footer>
    </div>
  );
};

export default App;