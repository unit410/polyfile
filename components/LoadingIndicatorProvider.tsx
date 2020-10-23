import {
  createContext,
  PropsWithChildren,
  ReactElement,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { LinearProgress } from '@material-ui/core';

type LoadingIndicatorFn = (show?: boolean) => void;

const LoadingIndicatorContext = createContext<LoadingIndicatorFn>(() => {
  return;
});

function useLoadingIndicator(): LoadingIndicatorFn {
  return useContext(LoadingIndicatorContext);
}

export { LoadingIndicatorContext, useLoadingIndicator };
export default function LoadingIndicatorProvider(props: PropsWithChildren<unknown>): ReactElement {
  const [showLoadingIndicator, setShowLoadingIndicator] = useState(false);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const loadingIndicator: LoadingIndicatorFn = (show = true) => {
    if (isMounted.current) {
      setShowLoadingIndicator(show);
    }
  };

  return (
    <>
      {showLoadingIndicator && (
        <LinearProgress style={{ position: 'absolute', width: '100%', zIndex: 10000 }} />
      )}
      <LoadingIndicatorContext.Provider value={loadingIndicator}>
        {props.children}
      </LoadingIndicatorContext.Provider>
    </>
  );
}
