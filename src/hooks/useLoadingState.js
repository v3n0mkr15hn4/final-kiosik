import { useEffect, useState } from 'react';

// Elapsed-second timer for a blocking wait, driving the 8s/20s progressive
// messaging described in the loading-states spec. For the app's ~2.4-2.8s
// mocked waits these branches never fire — they exist for when real
// network latency replaces the mock.
export function useLoadingState(isLoading) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!isLoading) {
      setElapsed(0);
      return undefined;
    }
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, [isLoading]);

  return elapsed;
}

export default useLoadingState;
