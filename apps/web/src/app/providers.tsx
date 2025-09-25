"use client";

import { I18nextProvider } from "react-i18next";
import { TRPCProvider } from "@/lib/trpc/provider";
import { useMemo } from "react";
import i18n from "@/lib/i18n/client";

export function Providers({ children }: { children: React.ReactNode }) {
  const i18next = useMemo(() => i18n, []);

  return (
    <I18nextProvider i18n={i18next}>
      <TRPCProvider>{children}</TRPCProvider>
    </I18nextProvider>
  );
}
