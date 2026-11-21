import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Palette, LogOut, Sun, Moon, Camera } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Badge from '../components/common/Badge';
import { initials } from '../utils/format';

export default function SettingsPage() {
  const { user, updateProfile, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [name, setName] = useState(user?.name || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [savingProfile, setSavingProfile] = useState(false);

  const [pw, setPw] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [pwErrors, setPwErrors] = useState({});
  const [savingPw, setSavingPw] = useState(false);

  const [loggingOut, setLoggingOut] = useState(false);

  const saveProfile = async () => {
    if (!name.trim()) {
      toast('Name cannot be empty', 'warning');
      return;
    }
    setSavingProfile(true);
    try {
      await updateProfile({ name: name.trim(), avatar });
      toast('Profile updated', 'success');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const changePassword = async () => {
    const errors = {};
    if (!pw.currentPassword) errors.currentPassword = 'Enter your current password';
    if (!pw.newPassword) errors.newPassword = 'Enter a new password';
    else if (pw.newPassword.length < 8) errors.newPassword = 'Use at least 8 characters';
    if (pw.newPassword !== pw.confirm) errors.confirm = 'Passwords do not match';
    setPwErrors(errors);
    if (Object.keys(errors).length) return;

    setSavingPw(true);
    try {
      await api.patch('/auth/password', {
        currentPassword: pw.currentPassword,
        newPassword: pw.newPassword,
      });
      toast('Password changed successfully', 'success');
      setPw({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setSavingPw(false);
    }
  };

  const doLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      toast('Logged out', 'success');
      navigate('/login');
    } catch (err) {
      toast(err.message, 'error');
      setLoggingOut(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-extrabold tracking-tight">Settings</h1>
        <p className="text-xs text-ink-soft">Manage your profile, security and appearance</p>
      </div>

      {/* Profile */}
      <div className="card p-6">
        <h2 className="flex items-center gap-2 text-sm font-bold">
          <User size={15} className="text-accent" /> Profile
        </h2>
        <div className="mt-5 flex items-center gap-4">
          {avatar ? (
            <img src={avatar} alt="Profile" className="h-16 w-16 rounded-2xl object-cover" />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-accent-soft text-lg font-bold text-white">
              {initials(user?.name || '')}
            </div>
          )}
          <div className="flex-1">
            <Input
              label="Profile image URL (optional)"
              placeholder="https://example.com/avatar.jpg"
              value={avatar}
              onChange={(e) => setAvatar(e.target.value)}
            />
          </div>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Input label="Full name" value={name} onChange={(e) => setName(e.target.value)} />
          <Input label="Email" value={user?.email || ''} disabled hint="Email changes are not supported yet" />
        </div>
        <div className="mt-5 flex items-center justify-between">
          <p className="text-2xs text-ink-soft">Member since {new Date(user?.createdAt).toLocaleDateString()}</p>
          <Button onClick={saveProfile} loading={savingProfile}>Save changes</Button>
        </div>
      </div>

      {/* Security */}
      <div className="card p-6">
        <h2 className="flex items-center gap-2 text-sm font-bold">
          <Lock size={15} className="text-accent" /> Change password
        </h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            changePassword();
          }}
          className="mt-5 grid gap-4 sm:grid-cols-3"
        >
          <Input
            label="Current"
            type="password"
            value={pw.currentPassword}
            onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })}
            error={pwErrors.currentPassword}
            autoComplete="current-password"
          />
          <Input
            label="New"
            type="password"
            value={pw.newPassword}
            onChange={(e) => setPw({ ...pw, newPassword: e.target.value })}
            error={pwErrors.newPassword}
            autoComplete="new-password"
          />
          <Input
            label="Confirm new"
            type="password"
            value={pw.confirm}
            onChange={(e) => setPw({ ...pw, confirm: e.target.value })}
            error={pwErrors.confirm}
            autoComplete="new-password"
          />
          <div className="sm:col-span-3">
            <Button type="submit" loading={savingPw} variant="secondary">
              Update password
            </Button>
          </div>
        </form>
      </div>

      {/* Appearance */}
      <div className="card p-6">
        <h2 className="flex items-center gap-2 text-sm font-bold">
          <Palette size={15} className="text-accent" /> Appearance
        </h2>
        <div className="mt-5 grid grid-cols-2 gap-3">
          {[
            { id: 'light', label: 'Light (recommended)', icon: Sun },
            { id: 'dark', label: 'Dark', icon: Moon },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTheme(t.id)}
              className={`card flex items-center justify-center gap-2 p-4 text-xs font-bold transition-all ${
                theme === t.id ? '!border-accent ring-2 ring-accent/20 text-accent' : 'hover:border-accent/30'
              }`}
              aria-pressed={theme === t.id}
            >
              <t.icon size={16} />
              {t.label}
            </button>
          ))}
        </div>
        {theme === 'dark' && (
          <p className="mt-3 text-2xs text-ink-soft">
            Dark mode is an optional preview. Light stays the primary experience.
          </p>
        )}
      </div>

      {/* Account */}
      <div className="card border-red-100 p-6 dark:border-red-900/50">
        <h2 className="flex items-center gap-2 text-sm font-bold">
          <LogOut size={15} className="text-red-400" /> Account
        </h2>
        <p className="mt-2 text-xs text-ink-soft">
          Log out of Lumio on this device. Your notes remain safely saved in your account.
        </p>
        <div className="mt-4">
          <Button variant="danger" icon={LogOut} loading={loggingOut} onClick={doLogout}>
            Log out
          </Button>
        </div>
      </div>
    </div>
  );
}
