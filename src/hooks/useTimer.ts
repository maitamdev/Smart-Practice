import { useEffect, useState } from "react";

export function useTimer(endTime: number | null, onExpire: () => void) {
  const [remainingSeconds, setRemainingSeconds] = useState(() =>
    endTime ? Math.max(0, Math.ceil((endTime - Date.now()) / 1000)) : 0,
  );

  useEffect(() => {
    if (!endTime) return;
    let hasExpired = false;

    const sync = () => {
      const remaining = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
      setRemainingSeconds(remaining);
      if (remaining === 0 && !hasExpired) {
        hasExpired = true;
        onExpire();
      }
    };

    sync();
    const intervalId = window.setInterval(sync, 1000);
    const handleVisibility = () => sync();
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [endTime, onExpire]);

  return remainingSeconds;
}
