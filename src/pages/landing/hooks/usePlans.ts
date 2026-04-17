import { useState, useEffect } from 'react';
import planAPI from '../../../services/planAPI';

interface DisplayFeature {
  name?: string;
  is_included?: boolean;
  custom_value?: string;
  feature?: { name?: string };
}

interface SystemFeature {
  name?: string;
  is_enabled?: boolean;
  limit_value?: number | null;
  description?: string;
  feature?: { name?: string; description?: string };
}

export interface LandingPlan {
  id: string;
  name: string;
  description: string | null;
  monthly_price: string;
  annual_price: string | null;
  is_active: boolean;
  is_recommended: boolean;
  is_hidden: boolean;
  display_features: DisplayFeature[];
  system_features: SystemFeature[];
}

export function usePlans() {
  const [plans, setPlans] = useState<LandingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchPlans() {
      try {
        const response = await planAPI.getPublicPlans() as { plans?: LandingPlan[]; items?: LandingPlan[] };
        if (cancelled) return;

        const allPlans = (response.plans || response.items || [])
          .filter((p) => p.is_active && !p.is_hidden && p.monthly_price !== null)
          .sort((a, b) => parseFloat(a.monthly_price) - parseFloat(b.monthly_price));

        // Fetch features for each plan
        const plansWithFeatures = await Promise.all(
          allPlans.map(async (plan) => {
            try {
              const details = await planAPI.getPlanWithFeatures(plan.id) as {
                display_features?: DisplayFeature[];
                system_features?: SystemFeature[];
              };
              return {
                ...plan,
                display_features: details.display_features || plan.display_features || [],
                system_features: details.system_features || plan.system_features || [],
              };
            } catch {
              return {
                ...plan,
                display_features: plan.display_features || [],
                system_features: plan.system_features || [],
              };
            }
          })
        );

        if (!cancelled) setPlans(plansWithFeatures);
      } catch {
        if (!cancelled) setError('Failed to load plans');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchPlans();
    return () => { cancelled = true; };
  }, []);

  return { plans, loading, error };
}
