import React, { useState } from 'react';
import { User, Lock, Bell, Palette, Key, Save, Loader2, Check, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import AppLayout from '../components/layout/AppLayout';
import { useAuthStore } from '../store';
import { authAPI } from '../utils/api';
import './Settings.css';

const TABS = [
  { id: 'profile',    label: 'Profile',      icon: User },
  { id: 'security',   label: 'Security',     icon: Lock },
  { id: 'preferences',label: 'Preferences',  icon: Palette },
  { id: 'api',        label: 'API & Integrations', icon: Key },
  { id: 'notifications', label: 'Notifications', icon: Bell },
];

function ProfileTab() {
  const { user, setAuth } = useAuthStore();
  const token = useAuthStore(s => s.token);
  const [form, setForm] = useState({
    name: user?.name || '', department: user?.department || '',
    institution: user?.institution || '', email: user?.email || '',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data } = await authAPI.updateProfile(form);
      setAuth(data.user, token);
      toast.success('Profile updated');
    } catch { toast.error('Update failed'); }
    finally { setSaving(false); }
  };

  return (
    <div className="settings-section">
      <div className="settings-section-header">
        <h3>Profile Information</h3>
        <p>Update your personal and institutional details</p>
      </div>
      <div className="settings-avatar-row">
        <div className="settings-avatar">{user?.name?.[0]?.toUpperCase() || 'P'}</div>
        <div>
          <div className="settings-avatar-name">{user?.name}</div>
          <div className="settings-avatar-role">{user?.department} · {user?.institution}</div>
        </div>
      </div>
      <div className="settings-grid">
        {[
          { key:'name',        label:'Full Name',    placeholder:'Dr. Priya Sharma' },
          { key:'email',       label:'Email',        placeholder:'professor@college.edu', type:'email', disabled: true },
          { key:'department',  label:'Department',   placeholder:'Computer Engineering' },
          { key:'institution', label:'Institution',  placeholder:'AISSMS IOIT, Pune' },
        ].map(f => (
          <div key={f.key} className="input-group">
            <label className="input-label">{f.label}</label>
            <input
              className="input"
              type={f.type || 'text'}
              placeholder={f.placeholder}
              disabled={f.disabled}
              value={form[f.key]}
              onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
            />
          </div>
        ))}
      </div>
      <div className="settings-actions">
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? <><Loader2 size={14} className="animate-spin"/>Saving…</> : <><Save size={14}/>Save Changes</>}
        </button>
      </div>
    </div>
  );
}

