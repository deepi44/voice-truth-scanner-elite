
import React, { useState, useRef } from 'react';
import { 
  AppStatus, 
  AnalysisResult, 
  SupportedLanguage, 
  LANGUAGE_LOCALES
} from './types';
import { analyzeForensicAudio } from './services/geminiService';
import Waveform from './components/Waveform';
import RiskMeter from './components/RiskMeter';
import AnalysisLayer from './components/AnalysisLayer';
import { 
  Shield, Upload, Mic, Trash2, Download, AlertTriangle, 
  CheckCircle, Info, Languages, Lock, User, 
  Fingerprint, Key, LogOut, Terminal, Zap, Activity
} from 'lucide-react';

const DEFAULT_AUTH = { email: 'admin@forensic.ai', password: 'password123' };

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const [status, setStatus] = useState<AppStatus>('IDLE');
  const [language, setLanguage] = useState<SupportedLanguage>('English');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | undefined>(undefined);
  const [audioFile, setAudioFile] = useState<File | Blob | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (email === DEFAULT_AUTH.email && password === DEFAULT_AUTH.password) {
      setIsAuthenticated(true);
      setLoginError('');
    } else {
      setLoginError('Authentication Denied. Invalid terminal credentials.');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    reset();
  };

  const startRecording = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ audio: true });
      setStream(s);
      const recorder = new MediaRecorder(s);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/mp3' });
        setAudioFile(audioBlob);
        s.getTracks().forEach(track => track.stop());
        setStream(undefined);
      };
      recorder.start();
      setStatus('RECORDING');
    } catch (err) {
      setError("Microphone access denied. Check security permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && status === 'RECORDING') {
      mediaRecorderRef.current.stop();
      setStatus('IDLE');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError("Source file exceeds 10MB limit.");
        return;
      }
      setAudioFile(file);
      setError(null);
    }
  };

  const runAnalysis = async () => {
    if (!audioFile) return;
    setStatus('ANALYZING');
    setError(null);
    setResult(null);
    try {
      const analysis = await analyzeForensicAudio(audioFile, language);
      setResult(analysis);
      setStatus('COMPLETED');
    } catch (err: any) {
      console.error(err);
      setError("Forensic engine synchronization error.");
      setStatus('ERROR');
    }
  };

  const reset = () => {
    setStatus('IDLE');
    setResult(null);
    setAudioFile(null);
    setError(null);
  };

  const downloadReport = () => {
    if (!result) return;
    const report = `VOICE TRUTH SCANNER™ ELITE - FORENSIC REPORT\n==========================================\nStatus: ${result.classification}\nRisk: ${result.fraud_risk_level}\nConfidence: ${Math.round(result.confidence_score * 100)}%\nLanguage: ${language}\n------------------------------------------\nSUMMARY: ${result.forensic_report}`;
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `truth_scan_${Date.now()}.txt`;
    a.click();
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 sm:p-4">
        <div className="w-full max-w-md bg-slate-900/60 backdrop-blur-2xl border border-indigo-500/20 rounded-[2.5rem] p-10 relative overflow-hidden shadow-[0_0_50px_rgba(99,102,241,0.15)]">
          <div className="flex flex-col items-center gap-6 mb-10">
            <div className="p-5 bg-indigo-500/10 rounded-full border border-indigo-500/30">
              <Shield className="w-14 h-14 text-indigo-400" />
            </div>
            <div className="text-center">
              <h1 className="text-3xl font-bold font-futuristic tracking-[0.25em] text-white crt-text mb-2 uppercase">Terminal Access</h1>
              <p className="text-indigo-400/60 text-[10px] tracking-[0.4em] font-bold uppercase">Truth Scanner Elite v3.5</p>
            </div>
          </div>
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-1.5">
              <label className="text-[10px] text-indigo-400/80 uppercase tracking-widest font-black ml-1">Terminal Identity</label>
              <div className="relative group">
                <User className="absolute left-4 top-3.5 w-4 h-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@forensic.ai" className="w-full bg-black/40 border border-slate-700/50 rounded-2xl py-4 pl-12 pr-4 text-white outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all" required />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] text-indigo-400/80 uppercase tracking-widest font-black ml-1">Secure Passphrase</label>
              <div className="relative group">
                <Key className="absolute left-4 top-3.5 w-4 h-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="password123" className="w-full bg-black/40 border border-slate-700/50 rounded-2xl py-4 pl-12 pr-4 text-white outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all" required />
              </div>
            </div>
            {loginError && <div className="bg-red-500/10 border border-red-500/30 p-3 rounded-xl text-red-400 text-[10px] font-bold text-center animate-pulse">{loginError}</div>}
            <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 py-4 rounded-2xl font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all shadow-[0_10px_30px_rgba(79,70,229,0.3)] mt-4 active:scale-95">
              <Fingerprint className="w-5 h-5" /> Initialize Session
            </button>
          </form>
          <div className="mt-10 pt-6 border-t border-slate-800/50 flex flex-col items-center gap-3 opacity-60">
            <p className="text-[9px] text-slate-500 uppercase tracking-widest text-center">Internal use only • E2E Encryption Active</p>
            <div className="flex gap-4">
              <Lock className="w-3.5 h-3.5" />
              <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full my-auto animate-ping"></div>
              <Terminal className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8 lg:p-12 flex flex-col items-center overflow-x-hidden">
      <header className="w-full max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-8 mb-16">
        <div className="flex items-center gap-5 group">
          <div className="p-4 bg-indigo-600 rounded-2xl shadow-[0_0_30px_rgba(79,70,229,0.4)] group-hover:scale-110 transition-transform">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tighter font-futuristic text-white flex items-baseline gap-2">
              VOICE TRUTH SCANNER<span className="text-indigo-400">™</span>
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              <p className="text-[10px] text-slate-500 uppercase tracking-[0.4em] font-black">Forensic Alpha Terminal</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4 bg-slate-900/40 p-2.5 rounded-[1.5rem] border border-slate-800 backdrop-blur-2xl">
          <div className="px-5 py-2 hidden md:flex items-center gap-2 border-r border-slate-800">
            <Activity className="w-4 h-4 text-emerald-400" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Link Secured</span>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-widest transition-all border border-red-500/20">
            <LogOut className="w-4 h-4" /> Disconnect
          </button>
        </div>
      </header>

      <main className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-12 gap-10 items-start mb-24">
        <section className="lg:col-span-5 space-y-8">
          <div className="bg-slate-900/50 backdrop-blur-3xl p-8 rounded-[2.5rem] border border-slate-800 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent"></div>
            <div className="flex justify-between items-center mb-10">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-6 bg-indigo-500 rounded-full"></div>
                <h2 className="text-xl font-bold font-futuristic uppercase tracking-widest text-white">Capture Console</h2>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
                <Languages className="w-4 h-4 text-indigo-400" />
                <select value={language} onChange={(e) => setLanguage(e.target.value as SupportedLanguage)} className="bg-transparent text-[11px] font-black uppercase border-none outline-none text-indigo-400 cursor-pointer">
                  {Object.keys(LANGUAGE_LOCALES).map(lang => (
                    <option key={lang} value={lang} className="bg-slate-950 text-white">{lang}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mb-10">
              <Waveform isRecording={status === 'RECORDING'} isActive={status !== 'IDLE' && status !== 'ERROR'} stream={stream} />
            </div>
            <div className="grid grid-cols-2 gap-5">
              <button onClick={status === 'RECORDING' ? stopRecording : startRecording} disabled={status === 'ANALYZING'} className={`group py-6 px-4 rounded-[2rem] flex flex-col items-center gap-4 transition-all font-black uppercase text-[10px] tracking-[0.25em] border ${status === 'RECORDING' ? 'bg-red-600 border-red-500 text-white animate-pulse shadow-2xl shadow-red-600/30' : 'bg-indigo-600/5 border-indigo-500/20 text-indigo-400 hover:bg-indigo-600/10 hover:border-indigo-500/40 shadow-xl shadow-indigo-600/5'}`}>
                <div className={`p-4 rounded-2xl ${status === 'RECORDING' ? 'bg-white/20' : 'bg-indigo-500/20 group-hover:scale-110 transition-transform'}`}>
                  <Mic className="w-7 h-7" />
                </div>
                {status === 'RECORDING' ? 'Deactivate' : 'Live Capture'}
              </button>
              <button onClick={() => fileInputRef.current?.click()} disabled={status === 'RECORDING' || status === 'ANALYZING'} className="group py-6 px-4 rounded-[2rem] flex flex-col items-center gap-4 bg-slate-800/40 border border-slate-700/50 hover:bg-slate-800/60 hover:border-indigo-500/30 transition-all font-black uppercase text-[10px] tracking-[0.25em] text-slate-400 shadow-2xl shadow-black/20">
                <div className="p-4 bg-slate-700/30 rounded-2xl group-hover:scale-110 transition-transform">
                  <Upload className="w-7 h-7" />
                </div>
                Import Source
              </button>
            </div>
            <input ref={fileInputRef} type="file" accept="audio/mp3,audio/wav" onChange={handleFileUpload} className="hidden" />
            {audioFile && (
              <div className="mt-10 p-6 rounded-[2rem] bg-indigo-500/5 border border-indigo-500/10 flex flex-col sm:flex-row items-center justify-between gap-6 animate-in fade-in slide-in-from-top-2 duration-500">
                <div className="flex items-center gap-5 w-full sm:w-auto overflow-hidden">
                  <div className="p-4 bg-indigo-500/20 rounded-2xl flex-shrink-0">
                    <Zap className="w-7 h-7 text-indigo-400" />
                  </div>
                  <div className="overflow-hidden min-w-0">
                    <p className="text-[12px] font-black truncate text-white uppercase tracking-wider">{audioFile instanceof File ? audioFile.name : 'Secured_Buffer.bin'}</p>
                    <p className="text-[9px] uppercase tracking-[0.3em] text-slate-500 font-bold">Secure Payload Ready</p>
                  </div>
                </div>
                <div className="flex gap-3 w-full sm:w-auto">
                  <button onClick={reset} className="flex-1 sm:flex-none p-4 rounded-2xl bg-slate-800/50 text-slate-500 hover:text-red-400 transition-colors"><Trash2 className="w-5 h-5 mx-auto" /></button>
                  <button onClick={runAnalysis} className="flex-[2] sm:flex-none px-10 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.25em] shadow-2xl shadow-indigo-600/40 transition-all active:scale-95">
                    Initiate Scan
                  </button>
                </div>
              </div>
            )}
          </div>
          {result && (
            <div className={`p-10 rounded-[3rem] border-2 transition-all animate-in zoom-in-95 duration-1000 ${result.classification === 'AI_GENERATED' ? 'bg-red-500/5 border-red-500/30 text-red-400 shadow-2xl shadow-red-500/10' : 'bg-emerald-500/5 border-emerald-500/30 text-emerald-400 shadow-2xl shadow-emerald-500/10'}`}>
              <div className="flex items-center justify-between mb-8">
                <div className="space-y-2">
                  <p className="text-[11px] uppercase font-black tracking-[0.4em] opacity-60">Forensic Engine Verdict</p>
                  <p className="text-3xl sm:text-4xl font-black font-futuristic tracking-tighter crt-text leading-tight">
                    {result.classification === 'AI_GENERATED' ? 'AI FRAUD DETECTED' : 'VOICE AUTHENTICATED'}
                  </p>
                </div>
                <div className="p-6 rounded-[2rem] bg-current opacity-10 flex-shrink-0 ml-4">
                  {result.classification === 'AI_GENERATED' ? <AlertTriangle className="w-12 h-12" /> : <Shield className="w-12 h-12" />}
                </div>
              </div>
              <div className="p-6 bg-black/40 rounded-[2rem] text-[12px] leading-relaxed border border-white/5 font-medium italic">
                <span className="font-black text-white not-italic mr-3 border-r border-white/20 pr-3">REPORT</span> {result.forensic_report}
              </div>
            </div>
          )}
        </section>

        <section className="lg:col-span-7 space-y-10">
          <div className="bg-slate-900/50 backdrop-blur-3xl p-8 sm:p-12 rounded-[3.5rem] border border-slate-800 shadow-2xl overflow-hidden relative">
            <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none">
              <Fingerprint className="w-80 h-80" />
            </div>
            <div className="flex flex-col md:flex-row items-center gap-12 mb-16">
              <RiskMeter score={result ? result.confidence_score : 0} level={result ? result.fraud_risk_level : 'LOW'} />
              <div className="flex-1 text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-4 mb-6">
                  <div className="w-12 h-px bg-indigo-500/50"></div>
                  <h2 className="text-3xl font-black font-futuristic tracking-[0.4em] uppercase text-white">Truth Matrix</h2>
                </div>
                <p className="text-slate-500 text-[12px] leading-relaxed mb-10 uppercase font-black tracking-[0.3em] opacity-70">
                  Executing bio-acoustic resonance and spectral analysis via encrypted neural core.
                </p>
                {result && (
                  <button onClick={downloadReport} className="inline-flex items-center gap-4 px-10 py-5 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 rounded-[1.5rem] text-[11px] font-black uppercase tracking-[0.3em] transition-all group shadow-xl">
                    <Download className="w-6 h-6 group-hover:-translate-y-1 transition-transform" /> Export Secure Log
                  </button>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <AnalysisLayer label="Spatial Acoustics" tamilLabel="இடஞ்சார்ந்த ஒலியியல்" description={result?.analysis_layers.spatial_acoustics || ''} isProcessing={status === 'ANALYZING'} isCompleted={!!result} delay={0} />
              <AnalysisLayer label="Emotional Jitter" tamilLabel="உணர்ச்சி அதிர்வுகள்" description={result?.analysis_layers.emotional_micro_dynamics || ''} isProcessing={status === 'ANALYZING'} isCompleted={!!result} delay={200} />
              <AnalysisLayer label="Idiom Flow" tamilLabel="கலாச்சார வெளிப்பாடுகள்" description={result?.analysis_layers.cultural_linguistics || ''} isProcessing={status === 'ANALYZING'} isCompleted={!!result} delay={400} />
              <AnalysisLayer label="Pneuma-Sync" tamilLabel="சுவாச ஒத்திசைவு" description={result?.analysis_layers.breath_emotion_sync || ''} isProcessing={status === 'ANALYZING'} isCompleted={!!result} delay={600} />
              <AnalysisLayer label="Spectral Ghosting" tamilLabel="நிறமாலை தடயங்கள்" description={result?.analysis_layers.spectral_artifacts || ''} isProcessing={status === 'ANALYZING'} isCompleted={!!result} delay={800} />
              <AnalysisLayer label="Switch Logic" tamilLabel="மொழி மாற்றம்" description={result?.analysis_layers.code_switching || ''} isProcessing={status === 'ANALYZING'} isCompleted={!!result} delay={1000} />
            </div>
          </div>
          <div className="p-8 rounded-[2.5rem] bg-indigo-600/5 border border-indigo-600/10 flex items-start gap-6 shadow-lg">
            <div className="p-3 bg-indigo-500/20 rounded-2xl flex-shrink-0">
              <Info className="w-6 h-6 text-indigo-400" />
            </div>
            <div className="space-y-2">
              <p className="text-[11px] font-black uppercase tracking-[0.3em] text-indigo-400">Security & Operational Mandate</p>
              <p className="text-[11px] text-slate-500 leading-relaxed font-black uppercase tracking-[0.3em] opacity-60">
                Authorized station Alpha usage only. Audio streams are volatile and scrubbed post-validation. Terminal logs are EAL-7 standard. Unauthorized export is strictly prohibited.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="fixed bottom-0 left-0 w-full p-5 bg-slate-950/95 backdrop-blur-3xl border-t border-slate-900 flex flex-col sm:flex-row justify-between items-center gap-6 text-[10px] text-slate-600 font-futuristic tracking-[0.5em] uppercase z-40">
        <div className="flex items-center gap-6">
          <div className="flex gap-2">
            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce"></div>
            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce delay-100"></div>
            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce delay-200"></div>
          </div>
          <span className="font-black text-slate-500">Terminal: Active Status</span>
        </div>
        <div className="flex gap-12 items-center">
          <span className="hidden lg:inline text-indigo-500/40">Secure Tunnel: Established</span>
          <span className="text-slate-700 font-black">© 2025 TRUTH_SCANNER_LABS</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
