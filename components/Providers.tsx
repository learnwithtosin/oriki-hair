"use client";

import { MotionConfig } from "framer-motion";
import { useEffect, type ReactNode } from "react";
import { useCart } from "@/store/cart";

export function Providers({ children }: { children: ReactNode }) {
  // Restore the saved cart after hydration so server and client markup match.
  useEffect(() => {
    useCart.persist.rehydrate();
  }, []);

  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
