import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './supabaseClient';
import { Cpu, Zap, Lock, Terminal, Info, Key, User } from 'lucide-react';

// ============================================================================
// Hyper-Speed Hybrid Core 
// ============================================================================
const workerScript = `
  self.onmessage = function(e) {
    if (e.data === 'start') {
      const memPad = new Float64Array(512); 
      let n = 0;
      while (true) {
        n++;
        Math.sqrt(n * Math.random());
        if (n % 200 === 0) memPad[n % 512] = Math.random();
        if (n % 500000 === 0) self.postMessage({ pulse: 500000 });
      }
    }
  };
`;

const hackerCodeLines = [
  "MOV RAX, [RSP+0x10] // POINTER LOAD",
  "KERNEL_SHA256_ITER() // L1_SYNC",
  "XOR R8, R8 // BUFFER FLUSH",
  "MEM_PAD_POINTER -> 0x00A1F0",
  "ALU_OVERCLOCK_PULSE: TRUE",
  "CMP EAX, 0x20 // NONCE CHECK",
  "SYS_CALL // THREAD_SPANNING",
  "MATRIX_POW_EVAL: NONCE++",
  "ROR RCX, 0x0D // BIT ROTATE",
  "BUFFER_OVERFLOW_GUARD // PASS",
  "ESTABLISH SECURE PIPE // SSL",
  "ALLOCATE REGISTER // M4_CORE"
];