function SecurityTab() {
  const [form, setForm] = useState({ currentPassword:'', newPassword:'', confirmPassword:'' });
  const [show, setShow] = useState({});
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (form.newPassword !== form.confirmPassword) {
      toast.error('Passwords do not match'); return;
    }
    if (form.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters'); return;
    }
    setSaving(true);
    try {
      await authAPI.changePassword({ currentPassword: form.currentPassword, newPassword: form.newPassword });
      toast.success('Password updated');
      setForm({ currentPassword:'', newPassword:'', confirmPassword:'' });
    } catch { toast.error('Incorrect current password'); }
    finally { setSaving(false); }
  };

  return (
    <div className="settings-section">
      <div className="settings-section-header">
        <h3>Change Password</h3>
        <p>Ensure your account uses a strong, unique password</p>
      </div>
      <div className="settings-form-narrow">
        {[
          { key:'currentPassword', label:'Current Password' },
          { key:'newPassword',     label:'New Password' },
          { key:'confirmPassword', label:'Confirm New Password' },
        ].map(f => (
          <div key={f.key} className="input-group">
            <label className="input-label">{f.label}</label>
            <div className="input-password">
              <input className="input" type={show[f.key] ? 'text' : 'password'}
                placeholder="••••••••"
                value={form[f.key]}
                onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
              />
              <button type="button" className="pass-toggle" onClick={() => setShow(s => ({ ...s, [f.key]: !s[f.key] }))}>
                {show[f.key] ? <EyeOff size={15}/> : <Eye size={15}/>}
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="settings-actions">
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 size={14} className="animate-spin"/> : <Save size={14}/>}
          {saving ? 'Updating…' : 'Update Password'}
        </button>
      </div>
    </div>
  );
}

function PreferencesTab() {
  const [prefs, setPrefs] = useState({
    defaultDifficulty: 'mixed',
    defaultDuration: 3,
    bloomsEnabled: true,
    answerKeyEnabled: true,
    autoSaveEnabled: true,
    compactMode: false,
    defaultSubjectCode: '',
    defaultInstitution: '',
  });
  const toggle = (key) => setPrefs(p => ({ ...p, [key]: !p[key] }));

  return (
    <div className="settings-section">
      <div className="settings-section-header">
        <h3>Generation Preferences</h3>
        <p>Default settings applied to every new paper</p>
      </div>

      <div className="pref-group">
        <div className="pref-group-label">Defaults</div>
        <div className="settings-grid">
          <div className="input-group">
            <label className="input-label">Default Difficulty</label>
            <select className="select" value={prefs.defaultDifficulty}
              onChange={e => setPrefs(p => ({ ...p, defaultDifficulty: e.target.value }))}>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
              <option value="mixed">Mixed</option>
            </select>
          </div>
          <div className="input-group">
            <label className="input-label">Default Duration (hours)</label>
            <input className="input" type="number" min="0.5" max="6" step="0.5"
              value={prefs.defaultDuration}
              onChange={e => setPrefs(p => ({ ...p, defaultDuration: parseFloat(e.target.value) }))}
            />
          </div>
        </div>
      </div>

      <div className="pref-group">
        <div className="pref-group-label">Features</div>
        {[
          { key:'bloomsEnabled',    label:"Bloom's Taxonomy tags",  desc:'Tag every question with cognitive level' },
          { key:'answerKeyEnabled', label:'Answer key generation',  desc:'Include answers with every paper' },
          { key:'autoSaveEnabled',  label:'Auto-save papers',       desc:'Automatically save drafts' },
          { key:'compactMode',      label:'Compact UI mode',        desc:'Denser layout for smaller screens' },
        ].map(p => (
          <div key={p.key} className="option-row">
            <div>
              <div className="option-label">{p.label}</div>
              <div className="option-desc">{p.desc}</div>
            </div>
            <label className="toggle" onClick={() => toggle(p.key)}>
              <input type="checkbox" readOnly checked={prefs[p.key]}/>
              <span className="toggle-track"/>
              <span className="toggle-thumb"/>
            </label>
          </div>
        ))}
      </div>

      <div className="settings-actions">
        <button className="btn btn-primary" onClick={() => toast.success('Preferences saved')}>
          <Save size={14}/> Save Preferences
        </button>
      </div>
    </div>
  );
}

function APITab() {
  const [keyVisible, setKeyVisible] = useState(false);
  const maskedKey = 'sk-ant-api03-••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••';

  return (
    <div className="settings-section">
      <div className="settings-section-header">
        <h3>API & Integrations</h3>
        <p>Manage API keys and external service connections</p>
      </div>

      <div className="api-info-banner">
  <Key size={16}/>
  <div>
    <div className="api-banner-title">Groq API</div>
    <div className="api-banner-desc">ExamGen uses Groq (Llama 3) to generate intelligent exam questions. Free to use with no credit card required.</div>
  </div>
  <span className="badge badge-green badge-dot">Connected</span>
</div>

      <div className="settings-form-narrow">
        <div className="input-group">
          <label className="input-label">Groq API Key (server-side)</label>
          <div className="input-password">
            <input className="input" type={keyVisible ? 'text' : 'password'} value={maskedKey} readOnly/>
            <button type="button" className="pass-toggle" onClick={() => setKeyVisible(v => !v)}>
              {keyVisible ? <EyeOff size={15}/> : <Eye size={15}/>}
            </button>
          </div>
          <p className="hint-text">To update your API key, set GROQ_API_KEY in your server .env file and restart.</p>
        </div>
      </div>

      <div className="integrations-grid">
        {[
          { name:'Google Docs', desc:'Export papers directly to Google Docs', status:'soon' },
          { name:'LMS Export',  desc:'Export to Moodle / Canvas XML format',  status:'soon' },
          { name:'Email',       desc:'Send papers directly to students',       status:'soon' },
        ].map(i => (
          <div key={i.name} className="integration-card">
            <div className="integration-info">
              <div className="integration-name">{i.name}</div>
              <div className="integration-desc">{i.desc}</div>
            </div>
            <span className="badge badge-gray">Coming soon</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Settings() {
  const [activeTab, setActiveTab] = useState('profile');

  const CONTENT = { profile: <ProfileTab/>, security: <SecurityTab/>, preferences: <PreferencesTab/>, api: <APITab/> };

  return (
    <AppLayout>
      <div className="settings-page animate-fade-in">
        <div className="settings-tabs">
          {TABS.map(t => (
            <button key={t.id}
              className={`settings-tab ${activeTab === t.id ? 'active' : ''}`}
              onClick={() => setActiveTab(t.id)}>
              <t.icon size={15}/>{t.label}
            </button>
          ))}
        </div>
        <div className="settings-body">
          {CONTENT[activeTab] || (
            <div className="papers-empty">
              <Bell size={40}/>
              <h3>Coming soon</h3>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
