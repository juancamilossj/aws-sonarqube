import React, { useState } from 'react';
import {
  X,
  Lock,
  Mail,
  User,
  Shield,
  GraduationCap,
  Sparkles,
  ArrowRight,
  KeyRound,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { setAuthToken } from '../utils/auth';
import { neuralAudio } from '../utils/AudioPlayer';

export default function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  const [isLoginTab, setIsLoginTab] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('student');
  const [cohort, setCohort] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const endpoint = isLoginTab ? '/api/auth/login' : '/api/auth/register';
      const body = isLoginTab
        ? { email, password }
        : { name, email, password, role, cohort };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Fallo en la autenticación');
      }

      // Save token in localStorage
      setAuthToken(data.token);
      neuralAudio.playLevelUp();
      onAuthSuccess(data.user, data.token);
      onClose();
    } catch (err) {
      setError(err.message);
      neuralAudio.playAlert();
    } finally {
      setLoading(false);
    }
  };

  // 1-Click Demo Login
  const handleDemoLogin = async (demoRole) => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/auth/demo/${demoRole}`, { method: 'POST' });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'No se pudo acceder con la cuenta demo');
      }

      setAuthToken(data.token);
      neuralAudio.playLevelUp();
      onAuthSuccess(data.user, data.token);
      onClose();
    } catch (err) {
      setError(err.message);
      neuralAudio.playAlert();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md select-none animate-fadeIn">
      <div className="relative w-full max-w-md bg-slate-950 border border-cyan-500/40 rounded-3xl shadow-2xl shadow-cyan-950/80 overflow-hidden">

        {/* Modal Top Banner */}
        <div className="p-6 border-b border-slate-800 bg-gradient-to-r from-cyan-950/40 via-slate-900 to-purple-950/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-500/20">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-100 font-['Orbitron'] tracking-wide">
                SYNAPSE<span className="text-cyan-400">AUTH</span>
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                Protocolo de Identidad Criptográfica JWT
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs: Login vs Register */}
        <div className="grid grid-cols-2 border-b border-slate-800 bg-slate-900/50">
          <button
            onClick={() => {
              setIsLoginTab(true);
              setError(null);
              neuralAudio.playNodeSelect();
            }}
            className={`py-3 text-xs font-bold font-mono transition-all border-b-2 ${
              isLoginTab
                ? 'border-cyan-400 text-cyan-300 bg-cyan-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Iniciar Sesión
          </button>
          <button
            onClick={() => {
              setIsLoginTab(false);
              setError(null);
              neuralAudio.playNodeSelect();
            }}
            className={`py-3 text-xs font-bold font-mono transition-all border-b-2 ${
              !isLoginTab
                ? 'border-purple-400 text-purple-300 bg-purple-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Registrar Nodo
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-950/50 border border-rose-500/40 text-xs text-rose-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {!isLoginTab && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1 font-mono">
                Nombre Completo
              </label>
              <div className="relative flex items-center">
                <User className="w-4 h-4 text-slate-500 absolute left-3 pointer-events-none" />
                <input
                  type="text"
                  required
                  placeholder="Ej: Sofía Valenzuela"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2 text-xs bg-slate-900 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-400 font-sans"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1 font-mono">
              Correo Institucional
            </label>
            <div className="relative flex items-center">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 pointer-events-none" />
              <input
                type="email"
                required
                placeholder="usuario@synapse.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 text-xs bg-slate-900 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-400 font-sans"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1 font-mono">
              Contraseña
            </label>
            <div className="relative flex items-center">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 pointer-events-none" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 text-xs bg-slate-900 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-400 font-sans"
              />
            </div>
          </div>

          {!isLoginTab && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1 font-mono">
                  Rol de Conexión
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-purple-400"
                >
                  <option value="student">Estudiante</option>
                  <option value="teacher">Docente / Investigador</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1 font-mono">
                  Cohorte / Facultad
                </label>
                <input
                  type="text"
                  placeholder="Ej: Cohorte Beta 2026"
                  value={cohort}
                  onChange={(e) => setCohort(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-purple-400"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 via-sky-400 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs uppercase tracking-wider font-['Rajdhani'] shadow-lg shadow-cyan-500/25 transition-all disabled:opacity-50"
          >
            {loading ? 'Validando Token...' : isLoginTab ? 'Generar Token y Conectar' : 'Registrar Credenciales JWT'}
          </button>
        </form>

        {/* Quick Demo Access Bar */}
        <div className="p-4 bg-slate-900/60 border-t border-slate-800">
          <div className="text-[10px] uppercase font-mono text-slate-400 mb-2 flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-cyan-400" />
            <span>Acceso Rápido con Cuentas Demo:</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleDemoLogin('student')}
              disabled={loading}
              className="p-2 rounded-xl bg-cyan-950/30 hover:bg-cyan-950/50 border border-cyan-500/30 hover:border-cyan-400 text-cyan-200 text-left transition-all group"
            >
              <div className="text-xs font-bold flex items-center gap-1">
                <span>🎓 Estudiante</span>
                <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="text-[10px] text-slate-400 font-mono truncate">Alex Thorne</div>
            </button>

            <button
              onClick={() => handleDemoLogin('teacher')}
              disabled={loading}
              className="p-2 rounded-xl bg-amber-950/30 hover:bg-amber-950/50 border border-amber-500/30 hover:border-amber-400 text-amber-200 text-left transition-all group"
            >
              <div className="text-xs font-bold flex items-center gap-1">
                <span>👨‍🏫 Docente</span>
                <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="text-[10px] text-slate-400 font-mono truncate">Dra. Elena García</div>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
