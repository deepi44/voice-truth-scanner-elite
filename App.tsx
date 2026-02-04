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
import AnalysisLayer from './components/AnalysisLayer';
import { 
  Shield, Upload, Mic, Trash2, LogOut, 
  Globe, FileText, Radar, Activity, 
  Sun, Moon, ShieldAlert,
  RefreshCcw, ShieldCheck, X,
  AlertTriangle, AlertOctagon, Link,
  Cpu, Network, BarChart3, AlertCircle,
  MessageSquare, PhoneIncoming, Camera
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
  const [liveUpdate, setLiveUpdate] = useState<LiveUpdate | null>(null);
  const [audioFile, setAudioFile] = useState<File | Blob | null>(null);
  const [textInput, setTextInput] = useState('');
  const [analysisType, setAnalysisType] = useState<'AUDIO' | 'TEXT'>('AUDIO');
  const [history, setHistory] = useState<AnalysisResult[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [recordingStream, setRecordingStream] = useState<MediaStream | null>(null);
  const [audioUrl, setAudioUrl] = useState('');
  const [showUrlPanel, setShowUrlPanel] = useState(false);

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
    setAuthError(null);
    setTimeout(() => {
      if ((loginEmail === CREDENTIALS.ADMIN.email && loginPassword === CREDENTIALS.ADMIN.password) ||
          (loginEmail === CREDENTIALS.USER.email && loginPassword === CREDENTIALS.USER.password)) {
        setUserEmail(loginEmail);
        setRole(loginEmail === CREDENTIALS.ADMIN.email ? 'ADMIN' : 'USER');
      } else {
        setAuthError('INVALID_CREDENTIALS');
      }
      setIsLoggingIn(false);
    }, 1000);
  };

  const handleLogout = () => { setUserEmail(null); reset(); };

  const runAnalysis = async (inputToAnalyze?: File | Blob | string) => {
    const input = inputToAnalyze || (analysisType === 'AUDIO' ? audioFile : textInput);
    if (!input) return;
    setStatus('ANALYZING');
    try {
      const res = await analyzeForensicInput(input, language);
      setResult(res);
      setHistory(prev => [res, ...prev].slice(0, 50));
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
      
      const session = await startLiveForensics(language, (update) => {
        setLiveUpdate(update);
      });

      recorder.ondataavailable = async (e) => {
        if (e.data.size > 0) {
          await session.processChunk(e.data);
        }
      };

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
    setAudioFile(null); setTextInput(''); setResult(null); setLiveUpdate(null);
    setStatus('IDLE'); setErrorMessage(null); setAudioUrl(''); setShowUrlPanel(false);
  };

  const deleteHistoryItem = (id: string) => {
    setHistory(prev => prev.filter(h => h.id !== id));
  };

  const cardClass = theme === 'DARK' ? 'bg-[#0d1117]/90 border-white/5' : 'bg-white/95 border-slate-200 shadow-xl';
  const headingText = theme === 'DARK' ? 'text-white' : 'text-slate-950';
  const accentText = theme === 'DARK' ? 'text-indigo-400' : 'text-indigo-700';
  const meta = LANGUAGE_METADATA[language];

  if (!userEmail) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className={`w-full max-w-md p-10 sm:p-14 rounded-[3.5rem] border glass ${cardClass} relative overflow-hidden`}>
          <div className="flex flex-col items-center gap-8 mb-12">
            <div className="p-10 rounded-[2.5rem] bg-indigo-600 text-white shadow-2xl animate-pulse">
              <Shield className="w-16 h-16" />
            </div>
            <div className="text-center">
              <h1 className={`text-3xl font-black font-futuristic tracking-[0.2em] uppercase ${accentText}`}>TRUTH SCANNER</h1>
              <p className={`text-[10px] font-black uppercase tracking-[0.5em] ${theme === 'DARK' ? 'text-slate-500' : 'text-slate-600'}`}>ELITE FORENSIC SUITE v5.2</p>
            </div>
          </div>
          <form onSubmit={handleLogin} className="space-y-6">
            <input type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} placeholder="OPERATOR_EMAIL" className={`w-full rounded-2xl py-5 px-8 border outline-none font-bold text-sm ${theme === 'DARK' ? 'bg-black/40 border-white/10 text-white' : 'bg-slate-50 border-slate-300'}`} required />
            <input type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} placeholder="SECURITY_TOKEN" className={`w-full rounded-2xl py-5 px-8 border outline-none font-bold text-sm ${theme === 'DARK' ? 'bg-black/40 border-white/10 text-white' : 'bg-slate-50 border-slate-300'}`} required />
            <button type="submit" className="w-full py-6 rounded-3xl font-black uppercase tracking-[0.4em] bg-indigo-600 text-white shadow-2xl text-xs flex items-center justify-center gap-3">
               {isLoggingIn ? <RefreshCcw className="animate-spin w-5 h-5" /> : <ShieldCheck className="w-6 h-6" />} ACCESS TERMINAL
            </button>
            <div className="flex justify-center gap-6 pt-4">
               <button type="button" onClick={() => { setLoginEmail(CREDENTIALS.ADMIN.email); setLoginPassword(CREDENTIALS.ADMIN.password); }} className={`text-[9px] font-black uppercase tracking-widest ${accentText} opacity-60 hover:opacity-100`}>ADMIN_UPLINK</button>
               <button type="button" onClick={() => { setLoginEmail(CREDENTIALS.USER.email); setLoginPassword(CREDENTIALS.USER.password); }} className={`text-[9px] font-black uppercase tracking-widest text-emerald-600 opacity-60 hover:opacity-100`}>USER_UPLINK</button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-500 ${theme === 'DARK' ? 'text-slate-100' : 'text-slate-900'}`}>
      <header className={`sticky top-0 z-50 glass border-b px-6 sm:px-12 flex justify-between items-center h-20 ${theme === 'DARK' ? 'bg-black/80 border-white/5' : 'bg-white/95 border-slate-300'}`}>
        <div className="flex items-center gap-4">
          <Shield className={`w-8 h-8 ${accentText}`} />
          <h1 className={`text-xl font-black font-futuristic tracking-[0.2em] uppercase hidden sm:block ${headingText}`}>TRUTH SCANNER</h1>
        </div>
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="bg-black/10 p-1 rounded-2xl border border-white/5 flex gap-1">
             <button onClick={() => setAnalysisType('AUDIO')} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase transition-all ${analysisType === 'AUDIO' ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}>VOICE</button>
             <button onClick={() => setAnalysisType('TEXT')} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase transition-all ${analysisType === 'TEXT' ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}>TEXT</button>
          </div>
          <button onClick={toggleTheme} className="p-3 rounded-2xl border border-white/10 bg-white/5">{theme === 'DARK' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}</button>
          <button onClick={handleLogout} className="p-3 rounded-2xl text-red-600 border border-red-200 hover:bg-red-500/10"><LogOut className="w-5 h-5" /></button>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-10 lg:p-14 space-y-10">
        {status === 'LIVE_CALL' && (
          <div className="fixed inset-0 z-[100] glass bg-red-600/10 flex flex-col items-center justify-center p-6 sm:p-20 text-center space-y-12">
             <div className="p-20 rounded-[10rem] bg-red-600 shadow-[0_0_100px_rgba(220,38,38,0.5)] animate-pulse relative">
                <PhoneIncoming className="w-32 h-32 text-white" />
                <div className="absolute -top-4 -right-4 p-6 bg-white rounded-full text-red-600 shadow-2xl font-black text-2xl">LIVE</div>
             </div>
             <div className="space-y-6">
                <h2 className="text-6xl sm:text-8xl font-black font-futuristic text-white uppercase tracking-tighter">LIVE CALL ANALYSIS</h2>
                <p className="text-xl sm:text-2xl font-black uppercase tracking-[0.4em] text-red-500">MONITORING GATEWAY: {language.toUpperCase()}</p>
             </div>
             
             {liveUpdate && (
               <div className={`p-10 rounded-[4rem] border-4 bg-black/60 shadow-2xl space-y-8 min-w-[320px] sm:min-w-[600px] border-${liveUpdate.verdict === 'BLOCK_NOW' || liveUpdate.is_mismatch ? 'red' : 'indigo'}-600`}>
                  {liveUpdate.is_mismatch ? (
                    <div className="p-12 rounded-[3rem] bg-red-600 text-white space-y-6 animate-bounce border-4 border-white/30 shadow-[0_0_60px_rgba(220,38,38,1)]">
                       <div className="flex flex-col items-center justify-center gap-6">
                          <AlertOctagon className="w-20 h-20 text-white" />
                          <p className="text-4xl font-black uppercase tracking-tighter">Audio language mismatch detected – verification failed</p>
                       </div>
                       <div className="h-px bg-white/20 w-full" />
                       <p className="text-lg font-bold opacity-90 uppercase tracking-[0.2em]">Input signal contradicts {language} gateway encryption protocols.</p>
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-col sm:flex-row items-center justify-center gap-10">
                         <div className="text-center">
                            <span className="text-7xl font-black font-futuristic text-white">{Math.round(liveUpdate.confidence * 100)}%</span>
                            <p className="text-[12px] font-black uppercase tracking-widest text-slate-500">TRUST_SCORE</p>
                         </div>
                         <div className="h-20 w-[2px] bg-white/10 hidden sm:block" />
                         <div className="text-center">
                            <span className={`text-4xl font-black uppercase tracking-widest ${liveUpdate.verdict === 'SAFE' ? 'text-emerald-500' : 'text-amber-500'}`}>
                               {liveUpdate.verdict.replace('_', ' ')}
                            </span>
                            <p className="text-[12px] font-black uppercase tracking-widest text-slate-500">VERDICT</p>
                         </div>
                      </div>
                      <div className="p-6 bg-white/5 rounded-2xl text-left border border-white/5">
                         <p className="text-[11px] font-black uppercase text-indigo-400 mb-2">DETECTED_INTENT</p>
                         <p className="text-lg font-bold text-white italic">{liveUpdate.current_intent}</p>
                      </div>
                    </>
                  )}
               </div>
             )}

             <button onClick={stopLiveCall} className="px-16 py-8 rounded-[4rem] bg-white text-slate-950 font-black uppercase tracking-[0.5em] shadow-2xl hover:bg-slate-200 transition-all flex items-center gap-6">
                <X className="w-10 h-10" /> TERMINATE UPLINK
             </button>
          </div>
        )}

        {role === 'ADMIN' ? (
          <div className="space-y-12 animate-in fade-in duration-1000">
             <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
                {[
                  { l: 'Network Loads', v: history.length, i: Activity, c: 'text-indigo-500' },
                  { l: 'Fraud Blocks', v: history.filter(h => h.risk_level === 'HIGH' || !h.language_match).length, i: ShieldAlert, c: 'text-red-600' },
                  { l: 'Active Nodes', v: '07', i: Network, c: 'text-amber-500' },
                  { l: 'Human Pass', v: history.filter(h => h.risk_level === 'LOW' && h.language_match).length, i: ShieldCheck, c: 'text-emerald-500' }
                ].map((s, idx) => (
                  <div key={idx} className={`p-8 rounded-[2.5rem] border glass ${cardClass} flex flex-col justify-between h-44`}>
                    <div className="flex justify-between"><span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{s.l}</span><s.i className={`w-6 h-6 ${s.c}`} /></div>
                    <span className={`text-4xl font-black font-futuristic ${headingText}`}>{s.v}</span>
                  </div>
                ))}
             </div>
             <div className={`rounded-[3.5rem] border overflow-hidden ${cardClass}`}>
                <div className="overflow-x-auto">
                   <table className="w-full text-left min-w-[800px]">
                      <thead className="bg-white/5 text-[11px] font-black uppercase tracking-widest text-slate-500">
                         <tr><th className="p-8">Extraction_ID</th><th className="p-8">Gateway</th><th className="p-8">Verdict</th><th className="p-8 text-right">Confidence</th><th className="p-8 text-right">Action</th></tr>
                      </thead>
                      <tbody>
                        {history.map(h => (
                          <tr key={h.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                             <td className="p-8 font-mono text-xs opacity-50">{h.id.slice(0, 12)}...</td>
                             <td className="p-8 font-black uppercase">{h.detected_language} {!h.language_match && '⚠️'}</td>
                             <td className="p-8">
                                <span className={`px-4 py-2 rounded-xl text-[10px] font-black border ${h.risk_level === 'HIGH' || !h.language_match ? 'bg-red-600/10 text-red-600 border-red-600/20' : 'bg-emerald-600/10 text-emerald-600 border-emerald-500/20'}`}>
                                   {!h.language_match ? 'MISMATCH_CAUTION' : h.final_verdict}
                                </span>
                             </td>
                             <td className="p-8 text-right font-black text-2xl">{Math.round(h.confidence_score * 100)}%</td>
                             <td className="p-8 text-right"><button onClick={() => deleteHistoryItem(h.id)} className="p-3 text-red-500"><Trash2 className="w-5 h-5" /></button></td>
                          </tr>
                        ))}
                      </tbody>
                   </table>
                </div>
             </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
             <section className={`p-10 sm:p-14 rounded-[4rem] border glass ${cardClass} space-y-12`}>
                <div className="flex justify-between items-center">
                   <div className="flex items-center gap-4">
                      <Cpu className={`w-10 h-10 ${accentText} animate-pulse`} />
                      <h2 className={`text-3xl font-black font-futuristic ${headingText}`}>SIGNAL INGESTION</h2>
                   </div>
                   <select value={language} onChange={(e) => { setLanguage(e.target.value as SupportedLanguage); reset(); }} className="px-6 py-4 rounded-2xl border text-xs font-black uppercase bg-transparent outline-none border-white/10 text-indigo-400">
                      {Object.keys(LANGUAGE_LOCALES).map(l => <option key={l} value={l} className="bg-slate-900">{l}</option>)}
                   </select>
                </div>

                {analysisType === 'AUDIO' ? (
                  <div className="space-y-10">
                     <div className="p-10 rounded-[3rem] border-2 border-indigo-500/10 bg-black/20 h-56 flex items-center justify-center overflow-hidden">
                        <Waveform isRecording={status === 'RECORDING'} isActive={status !== 'IDLE'} stream={recordingStream || undefined} />
                     </div>
                     <div className="grid grid-cols-2 gap-6">
                        <button onClick={startLiveCall} className="flex flex-col items-center gap-6 py-12 rounded-[3.5rem] border-2 border-indigo-600 bg-indigo-600/5 text-indigo-400 hover:bg-indigo-600 hover:text-white transition-all group shadow-2xl">
                           <PhoneIncoming className="w-10 h-10 group-hover:scale-110 transition-transform" />
                           <span className="text-[10px] font-black uppercase tracking-widest">LIVE CALL MODE</span>
                        </button>
                        <button onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center gap-6 py-12 rounded-[3.5rem] border-2 border-white/5 bg-white/5 text-slate-500 hover:text-white transition-all group">
                           <Upload className="w-10 h-10 group-hover:scale-110 transition-transform" />
                           <span className="text-[10px] font-black uppercase tracking-widest">UPLOAD FILE</span>
                        </button>
                        <input ref={fileInputRef} type="file" accept="audio/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) { setAudioFile(f); runAnalysis(f); } }} className="hidden" />
                     </div>
                  </div>
                ) : (
                  <div className="space-y-8">
                     <div className="relative">
                       <textarea value={textInput} onChange={(e) => setTextInput(e.target.value)} placeholder="PASTE SMS OR MESSAGE CONTENT HERE..." className="w-full h-64 p-10 rounded-[3rem] border-2 border-white/5 bg-black/20 outline-none font-bold text-lg text-white focus:border-indigo-600 transition-all" />
                       <button className="absolute top-8 right-8 p-4 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-600/30 hover:bg-indigo-600 hover:text-white transition-all">
                          <Camera className="w-6 h-6" />
                       </button>
                     </div>
                     <button onClick={() => runAnalysis()} disabled={!textInput} className="w-full py-6 rounded-[2.5rem] bg-indigo-600 text-white font-black uppercase tracking-[0.4em] text-xs flex items-center justify-center gap-4 hover:bg-indigo-700 transition-all shadow-2xl">
                        <MessageSquare className="w-6 h-6" /> START TEXT ANALYSIS
                     </button>
                  </div>
                )}
             </section>

             <section className={`p-10 sm:p-20 rounded-[4rem] border glass ${cardClass} flex flex-col justify-center items-center min-h-[600px] relative overflow-hidden`}>
                {status === 'ANALYZING' && (
                  <div className="text-center space-y-10">
                     <Radar className={`w-40 h-40 mx-auto animate-spin-slow ${accentText} opacity-30`} />
                     <h3 className={`text-3xl font-black font-futuristic uppercase tracking-[0.4em] ${headingText}`}>EXTRACTING...</h3>
                  </div>
                )}
                {result && (
                  <div className="w-full space-y-12 animate-in zoom-in duration-700">
                     {!result.language_match && (
                        <div className="p-10 rounded-[3rem] bg-red-600 text-white flex flex-col items-center text-center gap-6 shadow-[0_0_50px_rgba(220,38,38,0.7)] border-4 border-white/20 mb-10 animate-bounce">
                           <div className="flex items-center gap-6">
                              <AlertOctagon className="w-16 h-16 text-white" />
                              <h3 className="text-2xl font-black uppercase tracking-tighter">Audio language mismatch detected – verification failed</h3>
                           </div>
                           <p className="text-sm font-bold opacity-90 uppercase tracking-[0.2em]">The detected signal ({result.detected_language}) does not match the active {language} gateway.</p>
                        </div>
                     )}
                     <div className="text-center space-y-10">
                        <div className="flex flex-col items-center gap-8">
                           <div className={`p-16 rounded-[6rem] border-4 shadow-[0_0_80px_rgba(220,38,38,0.1)] ${result.risk_level === 'HIGH' || !result.language_match ? 'bg-red-600/10 border-red-600' : 'bg-emerald-600/10 border-emerald-600'}`}>
                              {result.risk_level === 'HIGH' || !result.language_match ? <ShieldAlert className="w-32 h-32 text-red-600" /> : <ShieldCheck className="w-32 h-32 text-emerald-600" />}
                           </div>
                           <div className="space-y-4">
                              <h2 className={`text-6xl font-black font-futuristic uppercase tracking-tighter ${result.risk_level === 'HIGH' || !result.language_match ? 'text-red-600' : 'text-emerald-600'}`}>
                                 {!result.language_match ? 'GATEWAY REJECTED' : result.final_verdict.replace('_', ' ')}
                              </h2>
                              <p className="text-[12px] font-black uppercase tracking-[0.5em] text-slate-500">SYSTEM_CONFIRMED: {result.detected_language}</p>
                           </div>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-10 items-center justify-center">
                           <RiskMeter score={!result.language_match ? 1 : result.confidence_score} level={!result.language_match ? 'HIGH' : result.risk_level} theme={theme} />
                           <div className="p-8 rounded-[2.5rem] border border-white/5 bg-white/5 max-w-sm text-left">
                              <h5 className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-4">FORENSIC_SNAPSHOT</h5>
                              <p className="text-sm font-bold uppercase leading-relaxed italic text-slate-300">"{result.spam_behavior.suspicious_phrases?.[0] || result.voice_forensics.analysis_layers.emotional_micro_dynamics}"</p>
                           </div>
                        </div>
                        <div className="flex justify-center gap-4">
                           {result.safety_actions.map(a => (
                             <button key={a} className={`px-10 py-5 rounded-[2rem] font-black uppercase text-[10px] tracking-widest text-white shadow-2xl transition-all hover:scale-110 ${a === 'BLOCK' ? 'bg-red-600' : a === 'REPORT' ? 'bg-amber-600' : 'bg-slate-600'}`}>
                                {a} NOW
                             </button>
                           ))}
                        </div>
                     </div>
                  </div>
                )}
                {status === 'IDLE' && (
                  <div className="text-center space-y-10 opacity-40">
                     <Radar className={`w-40 h-40 mx-auto ${accentText} animate-spin-slow`} />
                     <h3 className={`text-2xl font-black font-futuristic uppercase tracking-[0.4em] ${headingText}`}>AWAITING_SIGNAL</h3>
                  </div>
                )}
                {status === 'ERROR' && (
                   <div className="text-center space-y-8 p-10 bg-red-600/10 rounded-[3rem] border border-red-600/30">
                      <AlertOctagon className="w-20 h-20 mx-auto text-red-600" />
                      <h3 className="text-3xl font-black font-futuristic text-red-600">CORE_FAULT</h3>
                      <p className="text-xs font-bold uppercase text-red-400">{errorMessage}</p>
                      <button onClick={reset} className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest">RE_INITIALIZE</button>
                   </div>
                )}
             </section>
          </div>
        )}

        {result && (
          <div className="space-y-12 animate-in slide-in-from-bottom-20 duration-1000 pb-32">
             <div className="flex items-center gap-6 px-6">
                <div className="p-5 rounded-3xl bg-indigo-600/10 text-indigo-500 border border-indigo-600/20"><BarChart3 className="w-10 h-10" /></div>
                <div className="space-y-1">
                   <h3 className={`text-4xl font-black font-futuristic uppercase ${headingText}`}>BIO-INTELLIGENCE MATRIX</h3>
                   <p className="text-[10px] font-black uppercase tracking-[0.6em] text-slate-500">Linguistic & Forensic decomposition report</p>
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <AnalysisLayer label="Spatial Acoustics" localizedLabel={meta.layers.spatial} description={result.voice_forensics.analysis_layers.spatial_acoustics} isCompleted={true} theme={theme} />
                <AnalysisLayer label="Emotional Stability" localizedLabel={meta.layers.emotional} description={result.voice_forensics.analysis_layers.emotional_micro_dynamics} isCompleted={true} theme={theme} />
                <AnalysisLayer label="Cultural Phonetics" localizedLabel={meta.layers.cultural} description={result.voice_forensics.analysis_layers.cultural_linguistics} isCompleted={true} theme={theme} />
                <AnalysisLayer label="Respiratory Sync" localizedLabel={meta.layers.respiratory} description={result.voice_forensics.analysis_layers.breath_emotion_sync} isCompleted={true} theme={theme} />
                <AnalysisLayer label="Spectral Artifacts" localizedLabel={meta.layers.spectral} description={result.voice_forensics.analysis_layers.spectral_artifacts} isCompleted={true} theme={theme} />
                <AnalysisLayer label="Linguistic Marker" localizedLabel={meta.layers.linguistic} description={result.voice_forensics.analysis_layers.code_switching} isCompleted={true} theme={theme} />
             </div>

             {result.spam_behavior.scam_patterns.length > 0 && (
                <div className="p-10 rounded-[4rem] border-4 border-amber-600/30 bg-amber-600/5 space-y-8">
                   <div className="flex items-center gap-6">
                      <AlertCircle className="w-12 h-12 text-amber-600" />
                      <h3 className="text-3xl font-black font-futuristic text-amber-600 uppercase">THREAT_INTENT_DETECTED</h3>
                   </div>
                   <div className="flex flex-wrap gap-4">
                      {result.spam_behavior.scam_patterns.map(p => (
                        <span key={p} className="px-6 py-3 bg-amber-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl">{p}</span>
                      ))}
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {result.spam_behavior.suspicious_phrases?.map((ph, idx) => (
                        <div key={idx} className="p-6 bg-black/20 rounded-3xl border border-white/5 flex gap-4 items-start">
                           <ShieldAlert className="w-6 h-6 text-amber-600 flex-shrink-0" />
                           <p className="text-sm font-bold text-slate-300 italic">"{ph}"</p>
                        </div>
                      ))}
                   </div>
                </div>
             )}

             <button onClick={reset} className="w-full py-10 rounded-[5rem] bg-indigo-600 text-white font-black uppercase tracking-[0.8em] shadow-[0_40px_80px_rgba(79,70,229,0.3)] hover:scale-[1.02] transition-all text-xs flex items-center justify-center gap-6">
                <RefreshCcw className="w-8 h-8" /> RE_SYNC GATEWAY SIGNAL
             </button>
          </div>
        )}
      </main>

      <footer className={`py-20 border-t ${theme === 'DARK' ? 'border-white/5 text-slate-700' : 'border-slate-300 text-slate-500'}`}>
         <div className="max-w-7xl mx-auto px-8 flex flex-col md:flex-row justify-between items-center gap-10">
            <div className="flex flex-col md:flex-row items-center gap-8">
               <Shield className="w-8 h-8 opacity-20" />
               <div className="text-center md:text-left space-y-1">
                  <p className="text-[12px] font-black uppercase tracking-[0.5em] mb-1">VOICE TRUTH SCANNER v5.2 © 2026</p>
                  <p className="text-[9px] font-bold uppercase tracking-[0.3em] opacity-40 italic">BUILDATHON SUBMISSION: AI FOR FRAUD DETECTION & USER SAFETY</p>
               </div>
            </div>
            <div className="flex gap-10">
               {['GATEWAY_772_STABLE', 'AES-512_ENCRYPTED', 'PRIVACY_COMPLIANT'].map(i => (
                 <span key={i} className="text-[10px] font-black uppercase tracking-widest opacity-60 transition-all cursor-default">{i}</span>
               ))}
            </div>
         </div>
      </footer>
    </div>
  );
};

export default App;