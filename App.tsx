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
import { analyzeForensicInput, simulateForensicDiagnostic } from './services/geminiService';
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
  TrendingUp, BarChart3, AlertCircle, Key, Users, Ban, MessageSquare
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
  const [textInput, setTextInput] = useState('');
  const [analysisType, setAnalysisType] = useState<'AUDIO' | 'TEXT'>('AUDIO');
  const [history, setHistory] = useState<AnalysisResult[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [recordingStream, setRecordingStream] = useState<MediaStream | null>(null);
  const [audioUrl, setAudioUrl] = useState('');
  const [showUrlPanel, setShowUrlPanel] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.body.className = theme === 'DARK' ? 'dark-theme' : 'light-theme';
    const saved = localStorage.getItem('forensic_history_buildathon_v1');
    if (saved) setHistory(JSON.parse(saved));
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'DARK' ? 'LIGHT' : 'DARK');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsLoggingIn(true);
    const email = loginEmail.toLowerCase().trim();
    if (!email.includes('@truthscanner.ai')) {
      setTimeout(() => {
        setAuthError('SECURITY_FAULT: Unauthorized Access Token Required.');
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
        setAuthError('AUTHENTICATION_REJECTED: Invalid security token.');
      }
      setIsLoggingIn(false);
    }, 1200);
  };

  const handleLogout = () => { 
    setUserEmail(null); setResult(null); setAudioFile(null); setStatus('IDLE'); 
  };

  const runAnalysis = async (inputToAnalyze?: File | Blob | string) => {
    const input = inputToAnalyze || (analysisType === 'AUDIO' ? audioFile : textInput);
    if (!input) return;
    
    setStatus('ANALYZING');
    setResult(null);
    setErrorMessage(null);
    
    try {
      const res = await analyzeForensicInput(input, language);
      finishAnalysis(res);
    } catch (err: any) {
      setErrorMessage(err.message || "UPLINK_FAILURE");
      setStatus('ERROR');
    }
  };

  const finishAnalysis = (res: AnalysisResult) => {
    setResult(res);
    setStatus('COMPLETED');
    const updatedHistory = [{ ...res, id: crypto.randomUUID() }, ...history].slice(0, 50);
    setHistory(updatedHistory);
    localStorage.setItem('forensic_history_buildathon_v1', JSON.stringify(updatedHistory));
  };

  const deleteHistoryItem = (id: string) => {
    const updatedHistory = history.filter(h => h.id !== id);
    setHistory(updatedHistory);
    localStorage.setItem('forensic_history_buildathon_v1', JSON.stringify(updatedHistory));
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
        runAnalysis(blob);
      };
      recorder.start();
      setStatus('RECORDING');
    } catch (err) {
      setErrorMessage("HARDWARE_FAILURE: Mic access denied.");
      setStatus('ERROR');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  const reset = () => { 
    setAudioFile(null); setTextInput(''); setResult(null); setStatus('IDLE'); setErrorMessage(null); setAudioUrl(''); setShowUrlPanel(false);
  };

  // DASHBOARD CALCULATIONS
  const totalScans = history.length;
  const threatCount = history.filter(h => h.risk_level === 'HIGH' || h.final_verdict === 'AI_GENERATED_FRAUD').length;
  const safeCount = totalScans - threatCount;

  // THEME VARS
  const themeClass = theme === 'DARK' ? 'bg-transparent text-slate-100' : 'bg-transparent text-slate-900';
  const cardClass = theme === 'DARK' ? 'bg-[#0d1117]/90 border-white/5 shadow-2xl' : 'bg-white/95 border-slate-200 shadow-xl';
  const accentText = theme === 'DARK' ? 'text-indigo-400' : 'text-indigo-700';
  const headingText = theme === 'DARK' ? 'text-white' : 'text-slate-950';
  const mutedText = theme === 'DARK' ? 'text-slate-500' : 'text-slate-600';
  const subtextClass = theme === 'DARK' ? 'text-slate-400' : 'text-slate-500';
  const meta = LANGUAGE_METADATA[language];

  if (!userEmail) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className={`w-full max-w-md p-8 sm:p-14 rounded-[3rem] border glass ${cardClass} relative overflow-hidden`}>
          {isLoggingIn && (
            <div className="absolute inset-0 z-50 bg-black/70 backdrop-blur-md flex flex-col items-center justify-center text-white space-y-4">
              <RefreshCcw className="w-12 h-12 animate-spin text-indigo-400" />
              <p className="text-[10px] font-black uppercase tracking-[1em]">Authorizing</p>
            </div>
          )}
          <div className="flex flex-col items-center gap-6 mb-12">
            <div className="p-10 rounded-[2.5rem] bg-indigo-600 text-white shadow-2xl">
              <Shield className="w-16 h-16" />
            </div>
            <div className="text-center">
              <h1 className={`text-3xl font-black font-futuristic tracking-[0.2em] uppercase ${accentText}`}>TRUTH SCANNER</h1>
              <p className={`text-[10px] font-black uppercase tracking-[0.5em] ${mutedText}`}>ELITE FORENSIC SUITE v5.0</p>
            </div>
          </div>
          <form onSubmit={handleLogin} className="space-y-6">
            <input type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} placeholder="OPERATOR EMAIL" className={`w-full rounded-2xl py-5 px-6 border outline-none font-bold text-sm ${theme === 'DARK' ? 'bg-black/40 border-white/10 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`} required />
            <input type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} placeholder="SECURITY TOKEN" className={`w-full rounded-2xl py-5 px-6 border outline-none font-bold text-sm ${theme === 'DARK' ? 'bg-black/40 border-white/10 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`} required />
            {authError && <p className="text-[10px] font-black uppercase text-red-500 text-center tracking-widest">{authError}</p>}
            <button type="submit" className="w-full py-6 rounded-3xl font-black uppercase tracking-[0.4em] bg-indigo-600 text-white shadow-2xl hover:bg-indigo-700 active:scale-95 transition-all text-xs">
               <Fingerprint className="inline-block w-6 h-6 mr-3 -mt-1" /> ACCESS TERMINAL
            </button>
            <div className="flex justify-center gap-8 pt-2">
               <button type="button" onClick={() => { setLoginEmail(CREDENTIALS.ADMIN.email); setLoginPassword(CREDENTIALS.ADMIN.password); }} className={`text-[9px] font-black uppercase tracking-widest ${accentText} opacity-60 hover:opacity-100`}>ADMIN_UPLINK</button>
               <button type="button" onClick={() => { setLoginEmail(CREDENTIALS.USER.email); setLoginPassword(CREDENTIALS.USER.password); }} className={`text-[9px] font-black uppercase tracking-widest text-emerald-600 opacity-60 hover:opacity-100`}>USER_UPLINK</button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-500 ${themeClass}`}>
      <header className={`sticky top-0 z-50 glass border-b px-6 sm:px-12 flex justify-between items-center h-20 ${theme === 'DARK' ? 'bg-black/80 border-white/5' : 'bg-white/95 border-slate-300'}`}>
        <div className="flex items-center gap-4">
          <Shield className={`w-8 h-8 ${accentText}`} />
          <div className="hidden sm:block">
            <h1 className={`text-xl font-black font-futuristic tracking-[0.2em] uppercase leading-none ${headingText}`}>TRUTH SCANNER</h1>
            <span className={`text-[10px] font-bold uppercase tracking-[0.5em] ${mutedText}`}>BUILDATHON_CORE</span>
          </div>
        </div>
        <div className="flex items-center gap-4 sm:gap-8">
          <div className="flex items-center bg-black/10 p-1 rounded-2xl border border-white/5">
             <button onClick={() => setAnalysisType('AUDIO')} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${analysisType === 'AUDIO' ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}>AUDIO</button>
             <button onClick={() => setAnalysisType('TEXT')} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${analysisType === 'TEXT' ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}>TEXT</button>
          </div>
          <button onClick={toggleTheme} className={`p-3 rounded-2xl border ${theme === 'DARK' ? 'bg-white/5 border-white/10' : 'bg-slate-100 border-slate-300'}`}>
            {theme === 'DARK' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-indigo-800" />}
          </button>
          <button onClick={handleLogout} className="p-3 rounded-2xl text-red-600 border border-red-200 hover:bg-red-500/10"><LogOut className="w-5 h-5" /></button>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-10 lg:p-14 space-y-10">
        {role === 'ADMIN' ? (
          <div className="space-y-12 animate-in fade-in slide-in-from-top-4 duration-1000">
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { label: 'System Requests', val: totalScans, icon: Network, color: 'text-indigo-500' },
                  { label: 'Fraud Attacks Blocked', val: threatCount, icon: ShieldAlert, color: 'text-red-600' },
                  { label: 'Safe Signals Verified', val: safeCount, icon: ShieldCheck, color: 'text-emerald-500' },
                  { label: 'API Health', val: '99.9%', icon: Activity, color: 'text-amber-500' }
                ].map((stat, i) => (
                  <div key={i} className={`p-8 rounded-[2.5rem] border glass flex flex-col justify-between h-44 ${cardClass}`}>
                     <div className="flex justify-between">
                        <p className={`text-[10px] font-black uppercase tracking-widest ${mutedText}`}>{stat.label}</p>
                        <stat.icon className={`w-6 h-6 ${stat.color}`} />
                     </div>
                     <h4 className={`text-4xl font-black font-futuristic ${headingText}`}>{stat.val}</h4>
                  </div>
                ))}
             </div>
             <div className={`rounded-[3.5rem] border overflow-hidden ${cardClass}`}>
                <div className="overflow-x-auto">
                  <table className="w-full text-left min-w-[800px]">
                    <thead className={`text-[11px] font-black uppercase tracking-[0.2em] ${theme === 'DARK' ? 'bg-white/5 text-slate-400' : 'bg-slate-100 text-slate-600'}`}>
                        <tr><th className="px-10 py-8">ID</th><th className="px-10 py-8">Verdict</th><th className="px-10 py-8">Language</th><th className="px-10 py-8 text-right">Confidence</th><th className="px-10 py-8 text-right">Action</th></tr>
                    </thead>
                    <tbody className={`text-sm ${theme === 'DARK' ? 'text-slate-300' : 'text-slate-900'}`}>
                        {history.map(h => (
                          <tr key={h.id} className="border-b border-current/5 hover:bg-indigo-600/5 transition-colors">
                            <td className="px-10 py-8 font-mono text-xs opacity-50">{h.id.slice(0, 8)}...</td>
                            <td className="px-10 py-8">
                                <span className={`text-[10px] font-black px-4 py-2 rounded-xl border ${h.risk_level === 'HIGH' ? 'bg-red-500/10 text-red-600 border-red-500/20' : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'}`}>
                                  {h.final_verdict}
                                </span>
                            </td>
                            <td className="px-10 py-8 font-black uppercase">{h.detected_language}</td>
                            <td className="px-10 py-8 text-right font-black text-2xl">{Math.round(h.confidence_score * 100)}%</td>
                            <td className="px-10 py-8 text-right"><button onClick={() => deleteHistoryItem(h.id)} className="p-3 text-red-500"><Trash2 className="w-5 h-5" /></button></td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
             </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-stretch">
            {/* INPUT TERMINAL */}
            <section className={`p-8 sm:p-14 rounded-[4rem] border glass flex flex-col justify-between ${cardClass}`}>
               <div className="space-y-10">
                  <div className="flex justify-between items-center">
                     <div className="flex items-center gap-4">
                        <Network className={`w-8 h-8 ${accentText} animate-pulse`} />
                        <h2 className={`text-2xl sm:text-3xl font-black font-futuristic uppercase tracking-tight ${headingText}`}>INPUT GATEWAY</h2>
                     </div>
                     <select value={language} onChange={(e) => { setLanguage(e.target.value as SupportedLanguage); reset(); }} className={`px-8 py-4 rounded-2xl border text-xs font-black uppercase transition-all ${theme === 'DARK' ? 'bg-black/40 border-white/10 text-indigo-400' : 'bg-slate-50 border-slate-300 text-slate-900 shadow-sm'}`}>
                        {Object.keys(LANGUAGE_LOCALES).map(l => <option key={l} value={l}>{l}</option>)}
                     </select>
                  </div>

                  {analysisType === 'AUDIO' ? (
                    <div className="space-y-10">
                      <div className={`p-10 rounded-[3rem] border-2 h-64 flex items-center justify-center overflow-hidden ${theme === 'DARK' ? 'bg-black/40 border-indigo-500/10' : 'bg-slate-50 border-slate-300'}`}>
                         <Waveform isRecording={status === 'RECORDING'} isActive={status !== 'IDLE'} stream={recordingStream || undefined} />
                      </div>
                      <div className="grid grid-cols-3 gap-6">
                         <button onClick={status === 'RECORDING' ? stopRecording : startRecording} disabled={status === 'ANALYZING'} className={`flex flex-col items-center gap-6 py-12 rounded-[3.5rem] border-2 transition-all group ${status === 'RECORDING' ? 'bg-red-600 border-red-500 text-white animate-pulse' : theme === 'DARK' ? 'bg-white/5 border-white/5 text-slate-500 hover:text-indigo-400' : 'bg-white border-slate-200 text-slate-700 hover:text-indigo-700 shadow-sm'}`}>
                            <Mic className="w-10 h-10 group-hover:scale-110" />
                            <span className="text-[10px] font-black uppercase tracking-widest">{status === 'RECORDING' ? 'STOP' : 'LIVE'}</span>
                         </button>
                         <button onClick={() => fileInputRef.current?.click()} disabled={status === 'ANALYZING'} className={`flex flex-col items-center gap-6 py-12 rounded-[3.5rem] border-2 transition-all group ${theme === 'DARK' ? 'bg-white/5 border-white/5 text-slate-500 hover:text-indigo-400' : 'bg-white border-slate-200 text-slate-700 hover:text-indigo-700 shadow-sm'}`}>
                            <Upload className="w-10 h-10 group-hover:scale-110" />
                            <span className="text-[10px] font-black uppercase tracking-widest">FILE</span>
                         </button>
                         <button onClick={() => setShowUrlPanel(!showUrlPanel)} disabled={status === 'ANALYZING'} className={`flex flex-col items-center gap-6 py-12 rounded-[3.5rem] border-2 transition-all group ${showUrlPanel ? 'bg-indigo-600 text-white shadow-2xl' : theme === 'DARK' ? 'bg-white/5 border-white/5 text-slate-500 hover:text-indigo-400' : 'bg-white border-slate-200 text-slate-700 hover:text-indigo-700 shadow-sm'}`}>
                            <Link className="w-10 h-10 group-hover:scale-110" />
                            <span className="text-[10px] font-black uppercase tracking-widest">URL</span>
                         </button>
                         <input ref={fileInputRef} type="file" accept="audio/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) { setAudioFile(f); runAnalysis(f); } }} className="hidden" />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-8">
                       <textarea value={textInput} onChange={(e) => setTextInput(e.target.value)} placeholder="PASTE SMS OR MESSAGE CONTENT HERE..." className={`w-full h-64 p-8 rounded-[3rem] border-2 outline-none font-bold text-lg leading-relaxed transition-all ${theme === 'DARK' ? 'bg-black/40 border-white/10 text-white focus:border-indigo-500' : 'bg-slate-50 border-slate-300 text-slate-950 focus:border-indigo-700'}`} />
                       <button onClick={() => runAnalysis()} disabled={!textInput || status === 'ANALYZING'} className={`w-full py-6 rounded-[2.5rem] bg-indigo-600 text-white font-black uppercase tracking-[0.5em] shadow-2xl hover:bg-indigo-700 active:scale-95 transition-all text-xs flex items-center justify-center gap-4`}>
                          <MessageSquare className="w-6 h-6" /> ANALYZE MESSAGE
                       </button>
                    </div>
                  )}
               </div>

               {showUrlPanel && (
                 <form onSubmit={(e) => { e.preventDefault(); runAnalysis(audioUrl); }} className="mt-10 p-10 rounded-[3rem] border border-indigo-600/30 bg-indigo-600/5 space-y-6">
                    <input type="url" value={audioUrl} onChange={(e) => setAudioUrl(e.target.value)} placeholder="https://source.com/signal.mp3" className={`w-full py-5 px-8 rounded-2xl border outline-none font-bold text-sm ${theme === 'DARK' ? 'bg-black/60 border-white/10 text-white' : 'bg-white border-slate-300 text-slate-900'}`} required />
                    <button type="submit" className="w-full py-5 bg-indigo-600 text-white rounded-3xl font-black uppercase tracking-widest">EXTRACT SIGNAL</button>
                 </form>
               )}

               {audioFile && (
                 <div className={`mt-10 p-8 rounded-[3.5rem] border flex items-center justify-between shadow-2xl ${theme === 'DARK' ? 'bg-indigo-600/10 border-indigo-500/40' : 'bg-indigo-50 border-indigo-300'}`}>
                    <div className="flex items-center gap-6 overflow-hidden">
                       <FileText className={`w-10 h-10 ${accentText}`} />
                       <div className="truncate"><p className={`font-black uppercase text-base truncate ${headingText}`}>{audioFile instanceof File ? audioFile.name : 'signal.bin'}</p></div>
                    </div>
                    <button onClick={reset} className="p-4 text-red-500"><X className="w-7 h-7" /></button>
                 </div>
               )}
            </section>

            {/* RESULT PANEL */}
            <section className={`p-8 sm:p-20 rounded-[4rem] border glass flex flex-col justify-center items-center h-full min-h-[600px] relative overflow-hidden ${cardClass}`}>
               {status === 'ANALYZING' && (
                  <div className="text-center space-y-12">
                     <Radar className={`w-48 h-48 mx-auto animate-spin-slow ${accentText} opacity-30`} />
                     <h3 className={`text-4xl font-black font-futuristic uppercase tracking-[0.5em] ${headingText}`}>SCANNING...</h3>
                  </div>
               )}

               {result && (
                  <div className="w-full space-y-12 animate-in zoom-in duration-700">
                     <div className="text-center space-y-10">
                        <div className="flex flex-col items-center gap-8">
                           <div className={`p-16 rounded-[5rem] border-2 shadow-2xl ${result.risk_level === 'HIGH' ? 'bg-red-600/10 border-red-600 shadow-red-500/20' : 'bg-emerald-600/10 border-emerald-600 shadow-emerald-500/20'}`}>
                              {result.risk_level === 'HIGH' ? <ShieldAlert className="w-32 h-32 text-red-600" /> : <ShieldCheck className="w-32 h-32 text-emerald-600" />}
                           </div>
                           <div className="space-y-4">
                              <h2 className={`text-5xl sm:text-7xl font-black font-futuristic uppercase tracking-tighter leading-none ${result.risk_level === 'HIGH' ? 'text-red-600' : 'text-emerald-600'}`}>
                                 {result.final_verdict.replace('_', ' ')}
                              </h2>
                              <p className={`text-[14px] font-black uppercase tracking-[0.6em] ${subtextClass}`}>{result.detected_language} | RISK: {result.risk_level}</p>
                           </div>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-10 items-center justify-center">
                           <RiskMeter score={result.confidence_score} level={result.risk_level} theme={theme} />
                           <div className={`p-8 rounded-[3rem] border-2 max-w-sm text-left ${theme === 'DARK' ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
                              <h5 className={`text-[11px] font-black uppercase tracking-widest ${mutedText} mb-4`}>VERDICT EVIDENCE</h5>
                              <p className={`text-sm font-bold uppercase leading-relaxed italic ${theme === 'DARK' ? 'text-slate-300' : 'text-slate-900'}`}>{result.voice_forensics.analysis_layers.emotional_micro_dynamics}</p>
                           </div>
                        </div>
                        <div className="flex justify-center gap-6 pt-4">
                           {result.safety_actions.map(action => (
                              <button key={action} className={`px-10 py-5 rounded-[2rem] font-black uppercase text-[10px] tracking-widest shadow-xl transition-all hover:-translate-y-1 active:scale-95 ${action === 'BLOCK' ? 'bg-red-600 text-white' : action === 'REPORT' ? 'bg-amber-600 text-white' : 'bg-slate-500 text-white'}`}>
                                 {action} NOW
                              </button>
                           ))}
                        </div>
                     </div>
                  </div>
               )}

               {status === 'IDLE' && (
                  <div className="text-center space-y-10 opacity-60">
                     <Radar className={`w-48 h-48 mx-auto ${theme === 'DARK' ? 'text-indigo-500 animate-spin-slow' : 'text-slate-400'}`} />
                     <h3 className={`text-3xl font-black font-futuristic uppercase tracking-[0.4em] ${accentText}`}>READY_UPLINK</h3>
                  </div>
               )}

               {status === 'ERROR' && (
                  <div className="text-center space-y-8 animate-in zoom-in p-10">
                     <AlertTriangle className="w-24 h-24 mx-auto text-red-600" />
                     <h3 className="text-4xl font-black font-futuristic uppercase text-red-600">LINK_FAULT</h3>
                     <div className={`p-6 rounded-3xl border border-red-500/20 bg-red-500/5 font-bold uppercase tracking-widest text-xs ${theme === 'DARK' ? 'text-red-400' : 'text-red-900'}`}>{errorMessage}</div>
                     <button onClick={reset} className="px-12 py-6 rounded-[3rem] font-black uppercase text-xs bg-indigo-600 text-white shadow-2xl">RE-SYNC CORE</button>
                  </div>
               )}
            </section>
          </div>
        )}

        {result && (
           <div className="space-y-12 animate-in slide-in-from-bottom-20 duration-1000 pb-32">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-10 px-6">
                 <div className="flex items-center gap-6">
                    <div className="p-5 rounded-[2rem] bg-indigo-600/10 text-indigo-700 border border-indigo-600/20 shadow-xl"><BarChart3 className="w-10 h-10" /></div>
                    <div className="space-y-1">
                       <h3 className={`text-3xl sm:text-5xl font-black font-futuristic tracking-tighter uppercase ${headingText}`}>BIO-INTELLIGENCE MATRIX</h3>
                       <p className={`text-[10px] font-black uppercase tracking-[0.5em] ${mutedText}`}>Stage 2 forensic decomposition</p>
                    </div>
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                 <AnalysisLayer label="Spatial Acoustics" localizedLabel={meta.layers.spatial} description={result.voice_forensics.analysis_layers.spatial_acoustics} isCompleted={true} theme={theme} />
                 <AnalysisLayer label="Emotional Micro-Tremor" localizedLabel={meta.layers.emotional} description={result.voice_forensics.analysis_layers.emotional_micro_dynamics} isCompleted={true} theme={theme} />
                 <AnalysisLayer label="Cultural Phonetics" localizedLabel={meta.layers.cultural} description={result.voice_forensics.analysis_layers.cultural_linguistics} isCompleted={true} theme={theme} />
                 <AnalysisLayer label="Respiratory Sync" localizedLabel={meta.layers.respiratory} description={result.voice_forensics.analysis_layers.breath_emotion_sync} isCompleted={true} theme={theme} />
                 <AnalysisLayer label="Spectral Artifacts" localizedLabel={meta.layers.spectral} description={result.voice_forensics.analysis_layers.spectral_artifacts} isCompleted={true} theme={theme} />
                 <AnalysisLayer label="Linguistic Flow" localizedLabel={meta.layers.linguistic} description={result.voice_forensics.analysis_layers.code_switching} isCompleted={true} theme={theme} />
              </div>

              {result.spam_behavior.scam_patterns.length > 0 && (
                <div className={`p-10 rounded-[4rem] border-2 shadow-2xl space-y-8 ${theme === 'DARK' ? 'bg-amber-600/5 border-amber-600/30' : 'bg-amber-50 border-amber-300'}`}>
                   <div className="flex items-center gap-5">
                      <AlertTriangle className="w-10 h-10 text-amber-600" />
                      <h3 className={`text-3xl font-black font-futuristic uppercase tracking-tighter ${theme === 'DARK' ? 'text-amber-500' : 'text-amber-700'}`}>STAGE 1: BEHAVIOR_THREATS_DETECTED</h3>
                   </div>
                   <div className="flex flex-wrap gap-4">
                      {result.spam_behavior.scam_patterns.map(pattern => (
                        <span key={pattern} className="px-6 py-3 rounded-2xl bg-amber-600 text-white font-black uppercase text-[10px] tracking-widest shadow-lg">{pattern}</span>
                      ))}
                   </div>
                </div>
              )}

              <div className="flex justify-center pt-10">
                 <button onClick={reset} className="w-full sm:w-auto px-16 py-10 rounded-[5rem] bg-indigo-600 text-white font-black uppercase tracking-[0.5em] shadow-[0_40px_80px_rgba(79,70,229,0.3)] hover:bg-indigo-700 transition-all text-sm flex items-center justify-center gap-6">
                    <RefreshCcw className="w-8 h-8" /> NEW SIGNAL EXTRACTION
                 </button>
              </div>
           </div>
        )}
      </main>

      <footer className={`py-20 border-t transition-colors mt-auto ${theme === 'DARK' ? 'border-white/5 text-slate-700' : 'border-slate-300 text-slate-600'}`}>
         <div className="max-w-7xl mx-auto px-8 flex flex-col md:flex-row justify-between items-center gap-10">
            <div className="flex flex-col md:flex-row items-center gap-8">
               <Shield className="w-8 h-8 opacity-20" />
               <div className="text-center md:text-left">
                  <p className="text-[12px] font-black uppercase tracking-[0.5em] mb-1">VOICE TRUTH SCANNER v5.0 © 2026</p>
                  <p className="text-[9px] font-bold uppercase tracking-[0.3em] opacity-40">INDIA AI IMPACT BUILDATHON - SECURE NODE_772</p>
               </div>
            </div>
            <div className="flex flex-wrap justify-center gap-10">
               {['NETWORK_STABLE', 'AES-512_ENCRYPTED', 'PRIVACY_COMPLIANT'].map(i => (
                 <span key={i} className="text-[10px] font-black uppercase tracking-widest opacity-60 transition-all">{i}</span>
               ))}
            </div>
         </div>
      </footer>
    </div>
  );
};

export default App;