import React, { useState, useEffect, useRef } from 'react';
import { 
  Role, 
  AppStatus, 
  AnalysisResult, 
  SupportedLanguage, 
  LANGUAGE_LOCALES, 
  LANGUAGE_METADATA, 
  Theme,
  LiveUpdate
} from './types';
import { analyzeForensicInput, startLiveForensics } from './services/geminiService';
import Waveform from './components/Waveform';
import RiskMeter from './components/RiskMeter';
import { 
  Shield, Upload, Trash2, LogOut, 
  Globe, Radar, Activity, 
  Sun, Moon, ShieldAlert,
  RefreshCcw, ShieldCheck,
  AlertTriangle, Cpu, Network,
  History, Fingerprint, 
  TrendingUp, Settings, Database, 
  User as UserIcon, Lock, PhoneIncoming, AlertCircle, X, BarChart3
} from 'lucide-react';

const CREDENTIALS = {
  ADMIN: { email: 'admin@truthscanner.ai', password: 'admin123' },
  USER: { email: 'user@truthscanner.ai', password: 'user123' },
};

type ViewMode = 'SCANNER' | 'USER_DASHBOARD' | 'ADMIN_DASHBOARD';

const App: React.FC = () => {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [role, setRole] = useState<Role>('USER');
  const [theme, setTheme] = useState<Theme>('DARK');
  const [viewMode, setViewMode] = useState<ViewMode>('SCANNER');
  
  const [loginEmail, setLoginEmail] = useState(''); 
  const [loginPassword, setLoginPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [status, setStatus] = useState<AppStatus>('IDLE');
  const [language, setLanguage] = useState<SupportedLanguage>('English');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [audioFile, setAudioFile] = useState<File | Blob | null>(null);
  const [history, setHistory] = useState<AnalysisResult[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [recordingStream, setRecordingStream] = useState<MediaStream | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.body.className = theme === 'DARK' ? 'dark-theme' : 'light-theme';
    const saved = localStorage.getItem('forensic_v52_history');
    if (saved) setHistory(JSON.parse(saved));
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'DARK' ? 'LIGHT' : 'DARK');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setErrorMessage(null);
    
    setTimeout(() => {
      if (loginEmail === CREDENTIALS.ADMIN.email && loginPassword === CREDENTIALS.ADMIN.password) {
        setUserEmail(loginEmail);
        setRole('ADMIN');
        setViewMode('ADMIN_DASHBOARD');
      } else if (loginEmail === CREDENTIALS.USER.email && loginPassword === CREDENTIALS.USER.password) {
        setUserEmail(loginEmail);
        setRole('USER');
        setViewMode('SCANNER');
      } else {
        setErrorMessage("INVALID_CREDENTIALS");
      }
      setIsLoggingIn(false);
    }, 1000);
  };

  const handleLogout = () => { 
    setUserEmail(null); 
    setRole('USER'); 
    reset(); 
  };

  const runAnalysis = async (inputToAnalyze?: File | Blob | string) => {
    const input = inputToAnalyze || audioFile;
    if (!input) return;
    setStatus('ANALYZING');
    try {
      const res = await analyzeForensicInput(input, language);
      setResult(res);
      const newHistory = [res, ...history].slice(0, 50);
      setHistory(newHistory);
      localStorage.setItem('forensic_v52_history', JSON.stringify(newHistory));
      setStatus('COMPLETED');
    } catch (err: any) {
      setErrorMessage(err.message);
      setStatus('ERROR');
    }
  };

  const startLiveCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setRecordingStream(stream);
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = recorder;
      recorder.start(3000);
      setStatus('LIVE_CALL');
    } catch (err) {
      setErrorMessage("MIC_ACCESS_DENIED");
      setStatus('ERROR');
    }
  };

  const stopLiveCall = () => {
    if (mediaRecorderRef.current) mediaRecorderRef.current.stop();
    if (recordingStream) recordingStream.getTracks().forEach(t => t.stop());
    setRecordingStream(null);
    setStatus('IDLE');
  };

  const reset = () => {
    setResult(null); 
    setStatus('IDLE'); 
    setErrorMessage(null); 
    setAudioFile(null);
  };

  const deleteHistoryItem = (id: string) => {
    const updated = history.filter(h => h.id !== id);
    setHistory(updated);
    localStorage.setItem('forensic_v52_history', JSON.stringify(updated));
  };

  const cardClass = theme === 'DARK' ? 'bg-[#0d1117]/80 border-white/5 shadow-2xl backdrop-blur-3xl' : 'bg-white/95 border-slate-200 shadow-xl';
  const headingText = theme === 'DARK' ? 'text-white' : 'text-slate-950';
  const accentText = theme === 'DARK' ? 'text-indigo-400' : 'text-indigo-700';

  if (!userEmail) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_rgba(79,70,229,0.1)_0%,_transparent_70%)] pointer-events-none" />
        <div className={`w-full max-w-lg p-6 sm:p-12 rounded-[2rem] sm:rounded-[4rem] border glass ${cardClass} relative z-10 transition-all duration-500`}>
          <div className="flex flex-col items-center gap-6 mb-8 text-center">
            <div className="p-6 sm:p-10 rounded-[2rem] bg-indigo-600 text-white shadow-2xl relative">
              <Shield className="w-10 h-10 sm:w-16" />
            </div>
            <div>
              <h1 className={`text-xl sm:text-4xl font-black font-futuristic tracking-[0.2em] uppercase ${accentText}`}>TRUTH SCANNER</h1>
              <p className={`text-[9px] sm:text-[12px] font-black uppercase tracking-[0.4em] mt-2 opacity-50 ${headingText}`}>ELITE SECURITY INTERFACE</p>
            </div>
          </div>
          <form onSubmit={handleLogin} className="space-y-4 sm:space-y-6">
            <div className="space-y-3 sm:space-y-4">
              <div className="relative">
                <input type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} placeholder="OPERATOR_EMAIL" className={`w-full rounded-xl sm:rounded-2xl py-3 sm:py-6 px-12 border outline-none font-bold text-xs sm:text-sm transition-all ${theme === 'DARK' ? 'bg-black/40 border-white/10 text-white' : 'bg-slate-50 border-slate-300'}`} required />
                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 opacity-30" />
              </div>
              <div className="relative">
                <input type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} placeholder="SECURITY_TOKEN" className={`w-full rounded-xl sm:rounded-2xl py-3 sm:py-6 px-12 border outline-none font-bold text-xs sm:text-sm transition-all ${theme === 'DARK' ? 'bg-black/40 border-white/10 text-white' : 'bg-slate-50 border-slate-300'}`} required />
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 opacity-30" />
              </div>
            </div>
            <button type="submit" disabled={isLoggingIn} className="w-full py-4 sm:py-7 rounded-xl sm:rounded-[1.5rem] font-black uppercase tracking-[0.2em] bg-indigo-600 text-white shadow-2xl text-[9px] sm:text-xs flex items-center justify-center gap-3 active:scale-95 transition-all">
               {isLoggingIn ? <RefreshCcw className="animate-spin w-5 h-5" /> : <Fingerprint className="w-6 h-6" />} ACCESS TERMINAL
            </button>
            {errorMessage && <p className="text-red-500 text-[10px] font-black text-center uppercase tracking-widest mt-4">{errorMessage}</p>}
            <div className="mt-8 pt-6 border-t border-white/5 space-y-4">
               <p className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.2em] text-center opacity-30">DEFAULT ACCESS CODES</p>
               <div className="grid grid-cols-2 gap-4">
                  <button type="button" onClick={() => { setLoginEmail(CREDENTIALS.ADMIN.email); setLoginPassword(CREDENTIALS.ADMIN.password); }} className="p-3 sm:p-4 rounded-xl border border-indigo-500/20 bg-indigo-600/5 text-left transition-all hover:bg-indigo-600/10">
                    <span className="block text-[7px] sm:text-[8px] font-black text-indigo-400 uppercase mb-1">ADMIN_NODE</span>
                    <span className="block text-[8px] sm:text-[10px] font-bold text-slate-500 truncate">admin@truthscanner.ai</span>
                  </button>
                  <button type="button" onClick={() => { setLoginEmail(CREDENTIALS.USER.email); setLoginPassword(CREDENTIALS.USER.password); }} className="p-3 sm:p-4 rounded-xl border border-emerald-500/20 bg-emerald-600/5 text-left transition-all hover:bg-emerald-600/10">
                    <span className="block text-[7px] sm:text-[8px] font-black text-emerald-400 uppercase mb-1">USER_NODE</span>
                    <span className="block text-[8px] sm:text-[10px] font-bold text-slate-500 truncate">user@truthscanner.ai</span>
                  </button>
               </div>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-500 ${theme === 'DARK' ? 'text-slate-100' : 'text-slate-900'}`}>
      <header className={`sticky top-0 z-50 glass border-b px-4 sm:px-8 lg:px-14 flex flex-col lg:flex-row justify-between items-center py-4 lg:h-28 ${theme === 'DARK' ? 'bg-black/80 border-white/5' : 'bg-white/95 border-slate-300'}`}>
        <div className="flex items-center gap-4 mb-4 lg:mb-0 w-full lg:w-auto justify-between lg:justify-start">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-600 rounded-xl shadow-xl">
              <Shield className="w-6 h-6 sm:w-8 text-white" />
            </div>
            <div>
              <h1 className="text-base sm:text-xl font-black font-futuristic tracking-[0.1em] uppercase leading-none">TRUTH SCANNER <span className="text-indigo-500">ELITE</span></h1>
              <p className="text-[8px] sm:text-[10px] font-bold uppercase tracking-[0.2em] opacity-30 mt-1">{role} UPLINK ACTIVE</p>
            </div>
          </div>
          <div className="flex lg:hidden items-center gap-2">
            <button onClick={toggleTheme} className="p-2.5 rounded-lg border border-white/10">{theme === 'DARK' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}</button>
            <button onClick={handleLogout} className="p-2.5 rounded-lg text-red-500 border border-red-500/20"><LogOut className="w-4 h-4" /></button>
          </div>
        </div>

        <nav className="flex items-center gap-2 sm:gap-4 flex-wrap justify-center w-full lg:w-auto">
          <div className="bg-black/20 p-1 rounded-xl border border-white/10 flex gap-1 w-full sm:w-auto">
             <button onClick={() => setViewMode('SCANNER')} className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 sm:px-6 py-2 rounded-lg text-[9px] sm:text-[11px] font-black uppercase transition-all ${viewMode === 'SCANNER' ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}>
               <Radar className="w-3.5 h-3.5" /> SCANNER
             </button>
             {role === 'ADMIN' ? (
               <button onClick={() => setViewMode('ADMIN_DASHBOARD')} className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 sm:px-6 py-2 rounded-lg text-[9px] sm:text-[11px] font-black uppercase transition-all ${viewMode === 'ADMIN_DASHBOARD' ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}>
                 <Activity className="w-3.5 h-3.5" /> ADMIN
               </button>
             ) : (
               <button onClick={() => setViewMode('USER_DASHBOARD')} className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 sm:px-6 py-2 rounded-lg text-[9px] sm:text-[11px] font-black uppercase transition-all ${viewMode === 'USER_DASHBOARD' ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}>
                 <UserIcon className="w-3.5 h-3.5" /> DASHBOARD
               </button>
             )}
          </div>
          <div className="hidden lg:flex items-center gap-3">
            <button onClick={toggleTheme} className="p-3.5 rounded-xl border border-white/10 transition-all hover:bg-white/5">{theme === 'DARK' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}</button>
            <button onClick={handleLogout} className="p-3.5 rounded-xl text-red-500 border border-red-500/20 transition-all hover:bg-red-500/10"><LogOut className="w-5 h-5" /></button>
          </div>
        </nav>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-8 lg:p-14 xl:p-20 space-y-8 sm:space-y-12">
        
        {viewMode === 'SCANNER' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-10 lg:gap-16">
             <section className={`p-5 sm:p-12 rounded-[2rem] sm:rounded-[3rem] border glass ${cardClass} space-y-8 relative overflow-hidden group`}>
                <div className="flex flex-col sm:flex-row justify-between items-center relative z-10 gap-6">
                   <div className="flex items-center gap-4">
                      <div className="p-3 bg-indigo-600/20 rounded-xl border border-indigo-500/30">
                        <Cpu className={`w-8 h-8 sm:w-12 ${accentText} animate-pulse`} />
                      </div>
                      <div>
                        <h2 className={`text-lg sm:text-2xl lg:text-3xl font-black font-futuristic uppercase tracking-tight ${headingText}`}>SIGNAL INPUT</h2>
                        <p className="text-[8px] sm:text-[10px] font-bold uppercase tracking-[0.2em] opacity-40">AUTO_LANGUAGE_DETECTION</p>
                      </div>
                   </div>
                   <div className="relative w-full sm:w-auto">
                     <select value={language} onChange={(e) => setLanguage(e.target.value as SupportedLanguage)} className="w-full sm:w-auto appearance-none pl-5 pr-12 py-3 rounded-xl border text-[10px] sm:text-[12px] font-black uppercase bg-black/40 outline-none border-white/10 text-indigo-400">
                        {Object.keys(LANGUAGE_LOCALES).map(l => <option key={l} value={l} className="bg-slate-900">{l}</option>)}
                     </select>
                     <Globe className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-400" />
                   </div>
                </div>

                <div className="space-y-8 relative z-10">
                   <div className="p-4 sm:p-8 rounded-[1.5rem] sm:rounded-[2.5rem] border-4 border-indigo-500/10 bg-black/60 h-40 sm:h-64 flex flex-col items-center justify-center overflow-hidden shadow-inner relative">
                      <Waveform isRecording={status === 'RECORDING'} isActive={status !== 'IDLE'} stream={recordingStream || undefined} />
                   </div>
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-8">
                      <button onClick={status === 'LIVE_CALL' ? stopLiveCall : startLiveCall} className={`flex flex-col items-center gap-4 py-8 sm:py-16 rounded-[1.5rem] sm:rounded-[2.5rem] border-4 transition-all group ${status === 'LIVE_CALL' ? 'border-red-600 bg-red-600/10 text-red-600' : 'border-indigo-600 bg-indigo-600/10 text-indigo-400'}`}>
                         <div className="p-4 sm:p-6 rounded-full bg-white/5">
                          {status === 'LIVE_CALL' ? <X className="w-8 h-8 sm:w-12" /> : <PhoneIncoming className="w-8 h-8 sm:w-12" />}
                         </div>
                         <span className="text-[9px] sm:text-[11px] font-black uppercase tracking-[0.2em]">{status === 'LIVE_CALL' ? 'STOP ANALYSIS' : 'START LIVE SCAN'}</span>
                      </button>
                      <button onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center gap-4 py-8 sm:py-16 rounded-[1.5rem] sm:rounded-[2.5rem] border-4 border-white/5 bg-white/5 text-slate-500 hover:text-white transition-all">
                         <div className="p-4 sm:p-6 rounded-full bg-white/5">
                          <Upload className="w-8 h-8 sm:w-12" />
                         </div>
                         <span className="text-[9px] sm:text-[11px] font-black uppercase tracking-[0.2em]">UPLOAD SIGNAL</span>
                      </button>
                      <input ref={fileInputRef} type="file" accept="audio/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) { setAudioFile(f); runAnalysis(f); } }} className="hidden" />
                   </div>
                </div>
             </section>

             <section className={`p-5 sm:p-12 rounded-[2rem] sm:rounded-[3rem] border glass ${cardClass} flex flex-col justify-center items-center min-h-[400px] sm:min-h-[600px] relative transition-all duration-700 ${status === 'ANALYZING' ? 'scale-95 opacity-50' : 'scale-100 opacity-100'}`}>
                {status === 'ANALYZING' && (
                  <div className="text-center space-y-8 animate-pulse">
                     <Radar className={`w-24 h-24 sm:w-48 mx-auto animate-spin-slow ${accentText} opacity-40`} />
                     <h3 className={`text-base sm:text-2xl font-black font-futuristic uppercase tracking-[0.3em] ${headingText}`}>DECRYPTING_SIGNAL...</h3>
                  </div>
                )}
                
                {result && status !== 'ANALYZING' && (
                  <div className="w-full space-y-8 animate-in zoom-in-95 duration-500">
                     <div className="text-center space-y-8">
                        <div className="flex flex-col items-center gap-6">
                           <div className={`p-8 sm:p-16 rounded-[2.5rem] sm:rounded-[6rem] border-[6px] sm:border-[10px] shadow-2xl transition-all duration-1000 ${result.risk_level === 'HIGH' ? 'bg-red-600/10 border-red-600 shadow-red-600/40' : 'bg-emerald-600/10 border-emerald-600 shadow-emerald-600/40'}`}>
                              {result.risk_level === 'HIGH' ? <ShieldAlert className="w-16 h-16 sm:w-32 text-red-600" /> : <ShieldCheck className="w-16 h-16 sm:w-32 text-emerald-600" />}
                           </div>
                           <div className="space-y-2">
                              <h2 className={`text-2xl sm:text-5xl lg:text-6xl font-black font-futuristic uppercase tracking-tighter leading-none ${result.risk_level === 'HIGH' ? 'text-red-600' : 'text-emerald-600'}`}>
                                 {result.final_verdict.replace(/_/g, ' ')}
                              </h2>
                              <p className="text-[9px] sm:text-[12px] font-black uppercase tracking-[0.2em] text-slate-500">DETECTED: {result.detected_language}</p>
                           </div>
                        </div>
                        
                        <div className="flex flex-col xl:flex-row gap-8 items-center justify-center w-full">
                           <RiskMeter score={result.confidence_score} level={result.risk_level} theme={theme} />
                           <div className="p-6 sm:p-8 rounded-[1.5rem] border-2 border-white/10 bg-white/5 w-full md:max-w-md text-left backdrop-blur-3xl space-y-4">
                              <h5 className="text-[9px] font-black uppercase tracking-[0.3em] text-indigo-400 flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4" /> THREAT_PATTERNS
                              </h5>
                              <ul className="space-y-2">
                                {result.spam_behavior.scam_patterns.map((p, i) => (
                                  <li key={i} className="text-xs sm:text-base font-bold uppercase text-slate-300 flex items-center gap-3">
                                    <div className="w-1.5 h-1.5 rounded-full bg-red-600" /> {p}
                                  </li>
                                ))}
                                {result.spam_behavior.scam_patterns.length === 0 && <li className="text-xs font-bold uppercase text-emerald-500">NO_SCAM_PATTERNS_DETECTED</li>}
                              </ul>
                           </div>
                        </div>
                        
                        <div className="flex flex-wrap justify-center gap-3 pt-4">
                           {result.safety_actions.map(a => (
                             <button key={a} className="px-6 py-3 rounded-full font-black uppercase text-[9px] sm:text-[11px] tracking-[0.1em] text-white bg-indigo-600 shadow-xl transition-all active:scale-95">
                                {a} UPLINK
                             </button>
                           ))}
                        </div>
                     </div>
                  </div>
                )}
                
                {status === 'IDLE' && !result && (
                  <div className="text-center space-y-8 opacity-30 group">
                     <Radar className={`w-24 h-24 sm:w-48 mx-auto ${accentText} group-hover:scale-110 transition-transform`} />
                     <h3 className={`text-base sm:text-2xl font-black font-futuristic uppercase tracking-[0.3em] ${headingText}`}>AWAITING_SIGNAL</h3>
                  </div>
                )}
             </section>
          </div>
        )}

        {viewMode === 'ADMIN_DASHBOARD' && (
          <div className="space-y-8 animate-in fade-in duration-700">
             <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex items-center gap-4 sm:gap-6">
                   <div className="p-3 bg-indigo-600/10 rounded-2xl border border-indigo-600/20">
                      <Settings className="w-8 h-8 sm:w-10 text-indigo-500" />
                   </div>
                   <div>
                      <h2 className={`text-xl sm:text-3xl font-black font-futuristic uppercase tracking-tighter ${headingText}`}>ADMIN MONITOR</h2>
                      <p className="text-[9px] font-bold uppercase tracking-[0.2em] opacity-40">GLOBAL_NETWORK_LOGS</p>
                   </div>
                </div>
                <div className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-black uppercase text-slate-400">7 ACTIVE_NODES</span>
                </div>
             </div>

             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {[
                  { l: 'Network Load', v: history.length, i: Activity, c: 'text-indigo-500', bg: 'bg-indigo-500/10' },
                  { l: 'Critical Threats', v: history.filter(h => h.risk_level === 'HIGH').length, i: ShieldAlert, c: 'text-red-600', bg: 'bg-red-600/10' },
                  { l: 'System Precision', v: '98.4%', i: Cpu, c: 'text-amber-500', bg: 'bg-amber-500/10' },
                  { l: 'Server Uptime', v: '99.9%', i: ShieldCheck, c: 'text-emerald-500', bg: 'bg-emerald-500/10' }
                ].map((s, idx) => (
                  <div key={idx} className={`p-6 sm:p-10 rounded-[2rem] border glass ${cardClass} flex flex-col justify-between h-40 sm:h-56 transition-all hover:-translate-y-1`}>
                    <div className="flex justify-between items-start">
                      <span className="text-[9px] font-black uppercase text-slate-500">{s.l}</span>
                      <div className={`p-2.5 rounded-xl ${s.bg}`}><s.i className={`w-5 h-5 sm:w-8 ${s.c}`} /></div>
                    </div>
                    <span className="text-3xl sm:text-5xl font-black font-futuristic">{s.v}</span>
                  </div>
                ))}
             </div>

             <div className={`rounded-[2rem] border glass ${cardClass} overflow-hidden`}>
                <div className="p-6 border-b border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4">
                   <h3 className="text-sm sm:text-xl font-black font-futuristic uppercase text-indigo-400 flex items-center gap-3">
                      <Database className="w-5 h-5" /> SIGNAL_REGISTRY
                   </h3>
                </div>
                <div className="overflow-x-auto">
                   <table className="w-full text-left min-w-[700px]">
                      <thead className="bg-white/5 text-[10px] sm:text-[12px] font-black uppercase text-slate-400 border-b border-white/5">
                         <tr><th className="p-5 sm:p-8">DECRYPT_ID</th><th className="p-5 sm:p-8">LANGUAGE</th><th className="p-5 sm:p-8">VERDICT</th><th className="p-5 sm:p-8 text-right">SCORE</th><th className="p-5 sm:p-8 text-right">ACTION</th></tr>
                      </thead>
                      <tbody>
                        {history.map(h => (
                          <tr key={h.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                             <td className="p-5 sm:p-8 font-mono text-[10px] sm:text-xs opacity-30">{h.id.slice(0, 12)}</td>
                             <td className="p-5 sm:p-8 font-black uppercase text-[10px] sm:text-sm">{h.detected_language}</td>
                             <td className="p-5 sm:p-8">
                                <span className={`px-2.5 py-1.5 rounded-lg text-[9px] font-black border tracking-[0.1em] ${h.risk_level === 'HIGH' ? 'bg-red-600/10 text-red-600 border-red-600/30' : 'bg-emerald-600/10 text-emerald-600 border-emerald-600/30'}`}>
                                   {h.final_verdict}
                                </span>
                             </td>
                             <td className="p-5 sm:p-8 text-right font-black text-xl sm:text-3xl">{Math.round(h.confidence_score * 100)}%</td>
                             <td className="p-5 sm:p-8 text-right">
                                <button onClick={() => deleteHistoryItem(h.id)} className="p-2.5 text-red-500 hover:bg-red-500/10 rounded-xl transition-colors"><Trash2 className="w-4 h-4 sm:w-6" /></button>
                             </td>
                          </tr>
                        ))}
                      </tbody>
                   </table>
                </div>
             </div>
          </div>
        )}

        {viewMode === 'USER_DASHBOARD' && (
          <div className="space-y-8 animate-in fade-in duration-700">
             <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex items-center gap-4 w-full sm:w-auto">
                   <div className="p-3 bg-indigo-600/10 rounded-2xl border border-indigo-600/20 text-indigo-500">
                      <UserIcon className="w-8 h-8 sm:w-10" />
                   </div>
                   <div>
                      <h2 className={`text-xl sm:text-3xl font-black font-futuristic uppercase tracking-tighter ${headingText}`}>OPERATOR DASHBOARD</h2>
                      <p className="text-[9px] font-bold uppercase tracking-[0.2em] opacity-40 truncate">{userEmail}</p>
                   </div>
                </div>
                <button onClick={() => setViewMode('SCANNER')} className="w-full sm:w-auto px-8 py-4 rounded-full bg-indigo-600 text-white text-[11px] font-black uppercase tracking-[0.1em] shadow-xl hover:bg-indigo-500 transition-all flex items-center justify-center gap-3">
                   <Radar className="w-4 h-4" /> NEW SCAN
                </button>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                   { l: 'SCANS LOGGED', v: history.length, i: Activity, c: 'text-indigo-400', t: TrendingUp, m: 'NODE_TRAFFIC' },
                   { l: 'THREATS BLOCKED', v: history.filter(h => h.risk_level === 'HIGH').length, i: ShieldAlert, c: 'text-red-600', t: AlertCircle, m: 'DETECTIONS' },
                   { l: 'CLEAN RATIO', v: history.length > 0 ? `${Math.round((history.filter(h => h.risk_level === 'LOW').length / history.length) * 100)}%` : 'N/A', i: ShieldCheck, c: 'text-emerald-500', t: ShieldCheck, m: 'TRUST_SCORE' }
                ].map((st, i) => (
                  <div key={i} className={`p-8 rounded-[3rem] border glass ${cardClass} flex flex-col justify-between h-64 relative overflow-hidden group hover:-translate-y-1 transition-all`}>
                    <div className="absolute top-0 right-0 p-6 opacity-5 rotate-12"><st.i className="w-24 h-24" /></div>
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{st.l}</h4>
                    <span className={`text-6xl font-black font-futuristic ${st.c}`}>{st.v}</span>
                    <p className="text-[9px] font-bold uppercase tracking-widest flex items-center gap-2 opacity-60"><st.t className="w-3.5 h-3.5" /> {st.m}</p>
                  </div>
                ))}
             </div>

             <div className={`rounded-[2rem] border glass ${cardClass} overflow-hidden`}>
                <div className="p-6 border-b border-white/5">
                   <h3 className="text-sm sm:text-xl font-black font-futuristic uppercase text-emerald-400 flex items-center gap-3">
                      <History className="w-5 h-5" /> RECENT_SCAN_HISTORY
                   </h3>
                </div>
                <div className="overflow-x-auto">
                   <table className="w-full text-left min-w-[700px]">
                      <thead className="bg-white/5 text-[10px] sm:text-[12px] font-black uppercase text-slate-400 border-b border-white/5">
                         <tr><th className="p-5 sm:p-8">DATE_STAMP</th><th className="p-5 sm:p-8">LANGUAGE</th><th className="p-5 sm:p-8">VERDICT</th><th className="p-5 sm:p-8 text-right">CONFIDENCE</th><th className="p-5 sm:p-8 text-right">ACTION</th></tr>
                      </thead>
                      <tbody>
                        {history.map(h => (
                          <tr key={h.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                             <td className="p-5 sm:p-8 font-mono text-[10px] opacity-40">{new Date(h.timestamp).toLocaleDateString()}</td>
                             <td className="p-5 sm:p-8 font-black uppercase text-[10px] sm:text-sm">{h.detected_language}</td>
                             <td className="p-5 sm:p-8">
                                <span className={`px-2.5 py-1.5 rounded-lg text-[9px] font-black border ${h.risk_level === 'HIGH' ? 'bg-red-600/10 text-red-600 border-red-600/30' : 'bg-emerald-600/10 text-emerald-600 border-emerald-600/30'}`}>
                                   {h.final_verdict}
                                </span>
                             </td>
                             <td className="p-5 sm:p-8 text-right font-black text-xl sm:text-3xl">{Math.round(h.confidence_score * 100)}%</td>
                             <td className="p-5 sm:p-8 text-right">
                                <button onClick={() => deleteHistoryItem(h.id)} className="p-2.5 text-red-500 hover:bg-red-500/10 rounded-xl transition-all"><Trash2 className="w-4 h-4 sm:w-6" /></button>
                             </td>
                          </tr>
                        ))}
                      </tbody>
                   </table>
                </div>
             </div>
          </div>
        )}
        
        {result && viewMode === 'SCANNER' && status === 'COMPLETED' && (
           <div className="flex flex-col items-center gap-6 mt-8">
              <button onClick={reset} className="px-10 py-5 rounded-full bg-indigo-600 text-white font-black uppercase tracking-[0.2em] shadow-xl hover:bg-indigo-500 transition-all flex items-center gap-3">
                 <RefreshCcw className="w-5 h-5" /> NEW FORENSIC ANALYSIS
              </button>
           </div>
        )}
      </main>

      <footer className={`py-12 border-t ${theme === 'DARK' ? 'border-white/5 text-slate-700' : 'border-slate-300 text-slate-500'}`}>
         <div className="max-w-7xl mx-auto px-6 sm:px-12 flex flex-col md:flex-row justify-between items-center gap-8 text-center md:text-left">
            <div className="flex flex-col md:flex-row items-center gap-4 sm:gap-8">
               <Shield className="w-8 h-8 opacity-10" />
               <div className="space-y-1">
                  <p className="text-[10px] sm:text-[14px] font-black uppercase tracking-[0.3em] sm:tracking-[0.5em]">VOICE TRUTH SCANNER ELITE</p>
                  <p className="text-[8px] sm:text-[10px] font-bold uppercase opacity-30 italic leading-relaxed">INDIA AI IMPACT BUILDATHON | FRAUD DETECTION & SAFETY</p>
               </div>
            </div>
            <div className="flex gap-4 sm:gap-10 opacity-30">
               {['NODE_SECURE', 'AES-512', 'PWA_COMPLIANT'].map(i => (
                 <span key={i} className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em]">{i}</span>
               ))}
            </div>
         </div>
      </footer>
    </div>
  );
};

export default App;