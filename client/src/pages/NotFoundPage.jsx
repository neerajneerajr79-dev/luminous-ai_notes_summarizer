import React from 'react';
import { Link, useRouteError } from 'react-router-dom';
import { Compass } from 'lucide-react';
import Button from '../components/common/Button';
import Logo from '../components/common/Logo';

export default function NotFoundPage() {
  const error = useRouteError();
  const is404 = error?.status === 404 || true;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface-mute px-6">
      <Logo />
      <div className="mt-10 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-lavender">
        <Compass size={28} className="text-accent" />
      </div>
      <h1 className="mt-5 text-2xl font-extrabold tracking-tight">Page not found</h1>
      <p className="mt-2 max-w-sm text-center text-sm text-ink-soft">
        {is404
          ? "The page you're looking for doesn't exist or may have moved."
          : error?.message || 'Something went wrong.'}
      </p>
      <div className="mt-7 flex gap-2.5">
        <Link to="/">
          <Button variant="outline">Back to home</Button>
        </Link>
        <Link to="/dashboard">
          <Button>Open dashboard</Button>
        </Link>
      </div>
    </div>
  );
}
