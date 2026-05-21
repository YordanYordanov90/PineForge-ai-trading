'use client';

import { createContext, useContext, type ReactNode } from 'react';

const UserPlanContext = createContext<string | null>(null);

type UserPlanProviderProps = {
  plan: string;
  children: ReactNode;
};

export function UserPlanProvider({ plan, children }: UserPlanProviderProps) {
  return (
    <UserPlanContext.Provider value={plan}>{children}</UserPlanContext.Provider>
  );
}

export function useUserPlan(): string {
  const plan = useContext(UserPlanContext);
  if (plan == null) {
    throw new Error('useUserPlan must be used within UserPlanProvider');
  }
  return plan;
}
