/**
 * Admin Page Component
 * 
 * Simple admin interface for managing tier system operations.
 * Only accessible to admin users.
 */

import { useState } from "react";
import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/frontend/components/ui/card";
import { useAuth } from "@/frontend/contexts/AuthContext";
import { getUserTierInfo } from "@/lib/tierSystem";
import { Shield, RefreshCw, Calendar, User, AlertTriangle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function AdminPage() {
  const { user } = useAuth();
  const [adminKey, setAdminKey] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [userIdInput, setUserIdInput] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  // Check if current user is admin
  useState(() => {
    const checkAdminStatus = async () => {
      if (!user) return;
      
      try {
        const tierInfo = await getUserTierInfo();
        setIsAdmin(tierInfo?.tier === 'admin');
      } catch (error) {
        console.error('Error checking admin status:', error);
      }
    };

    checkAdminStatus();
  });

  const handleResetAllLimits = async () => {
    if (!adminKey.trim()) {
      toast.error("Please enter admin key");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/reset-limits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          adminKey: adminKey.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || 'All user limits reset successfully');
      } else {
        toast.error(data.error || 'Failed to reset limits');
      }
    } catch (error) {
      console.error('Error resetting limits:', error);
      toast.error('Network error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetUserLimits = async () => {
    if (!adminKey.trim()) {
      toast.error("Please enter admin key");
      return;
    }

    if (!userIdInput.trim()) {
      toast.error("Please enter user ID");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/reset-limits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          adminKey: adminKey.trim(),
          userId: userIdInput.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || 'User limits reset successfully');
        setUserIdInput("");
      } else {
        toast.error(data.error || 'Failed to reset user limits');
      }
    } catch (error) {
      console.error('Error resetting user limits:', error);
      toast.error('Network error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMonthlyReset = async () => {
    if (!adminKey.trim()) {
      toast.error("Please enter admin key");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/monthly-reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          adminKey: adminKey.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || 'Monthly reset completed successfully');
      } else {
        toast.error(data.error || 'Failed to perform monthly reset');
      }
    } catch (error) {
      console.error('Error performing monthly reset:', error);
      toast.error('Network error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Access Denied
            </CardTitle>
            <CardDescription>
              Please log in to access the admin panel.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-red-500" />
              Admin Access Required
            </CardTitle>
            <CardDescription>
              You need admin privileges to access this page.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3 mb-8">
          <Shield className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Admin Panel</h1>
            <p className="text-muted-foreground">Tier system management</p>
          </div>
        </div>

        {/* Admin Key Input */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Admin Authentication
            </CardTitle>
            <CardDescription>
              Enter the admin secret key to perform administrative operations.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Input
              type="password"
              placeholder="Enter admin secret key"
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
              className="max-w-md"
            />
          </CardContent>
        </Card>

        {/* Reset Operations */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Reset All Users */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5" />
                Reset All User Limits
              </CardTitle>
              <CardDescription>
                Reset credit limits for all users based on their current tier.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={handleResetAllLimits}
                disabled={isLoading || !adminKey.trim()}
                className="w-full"
                variant="destructive"
              >
                {isLoading ? "Resetting..." : "Reset All Limits"}
              </Button>
            </CardContent>
          </Card>

          {/* Monthly Reset */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Monthly Reset
              </CardTitle>
              <CardDescription>
                Perform monthly reset for users who need it (checks last reset date).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={handleMonthlyReset}
                disabled={isLoading || !adminKey.trim()}
                className="w-full"
              >
                {isLoading ? "Processing..." : "Run Monthly Reset"}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Reset Specific User */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Reset Specific User
            </CardTitle>
            <CardDescription>
              Reset credit limits for a specific user by their user ID.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Enter user ID"
              value={userIdInput}
              onChange={(e) => setUserIdInput(e.target.value)}
              className="max-w-md"
            />
            <Button
              onClick={handleResetUserLimits}
              disabled={isLoading || !adminKey.trim() || !userIdInput.trim()}
              variant="outline"
            >
              {isLoading ? "Resetting..." : "Reset User Limits"}
            </Button>
          </CardContent>
        </Card>

        {/* Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              System Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p>✅ Tier system is active</p>
              <p>✅ Credit tracking is enabled</p>
              <p>✅ Admin operations are available</p>
              <p className="text-muted-foreground">
                Current user: {user.name} ({user.email})
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
