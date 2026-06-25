import { useEffect, useState } from 'react';

// Anti-flicker: only flips `true` after `delayMs`, so a wait that resolves
// in under ~300ms never flashes a loader. Defensive/future-proofing — the
// app's mocked waits already exceed this, but real network calls won't always.
export function useDelayedLoader(isLoading, delayMs = 300) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      setShow(false);
      return undefined;
    }
    const t = setTimeout(() => setShow(true), delayMs);
    return () => clearTimeout(t);
  }, [isLoading, delayMs]);

  return show;
}

export default useDelayedLoader;
