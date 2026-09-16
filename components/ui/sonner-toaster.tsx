"use client";

import { Toaster } from "sonner";

export function SonnerToaster() {
  return (
    <Toaster
      position="bottom-center"
      richColors
      duration={3000}
      closeButton
    />
  );
}
