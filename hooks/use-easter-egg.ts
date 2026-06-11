import { useCallback, useRef, useState } from "react";

const TAPS_REQUIRED = 10;
const RESET_DELAY_MS = 1500;

export function useEasterEgg() {
  const [active, setActive] = useState(false);
  const count = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onTap = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => { count.current = 0; }, RESET_DELAY_MS);
    count.current += 1;
    if (count.current >= TAPS_REQUIRED) {
      count.current = 0;
      setActive(true);
    }
  }, []);

  const dismiss = useCallback(() => setActive(false), []);

  return { active, onTap, dismiss };
}
