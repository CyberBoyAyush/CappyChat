/**
 * Admin Subscription Management Component
 *
 * Allows admins to view and manage all premium subscriptions
 * and user preferences.
 */

"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/frontend/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/frontend/components/ui/card";
import { Badge } from "@/frontend/components/ui/badge";
import { Input } from "@/frontend/components/ui/input";
import { Label } from "@/frontend/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/frontend/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/frontend/components/ui/dialog";
import {
  Users,
  Crown,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
  RefreshCw,
  Edit,
} from "lucide-react";
import { useAuth } from "@/frontend/contexts/AuthContext";
import { toast } from "@/frontend/components/ui/Toast";

interface SubscriptionData {
  subscription: any;
  preferences: any;
  user: {
    $id: string;
    email: string;
    name: string;
    $createdAt: string;
    status: boolean;
  } | null;
}

const SubscriptionManagement: React.FC = () => {
  const { user } = useAuth();
  const [subscriptions, setSubscriptions] = useState<SubscriptionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<SubscriptionData | null>(
    null
  );
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    tier: "",
    credits: {
      free: 0,
      premium: 0,
      superPremium: 0,
    },
  });

  // Fetch subscriptions
  const fetchSubscriptions = async () => {
    if (!user?.$id) return;

    try {
      setLoading(true);
      const response = await fetch(
        `/api/admin/subscriptions?userId=${user.$id}`
      );
      const data = await response.json();

      if (data.success) {
        setSubscriptions(data.data);
      } else {
        toast.error("Failed to fetch subscriptions");
      }
    } catch (error) {
      console.error("Error fetching subscriptions:", error);
      toast.error("Error fetching subscriptions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, [user]);

  // Handle edit user preferences
  const handleEditUser = (userData: SubscriptionData) => {
    setSelectedUser(userData);
    setEditForm({
      tier: userData.preferences?.tier || "free",
      credits: {
        free: userData.preferences?.freeCredits || 0,
        premium: userData.preferences?.premiumCredits || 0,
        superPremium: userData.preferences?.superPremiumCredits || 0,
      },
    });
    setEditDialogOpen(true);
  };

  // Save user preferences
  const handleSavePreferences = async () => {
    if (!selectedUser || !user?.$id) return;

    try {
      const response = await fetch("/api/admin/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminUserId: user.$id,
          targetUserId: selectedUser.user?.$id,
          action: "updatePreferences",
          data: {
            tier: editForm.tier,
            freeCredits: editForm.credits.free,
            premiumCredits: editForm.credits.premium,
            superPremiumCredits: editForm.credits.superPremium,
          },
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success("User preferences updated successfully");
        setEditDialogOpen(false);
        fetchSubscriptions(); // Refresh data
      } else {
        toast.error("Failed to update preferences");
      }
    } catch (error) {
      console.error("Error updating preferences:", error);
      toast.error("Error updating preferences");
    }
  };

  // Cancel subscription
  const handleCancelSubscription = async (userData: SubscriptionData) => {
    if (!user?.$id || !userData.user?.$id) return;

    if (!confirm("Are you sure you want to cancel this subscription?")) return;

    try {
      const response = await fetch("/api/admin/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminUserId: user.$id,
          targetUserId: userData.user.$id,
          action: "cancelSubscription",
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success("Subscription cancelled successfully");
        fetchSubscriptions(); // Refresh data
      } else {
        toast.error("Failed to cancel subscription");
      }
    } catch (error) {
      console.error("Error cancelling subscription:", error);
      toast.error("Error cancelling subscription");
    }
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Active
          </Badge>
        );
      case "cancelled":
        return (
          <Badge className="bg-yellow-100 text-yellow-800">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Cancelled
          </Badge>
        );
      case "expired":
        return (
          <Badge className="bg-red-100 text-red-800">
            <XCircle className="w-3 h-3 mr-1" />
            Expired
          </Badge>
        );
      case "on_hold":
        return (
          <Badge className="bg-orange-100 text-orange-800">
            <AlertTriangle className="w-3 h-3 mr-1" />
            On Hold
          </Badge>
        );
      case "failed":
        return (
          <Badge className="bg-red-100 text-red-800">
            <XCircle className="w-3 h-3 mr-1" />
            Failed
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status || "Unknown"}</Badge>;
    }
  };

  // Get tier badge
  const getTierBadge = (tier: string) => {
    switch (tier) {
      case "premium":
        return (
          <Badge className="bg-purple-100 text-purple-800">
            <Crown className="w-3 h-3 mr-1" />
            Premium
          </Badge>
        );
      case "free":
        return <Badge variant="outline">Free</Badge>;
      default:
        return <Badge variant="secondary">{tier}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading subscriptions...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Subscription Management</h2>
          <p className="text-muted-foreground">
            Manage all premium subscriptions and user preferences
          </p>
        </div>
        <Button onClick={fetchSubscriptions} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4">
        {subscriptions.map((item, index) => (
          <Card key={index} className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-semibold">
                      {item.user?.email || "Unknown User"}
                    </h3>
                    {getTierBadge(item.preferences?.tier || "free")}
                    {getStatusBadge(item.subscription?.status || "unknown")}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    User ID: {item.user?.$id || "N/A"}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEditUser(item)}
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Edit
                </Button>
                {item.subscription?.status === "active" && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleCancelSubscription(item)}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Subscription ID</p>
                <p className="font-mono text-xs break-all">
                  {item.subscription?.subscriptionId || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Customer ID</p>
                <p className="font-mono text-xs break-all">
                  {item.subscription?.customerId || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Amount</p>
                <p>
                  {item.subscription?.currency || "N/A"}{" "}
                  {item.subscription?.amount || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Period End</p>
                <p>
                  {item.subscription?.currentPeriodEnd
                    ? new Date(
                        item.subscription.currentPeriodEnd
                      ).toLocaleDateString()
                    : "N/A"}
                </p>
              </div>
            </div>

            {/* Additional subscription details */}
            <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Last Payment ID</p>
                <p className="font-mono text-xs break-all">
                  {item.subscription?.lastPaymentId || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Retry Count</p>
                <p>{item.subscription?.retryCount || 0}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Cancel at Period End</p>
                <p>{item.subscription?.cancelAtPeriodEnd ? "Yes" : "No"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Created At</p>
                <p>
                  {item.subscription?.createdAt
                    ? new Date(item.subscription.createdAt).toLocaleDateString()
                    : "N/A"}
                </p>
              </div>
            </div>

            {item.preferences && (
              <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                <h4 className="font-medium mb-2">Credits</h4>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Free Models</p>
                    <p className="font-semibold">
                      {item.preferences.freeCredits || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Premium Models</p>
                    <p className="font-semibold">
                      {item.preferences.premiumCredits || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Super Premium</p>
                    <p className="font-semibold">
                      {item.preferences.superPremiumCredits || 0}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Debug: Raw subscription data */}
            <details className="mt-4">
              <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                🔍 Debug: Raw Subscription Data
              </summary>
              <div className="mt-2 p-3 bg-muted/30 rounded-lg">
                <pre className="text-xs overflow-auto">
                  {JSON.stringify(item.subscription, null, 2)}
                </pre>
              </div>
            </details>
          </Card>
        ))}
      </div>

      {subscriptions.length === 0 && (
        <Card className="p-8 text-center">
          <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Subscriptions Found</h3>
          <p className="text-muted-foreground">
            No premium subscriptions are currently active.
          </p>
        </Card>
      )}

      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User Preferences</DialogTitle>
            <DialogDescription>
              Update tier and credits for {selectedUser?.user?.email}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="tier">Tier</Label>
              <Select
                value={editForm.tier}
                onValueChange={(value: string) =>
                  setEditForm({ ...editForm, tier: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label>Credits</Label>
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <Label htmlFor="free-credits" className="text-sm">
                    Free Models
                  </Label>
                  <Input
                    id="free-credits"
                    type="number"
                    value={editForm.credits.free}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        credits: {
                          ...editForm.credits,
                          free: parseInt(e.target.value) || 0,
                        },
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="premium-credits" className="text-sm">
                    Premium Models
                  </Label>
                  <Input
                    id="premium-credits"
                    type="number"
                    value={editForm.credits.premium}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        credits: {
                          ...editForm.credits,
                          premium: parseInt(e.target.value) || 0,
                        },
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="super-premium-credits" className="text-sm">
                    Super Premium Models
                  </Label>
                  <Input
                    id="super-premium-credits"
                    type="number"
                    value={editForm.credits.superPremium}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        credits: {
                          ...editForm.credits,
                          superPremium: parseInt(e.target.value) || 0,
                        },
                      })
                    }
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSavePreferences}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SubscriptionManagement;
