import { useCallback, useRef, useState } from "react";

export function useToast(duration = 2000) {
  const [toast, setToast] = useState<string | null>(null);
  const toastTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback(
    (msg: string) => {
      setToast(msg);
      if (toastTimeout.current) clearTimeout(toastTimeout.current);
      toastTimeout.current = setTimeout(() => setToast(null), duration);
    },
    [duration],
  );

  return { toast, showToast };
}
