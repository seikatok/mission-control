"use client";

import { createContext, useContext, ReactNode } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

interface DefaultUserContextValue {
  defaultUserId: Id<"users"> | null;
}

const DefaultUserContext = createContext<DefaultUserContextValue>({ defaultUserId: null });

export function useDefaultUser() {
  return useContext(DefaultUserContext);
}

export function DefaultUserProvider({ children }: { children: ReactNode }) {
  const user = useQuery(api.users.getDefault);

  if (user === undefined) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950">
        <p className="text-sm text-slate-400">Loading...</p>
      </div>
    );
  }

  return (
    <DefaultUserContext.Provider value={{ defaultUserId: user?._id ?? null }}>
      {children}
    </DefaultUserContext.Provider>
  );
}
