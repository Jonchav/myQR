export function useSubscription() {
  // Always return free access - no subscription required
  return {
    subscriptionStatus: { isActive: true, status: "free", plan: "free" },
    isProActive: true, // Always true for free access
    isPending: false,
    trialAvailable: false,
    plan: "free",
    status: "free",
  };
}