/**
 * Enhanced Session Manager Component
 *
 * Purpose: Provides comprehensive session management with detailed session information,
 * individual session controls, and 3-session limit enforcement.
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/frontend/contexts/AuthContext';
import {
  Monitor,
  Smartphone,
  Tablet,
  Globe,
  RefreshCw,
  LogOut,
  AlertTriangle,
  MapPin,
  Clock,
  Shield,
  X,
  CheckCircle2,
  Trash2,
  Mail
} from 'lucide-react';
import { GoogleIcon, GitHubIcon } from '@/frontend/components/ui/icons';
import { SessionManager as SessionService, type SessionInfo, type DetailedSession } from '@/lib/sessionManager';

const SessionManager: React.FC = () => {
  const { getDetailedSessionInfo, deleteSession, deleteAllOtherSessions, logout, user } = useAuth();
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null);

  const refreshSessionInfo = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const info = await getDetailedSessionInfo();
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

  const handleDeleteSession = async (sessionId: string) => {
    if (sessionId === sessionInfo?.currentSession?.$id) {
      setError('Cannot delete your current session');
      return;
    }

    try {
      setDeletingSessionId(sessionId);
      setError(null);
      await deleteSession(sessionId);
      await refreshSessionInfo(); // Refresh to show updated list
    } catch (err) {
      setError('Failed to delete session');
      console.error('Delete session error:', err);
    } finally {
      setDeletingSessionId(null);
    }
  };

  const handleLogoutOtherSessions = async () => {
    try {
      setLoading(true);
      setError(null);
      await deleteAllOtherSessions();
      await refreshSessionInfo(); // Refresh to show updated list
    } catch (err) {
      setError('Failed to logout from other sessions');
      console.error('Logout other sessions error:', err);
    } finally {
      setLoading(false);
    }
  };

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

  const getDeviceIcon = (session: DetailedSession) => {
    const deviceType = session.deviceName?.toLowerCase() || '';
    const clientType = session.clientType?.toLowerCase() || '';

    if (deviceType.includes('mobile') || deviceType.includes('phone') || clientType.includes('mobile')) {
      return <Smartphone className="w-4 h-4" />;
    } else if (deviceType.includes('tablet') || deviceType.includes('ipad')) {
      return <Tablet className="w-4 h-4" />;
    } else if (deviceType.includes('desktop') || clientType.includes('browser')) {
      return <Monitor className="w-4 h-4" />;
    } else {
      return <Globe className="w-4 h-4" />;
    }
  };

  const getProviderIcon = (provider: string) => {
    switch (provider.toLowerCase()) {
      case 'google':
        return <GoogleIcon className="w-3 h-3" />;
      case 'github':
        return <GitHubIcon className="w-3 h-3" />;
      case 'email':
        return <Mail className="w-3 h-3" />;
      default:
        return <Shield className="w-3 h-3" />;
    }
  };

  if (!user) {
    return null;
  }

  if (!sessionInfo) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Session Management</h3>
          <button
            onClick={refreshSessionInfo}
            disabled={loading}
            className="inline-flex items-center px-3 py-1.5 text-sm bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        <div className="p-4 border rounded-lg bg-card shadow-sm">
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Session Management</h3>
        <button
          onClick={refreshSessionInfo}
          disabled={loading}
          className="inline-flex items-center px-3 py-1.5 text-sm bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
          <div className="flex items-center">
            <AlertTriangle className="w-4 h-4 text-destructive mr-2" />
            <span className="text-sm text-destructive">{error}</span>
          </div>
        </div>
      )}

      {/* Session Limit Indicator */}
      <div className="p-6 border rounded-xl bg-card shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium text-foreground">Active Sessions</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">
              {sessionInfo.sessionCount} of 3
            </span>
            {sessionInfo.sessionCount >= 3 && (
              <AlertTriangle className="w-4 h-4 text-amber-500" />
            )}
          </div>
        </div>

        {/* Session limit progress bar */}
        <div className="w-full bg-muted rounded-full h-3 mb-3">
          <div
            className={`h-3 rounded-full transition-all duration-300 ${
              sessionInfo.sessionCount >= 3
                ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                : sessionInfo.sessionCount >= 2
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-500'
                  : 'bg-gradient-to-r from-green-500 to-emerald-500'
            }`}
            style={{ width: `${Math.min((sessionInfo.sessionCount / 3) * 100, 100)}%` }}
          />
        </div>

        {sessionInfo.sessionCount >= 3 && (
          <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 p-2 rounded-lg">
            <AlertTriangle className="w-3 h-3" />
            Session limit reached. New logins will remove oldest sessions.
          </div>
        )}
      </div>

      {/* Detailed Session List */}
      {sessionInfo.sessions.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Monitor className="w-4 h-4 text-primary" />
            <h4 className="text-sm font-medium text-foreground">Session Details</h4>
          </div>
          {sessionInfo.sessions.map((session) => (
            <div
              key={session.$id}
              className={`p-5 border rounded-xl transition-all duration-200 hover:shadow-md ${
                session.current
                  ? 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800 shadow-sm'
                  : 'bg-card border-border hover:border-primary/30'
              } ${SessionService.isSuspiciousSession(session, sessionInfo.currentSession)
                  ? 'ring-2 ring-amber-200 dark:ring-amber-800 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20'
                  : ''
                }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 mt-1 p-2 rounded-lg bg-primary/10">
                    {getDeviceIcon(session)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-2">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {SessionService.getDeviceInfo(session)}
                      </p>
                      {session.current && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-800">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Current
                        </span>
                      )}
                      {SessionService.isSuspiciousSession(session, sessionInfo.currentSession) && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-800">
                          <Shield className="w-3 h-3 mr-1" />
                          Different Location
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-muted-foreground">
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-3 h-3 text-primary" />
                        <span>{SessionService.getLocationInfo(session)}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="w-3 h-3 text-primary" />
                        <span>{SessionService.getRelativeTime(session.$createdAt)}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getProviderIcon(session.provider)}
                        <span className="capitalize font-medium">{session.provider}</span>
                      </div>
                    </div>
                    {session.ip && (
                      <div className="mt-2 text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded">
                        <span className="font-mono">IP: {session.ip}</span>
                      </div>
                    )}
                  </div>
                </div>
                {!session.current && (
                  <button
                    onClick={() => handleDeleteSession(session.$id)}
                    disabled={deletingSessionId === session.$id}
                    className="flex-shrink-0 inline-flex items-center px-3 py-2 text-xs font-medium bg-destructive/10 text-destructive rounded-lg hover:bg-destructive/20 transition-all duration-200 disabled:opacity-50 border border-destructive/20 hover:border-destructive/30"
                  >
                    {deletingSessionId === session.$id ? (
                      <RefreshCw className="w-3 h-3 animate-spin" />
                    ) : (
                      <>
                        <X className="w-3 h-3 mr-1.5" />
                        Sign Out
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 p-4 bg-muted/30 rounded-xl border">
        {sessionInfo.sessions.filter(s => !s.current).length > 0 && (
          <button
            onClick={handleLogoutOtherSessions}
            disabled={loading}
            className="inline-flex items-center justify-center px-4 py-2.5 text-sm font-medium bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-all duration-200 disabled:opacity-50 border border-border hover:border-primary/30"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out Other Sessions
          </button>
        )}
        <button
          onClick={handleLogoutAllSessions}
          disabled={loading}
          className="inline-flex items-center justify-center px-4 py-2.5 text-sm font-medium bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-all duration-200 disabled:opacity-50 shadow-sm hover:shadow-md"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Sign Out All Sessions
        </button>
      </div>

      {/* Help Text */}
      <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-xl border border-blue-200/50 dark:border-blue-800/50">
        <div className="flex items-center gap-2 mb-3">
          <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <h5 className="text-sm font-medium text-blue-800 dark:text-blue-200">Security Information</h5>
        </div>
        <div className="text-xs text-blue-700 dark:text-blue-300 space-y-2">
          <p className="flex items-start gap-2">
            <span className="w-1 h-1 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
            Maximum 3 concurrent sessions allowed
          </p>
          <p className="flex items-start gap-2">
            <span className="w-1 h-1 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
            Oldest sessions are automatically removed when limit is exceeded
          </p>
          <p className="flex items-start gap-2">
            <span className="w-1 h-1 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
            Sessions are refreshed every 6 hours to maintain security
          </p>
          <p className="flex items-start gap-2">
            <span className="w-1 h-1 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
            Sign out suspicious sessions immediately if you don't recognize them
          </p>
        </div>
      </div>
    </div>
  );
};

export default SessionManager;