export default function App() {
  const [user, setUser] = useState(null);
  const [authMode, setAuthMode] = useState('register'); 
  const [inputUser, setInputUser] = useState('');
  const [inputPass, setInputPass] = useState('');
  const [authError, setAuthError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const [activeTab, setActiveTab] = useState('mine');
  const [profile, setProfile] = useState({ balance: 0, username: '' });
  const [isMining, setIsMining] = useState(false);
  
  const [currentSpeed, setCurrentSpeed] = useState(0); 
  const [totalMinedGlobal, setTotalMinedGlobal] = useState(0); 
  const [logs, setLogs] = useState([]); 
  const [codeStream, setCodeStream] = useState([]);

  const TOTAL_SUPPLY = 100000;
  const speedAccumulator = useRef(0);
  const workersRef = useRef([]);
  const terminalEndRef = useRef(null);

  // 计算实时进度百分比
  const currentProgressPercent = (totalMinedGlobal / TOTAL_SUPPLY * 100).toFixed(2);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  useEffect(() => {
    let timer;
    if (isMining) {
      timer = setInterval(() => {
        setCurrentSpeed(speedAccumulator.current);
        speedAccumulator.current = 0;
      }, 1000);
    } else {
      setCurrentSpeed(0);
    }
    return () => clearInterval(timer);
  }, [isMining]);

  useEffect(() => {
    let interval;
    if (isMining) {
      interval = setInterval(() => {
        const randomLine = hackerCodeLines[Math.floor(Math.random() * hackerCodeLines.length)];
        const hexAddr = "0x" + Math.random().toString(16).substring(2, 6).toUpperCase();
        setCodeStream(prev => [...prev.slice(-4), `${hexAddr} :: ${randomLine}`]);
      }, 100);
    } else {
      setCodeStream([]);
    }
    return () => clearInterval(interval);
  }, [isMining]);

  useEffect(() => {
    async function checkSession() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        await fetchProfile(session.user.id);
        fetchGlobalStats();
      }
      setIsLoading(false);
    }
    checkSession();
  }, []);

  async function fetchProfile(uid) {
    const { data } = await supabase.from('profiles').select('*').eq('id', uid).single();
    if (data) setProfile(data);
  }

  async function fetchGlobalStats() {
    const { data } = await supabase.from('profiles').select('balance');
    const total = data?.reduce((acc, curr) => acc + (curr.balance || 0), 0) || 0;
    setTotalMinedGlobal(total);
  }

  const addLog = (m) => setLogs(p => [...p.slice(-12), `[${new Date().toLocaleTimeString()}] ${m}`]);

  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError('');
    if (!inputUser || inputUser.length < 3) return setAuthError('ID must be at least 3 characters.');
    const stealthEmail = `${inputUser.toLowerCase().trim()}@xminer.internal`;
    setIsLoading(true);

    if (authMode === 'login') {
      const { data, error } = await supabase.auth.signInWithPassword({ email: stealthEmail, password: inputPass });
      if (error) { setAuthError('Invalid ID or Password.'); setIsLoading(false); }
      else { setUser(data.user); await fetchProfile(data.user.id); fetchGlobalStats(); setIsLoading(false); }
    } else {
      const { data, error } = await supabase.auth.signUp({ email: stealthEmail, password: inputPass });
      if (error) { setAuthError('ID already taken.'); setIsLoading(false); }
      else if (data.user) {
        const cleanUsername = inputUser.trim().toUpperCase();
        await supabase.from('profiles').insert([{ id: data.user.id, username: cleanUsername }]);
        setUser(data.user); await fetchProfile(data.user.id); fetchGlobalStats(); setIsLoading(false);
      }
    }
  };

  const handleLogout = async () => {
    if (isMining) toggleMining();
    await supabase.auth.signOut();
    setUser(null);
    setProfile({ balance: 0, username: '' });
  };

  const toggleMining = () => {
    if (!isMining) {
      setIsMining(true);
      addLog("ENGINE START: ALLOCATING CORES...");
      const cores = navigator.hardwareConcurrency || 4;
      const blob = new Blob([workerScript], { type: 'application/javascript' });
      const url = URL.createObjectURL(blob);

      for (let i = 0; i < cores; i++) {
        const w = new Worker(url);
        w.postMessage('start');
        w.onmessage = async (e) => {
          speedAccumulator.current += e.data.pulse;
          let diffFactor = 1;
          if (totalMinedGlobal > TOTAL_SUPPLY * 0.5) diffFactor = 2;
          if (totalMinedGlobal > TOTAL_SUPPLY * 0.75) diffFactor = 4;
          if (totalMinedGlobal > TOTAL_SUPPLY * 0.875) diffFactor = 8;

          const baseProb = 0.000032; 
          const currentProb = baseProb / diffFactor;

          if (Math.random() < currentProb) {
            if (!user?.id) return;
            const { data: success, error } = await supabase.rpc('claim_block');
            if (error) { addLog("ERROR: CONNECTION FAILED"); }
            else if (success === true) {
              addLog("BLOCK FOUND! +1 X");
              setProfile(prev => ({ ...prev, balance: (prev.balance || 0) + 1 }));
              setTotalMinedGlobal(g => g + 1);
            } else { 
              addLog("REJECTED: FAILED"); 
            }
          }
        };
        workersRef.current.push(w);
      }
    } else {
      setIsMining(false);
      workersRef.current.forEach(w => w.terminate());
      workersRef.current = [];
      addLog("ENGINE STOPPED.");
      fetchGlobalStats();
    }
  };

  if (isLoading && !user) return <div className="min-h-screen bg-[#020617] flex items-center justify-center font-mono text-2xl tracking-widest text-cyan-400 animate-pulse">INITIALIZING KERNEL...</div>;

  // ============================================================================
  // AUTH PORTAL
  // ============================================================================
  if (!user) {
    return (
      <div className="min-h-screen bg-[#020617] text-slate-200 font-mono flex flex-col items-center justify-between p-6 selection:bg-cyan-500 selection:text-black relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0ea5e908_1px,transparent_1px),linear-gradient(to_bottom,#0ea5e908_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-cyan-500/10 blur-[120px] rounded-full pointer-events-none animate-pulse"></div>

        <div className="flex-1 flex flex-col items-center justify-center w-full max-w-lg z-10">
          <div className="w-full bg-slate-950/80 border-2 border-slate-800/80 backdrop-blur-xl p-10 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.9)] relative">
            <div className="flex items-center justify-center gap-3 mb-10">
              <Zap className="text-cyan-400 animate-pulse" size={40} />
              <h1 className="text-4xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-400 to-fuchsia-500">
                X MINER
              </h1>
            </div>

            <div className="flex mb-8 border-b-2 border-slate-800">
              <button onClick={() => setAuthMode('register')} className={`flex-1 pb-4 text-base font-black transition-all ${authMode === 'register' ? 'text-cyan-400 border-b-4 border-cyan-400' : 'text-slate-600'}`}>// REGISTER</button>
              <button onClick={() => setAuthMode('login')} className={`flex-1 pb-4 text-base font-black transition-all ${authMode === 'login' ? 'text-cyan-400 border-b-4 border-cyan-400' : 'text-slate-600'}`}>// LOGIN</button>
            </div>

            <form onSubmit={handleAuth} className="space-y-6">
              <div>
                <label className="text-xs font-bold text-slate-400 mb-2 flex items-center gap-1.5"><User size={14} /> MINER ID</label>
                <input type="text" required value={inputUser} onChange={e => setInputUser(e.target.value.replace(/[^a-zA-Z0-9]/g, ''))} placeholder="ENTER ID" className="w-full bg-black/90 border-2 border-slate-800 p-4 text-base font-bold text-cyan-400 focus:outline-none focus:border-cyan-400 rounded-xl" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 mb-2 flex items-center gap-1.5"><Key size={14} /> PASSWORD</label>
                <input type="password" required value={inputPass} onChange={e => setInputPass(e.target.value)} placeholder="••••••••" className="w-full bg-black/90 border-2 border-slate-800 p-4 text-base font-bold text-cyan-400 focus:outline-none focus:border-cyan-400 rounded-xl" />
              </div>
              {authError && <div className="text-sm font-bold text-red-400 p-3 bg-red-950/30 border border-red-900/50 rounded-xl text-center">{authError}</div>}
              <button type="submit" className="w-full py-5 bg-cyan-500/10 border-2 border-cyan-400 text-cyan-400 hover:bg-cyan-400 hover:text-black font-black text-base tracking-widest transition-all rounded-xl mt-4 uppercase">{authMode}</button>
            </form>
          </div>
        </div>

        <footer className="w-full py-6 text-center z-10 border-t-2 border-slate-900/80 mt-auto">
          <div className="text-slate-400 text-sm font-bold max-w-2xl mx-auto px-4 leading-relaxed font-sans tracking-wide">
            <p>To prevent any rug pull risks, our project requires zero wallet connections.</p>
            <p className="mt-1 text-slate-500">Zero financial deposits are needed to participate.</p>
          </div>
        </footer>
      </div>
    );
  }

  // ============================================================================
  // MAIN DASHBOARD
  // ============================================================================
  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 font-mono flex flex-col justify-between selection:bg-cyan-500 selection:text-black relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0ea5e905_1px,transparent_1px),linear-gradient(to_bottom,#0ea5e905_1px,transparent_1px)] bg-[size:5rem_5rem] pointer-events-none"></div>
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-cyan-500/5 blur-[150px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-fuchsia-500/5 blur-[150px] rounded-full pointer-events-none"></div>

      <div className="z-10">
        <header className="border-b-2 border-slate-900/80 bg-slate-950/40 backdrop-blur-md px-6 py-5">
          <div className="max-w-6xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Zap className="text-cyan-400 animate-pulse" size={32} />
              <h1 className="text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-400 to-fuchsia-500">X MINER</h1>
            </div>
            <div className="flex gap-4 items-center">
              <div className="bg-slate-950 border-2 border-slate-800 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2">
                <span className="text-slate-500">ID:</span> <span className="text-cyan-400 text-base">{profile.username}</span>
              </div>
              <div className="bg-slate-950 border-2 border-slate-800 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2">
                <span className="text-slate-500">BALANCE:</span> <span className="text-yellow-400 text-base font-black">{profile.balance || 0} X</span>
              </div>
              <button onClick={handleLogout} className="text-xs font-bold text-slate-500 hover:text-red-400 border-2 border-slate-800 bg-slate-950 px-4 py-2 rounded-xl transition-all">LOGOUT</button>
            </div>
          </div>
        </header>

        <nav className="max-w-6xl mx-auto flex gap-4 my-8 px-6">
          {['mine', 'market'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`px-8 py-3 text-sm font-black tracking-widest border-2 rounded-xl transition-all duration-300 ${activeTab === tab ? 'bg-cyan-500 text-black border-cyan-400 shadow-[0_0_25px_rgba(6,182,212,0.4)] scale-105' : 'bg-slate-950/60 border-slate-800/80 text-slate-500 hover:text-slate-300'}`}>// {tab.toUpperCase()}</button>
          ))}
        </nav>

        <main className="max-w-6xl mx-auto px-6 pb-16 w-full">
          {activeTab === 'mine' && (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
              <div className="lg:col-span-3 space-y-8">
                <div className="bg-slate-950/60 border-2 border-slate-800/80 backdrop-blur-md p-8 rounded-3xl relative overflow-hidden shadow-2xl">
                  <div className="flex justify-between items-baseline text-sm font-bold mb-4">
                    <span className="text-slate-400">TOTAL SUPPLY: <span className="text-slate-200">{TOTAL_SUPPLY} X</span></span>
                    <span className="text-cyan-400 text-base font-black">{currentProgressPercent}%</span>
                  </div>
                  <div className="w-full h-4 bg-black border border-slate-800 rounded-full overflow-hidden p-0.5">
                    <div className="h-full bg-gradient-to-r from-cyan-500 to-teal-400 rounded-full shadow-[0_0_15px_#06b6d4]" style={{ width: `${currentProgressPercent}%` }}></div>
                  </div>
                  <div className="mt-5 text-xs font-bold text-amber-500/90 flex items-center gap-2"><Info size={16} className="animate-bounce" /><span>Difficulty doubles at 50%, 75% and 87.5% supply mined.</span></div>
                </div>

                <div className="bg-slate-950/60 border-2 border-slate-800/80 p-10 rounded-3xl flex flex-col items-center relative shadow-2xl overflow-hidden">
                  <div className={`relative w-52 h-52 rounded-full border-4 flex items-center justify-center mb-8 transition-all ${isMining ? 'border-cyan-400 shadow-[0_0_50px_rgba(6,182,212,0.3)]' : 'border-slate-800/80'}`}>
                    {isMining && (
                      <div className="absolute inset-0 rounded-full border-4 border-cyan-500/30 border-t-transparent animate-spin"></div>
                    )}
                    <Cpu size={72} className={isMining ? 'text-cyan-400 animate-pulse' : 'text-slate-700'} />
                  </div>
                  <div className="text-center mb-6 z-10 w-full">
                    <div className="text-xs font-bold text-slate-500 tracking-widest mb-1">HASH RATE SPEED</div>
                    <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-teal-300">{currentSpeed > 1000000 ? `${(currentSpeed/1000000).toFixed(2)} MH/s` : `${currentSpeed} H/s`}</div>
                  </div>
                  <div className="w-full h-24 bg-black/90 border-2 border-slate-800/90 rounded-2xl p-3 flex flex-col justify-end overflow-hidden mb-8 shadow-inner">
                    {isMining ? (
                      <div className="space-y-1 text-left">{codeStream.map((code, idx) => (<div key={idx} className="text-xs font-mono text-emerald-400 font-bold tracking-tight">{code}</div>))}</div>
                    ) : (
                      <div className="text-center text-xs font-mono text-slate-700 font-bold self-center">// KERNEL SLEEPING...</div>
                    )}
                  </div>
                  <button onClick={toggleMining} className={`w-full py-6 text-2xl font-black tracking-widest border-2 rounded-2xl transition-all shadow-lg ${isMining ? 'border-red-500/80 text-red-400 bg-red-950/20 hover:bg-red-500 hover:text-black' : 'border-cyan-400 text-cyan-400 bg-cyan-950/20 hover:bg-cyan-400 hover:text-black'}`}>{isMining ? 'STOP ENGINE' : 'START MINE'}</button>
                </div>
              </div>

              <div className="lg:col-span-2 bg-slate-950/80 border-2 border-slate-800/80 p-6 rounded-3xl flex flex-col h-[750px] shadow-2xl relative">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-400 mb-6 border-b-2 border-slate-800/80 pb-4"><Terminal size={18} className="text-cyan-400" /> SYSTEM LOGS // LIVE KERNEL</div>
                <div className="flex-1 overflow-y-auto text-sm font-bold leading-loose space-y-2 pr-2">
                  {logs.length === 0 ? <div className="text-slate-700 italic text-xs tracking-wider">Awaiting node engine initialization...</div> : logs.map((l, i) => <div key={i} className={`p-2 rounded-lg border ${l.includes('BLOCK FOUND') ? 'text-cyan-300 bg-cyan-950/20 border-cyan-500/30 font-black' : l.includes('REJECTED') ? 'text-red-400 bg-red-950/20 border-red-900/30' : 'text-slate-400 border-transparent'}`}>{l}</div>)}
                  <div ref={terminalEndRef}></div>
                </div>
              </div>
            </div>
          )}

          {/* ⚡ 极简版市场锁定界面 */}
          {activeTab === 'market' && (
            <div className="flex flex-col items-center justify-center py-24 bg-slate-950/40 border-2 border-slate-800/80 border-dashed backdrop-blur-md rounded-3xl shadow-2xl relative overflow-hidden max-w-3xl mx-auto">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent pointer-events-none"></div>
              
              <Lock size={72} className="text-slate-700 mb-8 animate-bounce" />
              
              <h2 className="text-4xl font-black text-slate-300 tracking-tight mb-2">
                MARKET LOCKED
              </h2>
              
              {/* 极致冷酷的单行解锁宣告 */}
              <div className="bg-slate-900/90 border-2 border-slate-800 px-6 py-4 rounded-xl my-6 shadow-[0_0_20px_rgba(0,0,0,0.8)] z-10">
                <span className="text-cyan-400 font-black text-base tracking-wide">MARKET UNLOCKS AT 50% SUPPLY MINED</span>
              </div>

              <div className="w-full max-w-md px-6 z-10 text-center">
                <div className="flex justify-between text-xs font-bold text-slate-500 mb-2">
                  <span>CURRENT PROGRESS:</span>
                  <span className="text-amber-500 font-black">{currentProgressPercent}% / 50.00%</span>
                </div>
                <div className="w-full h-3 bg-black border border-slate-800 rounded-full overflow-hidden p-0.5 mb-4">
                  <div 
                    className="h-full bg-amber-500 rounded-full transition-all duration-500 shadow-[0_0_12px_#f59e0b]" 
                    style={{ width: `${Math.min(currentProgressPercent * 2, 100)}%` }}
                  ></div>
                </div>
                <p className="text-xs font-bold text-slate-600 tracking-widest uppercase">
                  {totalMinedGlobal >= TOTAL_SUPPLY * 0.5 
                    ? "🔓 KERNEL UNLOCKING..." 
                    : "MINE X TO ACCELERATE ECOSYSTEM UNLOCK."}
                </p>
              </div>
            </div>
          )}
        </main>
      </div>

      <footer className="w-full py-8 text-center z-10 border-t-2 border-slate-900/80 mt-auto bg-[#020617]/90">
        <div className="text-slate-400 text-sm font-bold max-w-2xl mx-auto px-4 leading-relaxed font-sans tracking-wide">
          <p>To prevent any rug pull risks, our project requires zero wallet connections.</p>
          <p className="mt-1 text-slate-500">Zero financial deposits are needed to participate.</p>
        </div>
      </footer>
    </div>
  );
}