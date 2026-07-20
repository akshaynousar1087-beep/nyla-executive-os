"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, isConfigured } from "@/lib/supabase/client";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;

    const restore = async () => {
      if (!isConfigured()) {
        if (active) setReady(true);
        return;
      }

      const session = await auth.restoreSession();
      if (!active) return;
      if (session) setReady(true);
      else router.replace("/login");
    };

    restore();
    return () => {
      active = false;
    };
  }, [router]);

  if (!ready)
    return (
      <div className="boot">
        <div className="nyla-orb">N</div>
        <p>Preparing your workspace…</p>
      </div>
    );

  return <>{children}</>;
}
