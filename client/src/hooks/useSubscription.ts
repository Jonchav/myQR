import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";

export function useSubscription() {
  const { data: subscriptionStatus, isLoading } = useQuery({
    queryKey: ["/api/subscription/status"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
  });

  const isProActive = subscriptionStatus?.isActive || false;
  const isPending = isLoading;
  const trialAvailable = !subscriptionStatus?.trialUsed && !subscriptionStatus?.isActive;

  return {
    subscriptionStatus,
    isProActive,
    isPending,
    trialAvailable,
    plan: subscriptionStatus?.plan,
    status: subscriptionStatus?.status,
  };
}