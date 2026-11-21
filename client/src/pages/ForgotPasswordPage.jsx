import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import AuthLayout from './AuthLayout';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { useToast } from '../context/ToastContext';

export default function ForgotPasswordPage() {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!email.trim()) {
      toast('Enter the email on your account', 'warning');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email: email.trim() });
      setSent(true);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="We'll verify your account and issue a secure reset link."
      cta={
        <Link to="/login" className="font-semibold text-accent hover:underline">
          Back to login
        </Link>
      }
    >
      {sent ? (
        <div className="rounded-xl border border-line bg-white p-5 text-sm leading-relaxed shadow-soft">
          <p className="font-semibold">Check your inbox</p>
          <p className="mt-1.5 text-ink-soft">
            If an account exists for <span className="font-medium text-ink">{email}</span>, a reset
            token has been generated.
          </p>
          <p className="mt-2 text-xs text-ink-soft">
            In development, check the API console log for the reset token, then use it with the
            <code className="mx-1 rounded bg-surface-mute px-1 py-0.5 font-mono">/auth/reset-password</code>
            endpoint, or ask the server administrator for help.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <Input
            label="Account email"
            type="email"
            autoComplete="email"
            placeholder="you@university.edu"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Button type="submit" size="lg" loading={loading} className="w-full">
            Send reset link
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
