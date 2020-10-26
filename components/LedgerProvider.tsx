import Transport from '@ledgerhq/hw-transport-webusb';
import { ReactNode, ReactElement, useState, useEffect, createContext, useContext } from 'react';
import type FilecoinApp from '@zondax/ledger-filecoin';
import QueuingFilecoinLedgerApp from '~/common/QueuingFilecoinLedgerApp';
import useAsync from '~/hooks/useAsync';

const LedgerAppContext = createContext<FilecoinApp | null>(null);

function useLedger(): FilecoinApp | null {
  return useContext(LedgerAppContext);
}

export { useLedger };
export default function LedgerProvider(props: { children?: ReactNode }): ReactElement {
  const [reconnect, setReconnect] = useState(true);
  const [app, setApp] = useState<FilecoinApp | null>(null);

  const [transport] = useAsync(async () => {
    // flag to trigger reconnect
    // silences hook unused dependency error
    reconnect;

    const isSupported = await Transport.isSupported();
    console.log('Transport[WebUSB]:Supported =', isSupported);
    if (!isSupported) {
      return;
    }

    return Transport.create();
  }, [reconnect]);

  // An enhancement here would be to use the "listen" feature of Transport
  // That would notify when a device is connected
  useEffect(() => {
    if (transport) {
      return;
    }

    const reconnectInterval = setInterval(() => {
      setReconnect((old) => !old);
    }, 1000 * 5);

    return () => {
      clearInterval(reconnectInterval);
    };
  }, [transport]);

  useEffect(() => {
    if (!transport) {
      return;
    }

    transport.on('disconnect', () => {
      console.log('Transport disconnect');
      setApp(null);
      setReconnect((old) => !old);
    });

    setApp(new QueuingFilecoinLedgerApp(transport));

    return () => {
      transport.close();
      setReconnect((old) => !old);
    };
  }, [transport]);

  return <LedgerAppContext.Provider value={app}>{props.children}</LedgerAppContext.Provider>;
}
