import { useState, useEffect } from "react";

export function useClientData<T>(getter: () => T, deps: any[] = []) {
  const [data, setData] = useState<T>(() => {
    if (typeof window === "undefined") return getter();
    return getter();
  });

  useEffect(() => {
    setData(getter());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return [data, setData] as const;
}
