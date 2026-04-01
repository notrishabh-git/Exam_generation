import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { GraduationCap, Eye, EyeOff, ArrowRight, Loader2, Shield, Zap, Lock } from 'lucide-react';
import { authAPI } from '../utils/api';
import { useAuthStore } from '../store';
import ParticleBackground from '../components/ParticleBackground';
import './Auth.css';

export function Login() {
  const navigate = useNavigate();
  const setAuth = useAuthStore(s => s.setAuth);
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await authAPI.login(form);
      setAuth(data.user, data.token);
      toast.success(`Welcome back, ${data.user.name}!`);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.message || 'Invalid credentials');
    } finally { setLoading(false); }
  };

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to your ExamGen account to continue generating exams">
      <form onSubmit={handleSubmit} className="auth-form">
        <div className="input-group">
          <label className="input-label">Email address</label>
          <input className="input" type="email" placeholder="professor@college.edu"
            value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
        </div>
        <div className="input-group">
          <label className="input-label">Password</label>
          <div className="input-password">
            <input className="input" type={showPass ? 'text' : 'password'} placeholder="••••••••"
              value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />
            <button type="button" className="pass-toggle" onClick={() => setShowPass(s => !s)}>
              {showPass ? <EyeOff size={15}/> : <Eye size={15}/>}
            </button>
          </div>
        </div>
        <button className="btn btn-primary auth-submit" type="submit" disabled={loading}>
          {loading ? <Loader2 size={16} className="animate-spin"/> : <>Sign In <ArrowRight size={15}/></>}
        </button>
        <p className="auth-switch">Don't have an account? <Link to="/register">Create one free</Link></p>
      </form>
    </AuthShell>
  );
}

export function Register() {
  const navigate = useNavigate();
  const setAuth = useAuthStore(s => s.setAuth);
  const [form, setForm] = useState({ name:'', email:'', password:'', department:'', institution:'' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await authAPI.register(form);
      setAuth(data.user, data.token);
      toast.success('Account created! Welcome to ExamGen.');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.message || 'Registration failed');
    } finally { setLoading(false); }
  };

  const f = (key) => ({ value: form[key], onChange: e => setForm(p => ({ ...p, [key]: e.target.value })) });

  return (
    <AuthShell title="Create account" subtitle="Start generating smarter exam papers with AI in minutes">
      <form onSubmit={handleSubmit} className="auth-form">
        <div className="auth-grid">
          <div className="input-group">
            <label className="input-label">Full Name</label>
            <input className="input" placeholder="Dr. Priya Sharma" {...f('name')} required />
          </div>
          <div className="input-group">
            <label className="input-label">Department</label>
            <input className="input" placeholder="Computer Engg." {...f('department')} />
          </div>
        </div>
        <div className="input-group">
          <label className="input-label">Institution</label>
          <input className="input" placeholder="AISSMS IOIT, Pune" {...f('institution')} />
        </div>
        <div className="input-group">
          <label className="input-label">Email address</label>
          <input className="input" type="email" placeholder="professor@college.edu" {...f('email')} required />
        </div>
        <div className="input-group">
          <label className="input-label">Password</label>
          <div className="input-password">
            <input className="input" type={showPass ? 'text' : 'password'} placeholder="Min 8 characters" {...f('password')} required minLength={8} />
            <button type="button" className="pass-toggle" onClick={() => setShowPass(s => !s)}>
              {showPass ? <EyeOff size={15}/> : <Eye size={15}/>}
            </button>
          </div>
        </div>
        <button className="btn btn-primary auth-submit" type="submit" disabled={loading}>
          {loading ? <Loader2 size={16} className="animate-spin"/> : <>Create Account <ArrowRight size={15}/></>}
        </button>
        <p className="auth-switch">Already have an account? <Link to="/login">Sign in</Link></p>
        <div className="auth-features">
          <div className="auth-feature"><Shield size={12}/> Secure JWT auth</div>
          <div className="auth-feature"><Zap size={12}/> Free AI generation</div>
          <div className="auth-feature"><Lock size={12}/> Private papers</div>
        </div>
      </form>
    </AuthShell>
  );
}

function AuthShell({ title, subtitle, children }) {
  const [mousePos, setMousePos] = React.useState({ x: 0, y: 0 });

  React.useEffect(() => {
    const handleMouseMove = (e) => {
      const { innerWidth, innerHeight } = window;
      const x = (e.clientX / innerWidth - 0.5) * 12; // Rotate up to 12 degrees
      const y = (e.clientY / innerHeight - 0.5) * -12;
      setMousePos({ x, y });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="auth-page">
      <ParticleBackground />
      <div className="auth-card-container">
        <div 
          className="auth-card"
          style={{
            transform: `rotateX(${mousePos.y}deg) rotateY(${mousePos.x}deg)`,
            transition: 'transform 0.1s cubic-bezier(0.2, 0.8, 0.2, 1)',
            transformStyle: 'preserve-3d'
          }}
        >
          <div className="auth-logo" style={{ transform: 'translateZ(40px)' }}>
            <div className="auth-logo-icon"><GraduationCap size={22}/></div>
            <span className="auth-logo-name" style={{ backgroundImage: 'linear-gradient(270deg, #fff, #8b5cf6, #fff)', backgroundSize: '200% auto', WebkitBackgroundClip: 'text', color: 'transparent', animation: 'shineTitle 3s linear infinite' }}>ExamGen</span>
          </div>
          <h1 className="auth-title" style={{ transform: 'translateZ(30px)' }}>{title}</h1>
          <p className="auth-subtitle" style={{ transform: 'translateZ(20px)' }}>{subtitle}</p>
          <div style={{ transform: 'translateZ(10px)' }}>
            {children}
          </div>
        </div>
      </div>
      <div className="auth-footer" style={{ zIndex: 1 }}>AI-powered exam question generation for educators</div>
    </div>
  );
}
