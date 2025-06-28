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
  Trash2
} from 'lucide-react';
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
        return '🔍';
      case 'github':
        return '🐙';
      case 'email':
        return '📧';
      default:
        return '🔐';
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
      <div className="p-4 border rounded-lg bg-card shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-muted-foreground">Active Sessions:</span>
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
        <div className="w-full bg-muted rounded-full h-2 mb-3">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${
              sessionInfo.sessionCount >= 3
                ? 'bg-amber-500'
                : sessionInfo.sessionCount >= 2
                  ? 'bg-blue-500'
                  : 'bg-green-500'
            }`}
            style={{ width: `${Math.min((sessionInfo.sessionCount / 3) * 100, 100)}%` }}
          />
        </div>

        {sessionInfo.sessionCount >= 3 && (
          <div className="text-xs text-amber-600 dark:text-amber-400">
            Session limit reached. New logins will remove oldest sessions.
          </div>
        )}
      </div>

      {/* Detailed Session List */}
      {sessionInfo.sessions.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-foreground">Active Sessions</h4>
          {sessionInfo.sessions.map((session) => (
            <div
              key={session.$id}
              className={`p-4 border rounded-lg ${
                session.current
                  ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800'
                  : 'bg-card border-border'
              } ${SessionService.isSuspiciousSession(session, sessionInfo.currentSession)
                  ? 'ring-2 ring-amber-200 dark:ring-amber-800'
                  : ''
                }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-1">
                    {getDeviceIcon(session)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-medium text-foreground truncate">
                        {SessionService.getDeviceInfo(session)}
                      </p>
                      {session.current && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Current
                        </span>
                      )}
                      {SessionService.isSuspiciousSession(session, sessionInfo.currentSession) && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200">
                          <Shield className="w-3 h-3 mr-1" />
                          Different Location
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex items-center space-x-4 text-xs text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <MapPin className="w-3 h-3" />
                        <span>{SessionService.getLocationInfo(session)}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{SessionService.getRelativeTime(session.$createdAt)}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <span>{getProviderIcon(session.provider)}</span>
                        <span className="capitalize">{session.provider}</span>
                      </div>
                    </div>
                    {session.ip && (
                      <div className="mt-1 text-xs text-muted-foreground">
                        IP: {session.ip}
                      </div>
                    )}
                  </div>
                </div>
                {!session.current && (
                  <button
                    onClick={() => handleDeleteSession(session.$id)}
                    disabled={deletingSessionId === session.$id}
                    className="flex-shrink-0 inline-flex items-center px-2 py-1 text-xs bg-destructive/10 text-destructive rounded-md hover:bg-destructive/20 transition-colors disabled:opacity-50"
                  >
                    {deletingSessionId === session.$id ? (
                      <RefreshCw className="w-3 h-3 animate-spin" />
                    ) : (
                      <>
                        <X className="w-3 h-3 mr-1" />
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
      <div className="flex flex-col sm:flex-row gap-3">
        {sessionInfo.sessions.filter(s => !s.current).length > 0 && (
          <button
            onClick={handleLogoutOtherSessions}
            disabled={loading}
            className="inline-flex items-center justify-center px-4 py-2 text-sm bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors disabled:opacity-50"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out Other Sessions
          </button>
        )}
        <button
          onClick={handleLogoutAllSessions}
          disabled={loading}
          className="inline-flex items-center justify-center px-4 py-2 text-sm bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 transition-colors disabled:opacity-50"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Sign Out All Sessions
        </button>
      </div>

      {/* Help Text */}
      <div className="text-xs text-muted-foreground space-y-1 p-3 bg-muted/50 rounded-md">
        <p>• Maximum 3 concurrent sessions allowed</p>
        <p>• Oldest sessions are automatically removed when limit is exceeded</p>
        <p>• Sessions are refreshed every 6 hours to maintain security</p>
        <p>• Sign out suspicious sessions immediately if you don't recognize them</p>
      </div>
    </div>
  );
};

export default SessionManager;
