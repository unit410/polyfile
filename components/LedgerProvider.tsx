import Transport from '@ledgerhq/hw-transport-webusb';
import { ReactNode, ReactElement, useState, useEffect, createContext, useContext } from 'react';
import type FilecoinApp from '@zondax/ledger-filecoin';
import FilecoinLedgerApp from '~/common/FilecoinLedgerApp';
import useAsync from '~/hooks/useAsync';

const LedgerAppContext = createContext<FilecoinApp | null>(null);

function useLedger(): FilecoinApp | null {
  return useContext(LedgerAppContext);
}

export { useLedger };
export default function LedgerProvider(props: { children?: ReactNode }): ReactElement {
  const [app, setApp] = useState<FilecoinApp | null>(null);

  const [transport, _error, _loading, refresh] = useAsync(async () => {
    const isSupported = await Transport.isSupported();
    console.log('Transport[WebUSB]:Supported =', isSupported);
    if (!isSupported) {
      return;
    }

    return Transport.openConnected();
  }, []);

  // An enhancement here would be to use the "listen" feature of Transport
  // That would notify when a device is connected
  useEffect(() => {
    if (transport) {
      return;
    }

    const reconnectInterval = setInterval(() => {
      refresh();
    }, 1000 * 5);

    return () => {
      clearInterval(reconnectInterval);
    };
  }, [transport, refresh]);

  useEffect(() => {
    if (!transport) {
      return;
    }

    transport.on('disconnect', () => {
      console.log('Transport disconnect');
      setApp(null);
      refresh();
    });

    setApp(new FilecoinLedgerApp(transport));

    return () => {
      transport.close();
      refresh();
    };
  }, [transport, refresh]);

  return <LedgerAppContext.Provider value={app}>{props.children}</LedgerAppContext.Provider>;
}
