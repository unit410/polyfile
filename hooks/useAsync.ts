import { DependencyList, useCallback, useEffect, useRef, useState } from 'react';

export default function useAsync<T, ErrorT = Error>(
  fn: () => Promise<T>,
  deps: DependencyList,
): [T | undefined, ErrorT | null, boolean, () => void] {
  const [val, setVal] = useState<T | undefined>(undefined);
  const [error, setError] = useState<ErrorT | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, [isMountedRef]);

  // we ignore the error with exhausitve deps since it incorrectly wants us to include "fn" in the deps
  // "fn" here is the callback that we want to memoize so we should not include it
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const fnWithDeps = useCallback(fn, deps);

  const refresh = useCallback(() => {
    setLoading(true);
    setError(null);

    fnWithDeps()
      .then((val) => {
        if (isMountedRef.current) {
          setLoading(false);
          setVal(val);
        }
      })
      .catch((err) => {
        if (isMountedRef.current) {
          setLoading(false);
          setError(err);
        }
      });
  }, [fnWithDeps]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return [val, error, loading, refresh];
}
