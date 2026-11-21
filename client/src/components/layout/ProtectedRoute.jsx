import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LogoMark } from '../common/Logo';

function FullScreenLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-mute">
      <div className="flex flex-col items-center gap-4">
        <LogoMark size={48} />
        <div className="h-1.5 w-28 overflow-hidden rounded-full bg-line">
          <div className="h-full w-1/2 animate-pulse rounded-full bg-accent" />
        </div>
      </div>
    </div>
  );
}

/** Blocks unauthenticated access to dashboard routes. */
export default function ProtectedRoute() {
  const { user, initializing } = useAuth();
  const location = useLocation();

  if (initializing) return <FullScreenLoader />;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  return <Outlet />;
}
