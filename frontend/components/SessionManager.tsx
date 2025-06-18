/**
 * Session Manager Component
 * 
 * Purpose: Provides session management utilities and debugging information
 * for handling multiple device logins and session limits.
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/frontend/contexts/AuthContext';
import { Monitor, Smartphone, Tablet, Globe, RefreshCw, LogOut, AlertTriangle } from 'lucide-react';

interface SessionInfo {
  hasSession: boolean;
  sessionCount: number;
}

const SessionManager: React.FC = () => {
  const { checkActiveSessions, logout, user } = useAuth();
  const [sessionInfo, setSessionInfo] = useState<SessionInfo>({ hasSession: false, sessionCount: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshSessionInfo = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const info = await checkActiveSessions();
      setSessionInfo(info);
    } catch (err) {
      setError('Failed to fetch session information');
      console.error('Session info error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      refreshSessionInfo();
    }
  }, [user]);

  const handleLogoutAllSessions = async () => {
    try {
      setLoading(true);
      await logout();
    } catch (err) {
      setError('Failed to logout from all sessions');
      console.error('Logout error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  const getDeviceIcon = (index: number) => {
    const icons = [Monitor, Smartphone, Tablet, Globe];
    const IconComponent = icons[index % icons.length];
    return <IconComponent className="w-4 h-4" />;
  };

  return (
    <div className="bg-card border rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Session Management</h3>
        <button
          onClick={refreshSessionInfo}
          disabled={loading}
          className="inline-flex items-center px-3 py-1 text-sm bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="flex items-center space-x-2 text-destructive bg-destructive/10 p-3 rounded-md">
          <AlertTriangle className="w-4 h-4" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Active Sessions:</span>
          <span className="text-sm font-medium text-foreground">
            {sessionInfo.sessionCount}
          </span>
        </div>

        {sessionInfo.sessionCount > 0 && (
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">Devices:</div>
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: Math.min(sessionInfo.sessionCount, 4) }, (_, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-2 bg-muted px-3 py-2 rounded-md"
                >
                  {getDeviceIcon(index)}
                  <span className="text-xs text-muted-foreground">
                    Device {index + 1}
                  </span>
                </div>
              ))}
              {sessionInfo.sessionCount > 4 && (
                <div className="flex items-center space-x-2 bg-muted px-3 py-2 rounded-md">
                  <Globe className="w-4 h-4" />
                  <span className="text-xs text-muted-foreground">
                    +{sessionInfo.sessionCount - 4} more
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {sessionInfo.sessionCount > 1 && (
          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 p-3 rounded-md">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                  Multiple Sessions Detected
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  You're logged in on {sessionInfo.sessionCount} devices. If you're experiencing 
                  unexpected logouts, this might be due to session limits.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="pt-2 border-t">
          <button
            onClick={handleLogoutAllSessions}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 text-sm bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 transition-colors disabled:opacity-50"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout from All Devices
          </button>
        </div>
      </div>

      <div className="text-xs text-muted-foreground space-y-1">
        <p>• Sessions are automatically refreshed every 24 hours</p>
        <p>• Single-session enforcement prevents multiple device conflicts</p>
        <p>• Use "Logout from All Devices" if you suspect unauthorized access</p>
      </div>
    </div>
  );
};

export default SessionManager;
