import { useEffect, useState } from 'react';
import type FilecoinApp from '@zondax/ledger-filecoin';

import Address from '~/common/Address';
import Wallet, { SignResponse, WalletAddress, WalletError } from '~/common/Wallet';
import { useLedger } from '~/components/LedgerProvider';

class LedgerWallet implements Wallet {
  #app: FilecoinApp;

  constructor(app: FilecoinApp) {
    this.#app = app;
  }

  async addresses(): Promise<WalletAddress[]> {
    const addresses = new Array<WalletAddress>();

    // Load the first 10 addresses from the ledger
    // This path is compatible with glif wallet addresses when using ledger
    const pathBase = "m/44'/461'/0'/0";
    for (let i = 0; i < 10; ++i) {
      const path = `${pathBase}/${i}`;
      const addrResponse = await this.#app.getAddressAndPubKey(path);
      if (addrResponse.error_message !== 'No errors') {
        console.error(new Error(`Error loading address at ${path}: ${addrResponse.error_message}`));
        continue;
      }

      addresses.push({
        path,
        address: Address.FromString(addrResponse.addrString),
      });
    }

    return addresses;
  }

  async sign(address: WalletAddress, message: Buffer): Promise<SignResponse> {
    const resp = await this.#app.sign(address.path, message);

    if (resp.error_message && resp.error_message !== 'No errors') {
      throw new WalletError(resp.error_message, resp.return_code);
    }

    if (!resp.signature_compact || !resp.signature_der) {
      throw new Error('missing signatures in ledger.sign response');
    }

    return {
      returnCode: resp.return_code,
      signatureCompact: resp.signature_compact,
      signatureDer: resp.signature_der,
    };
  }
}

export default function useWallet(): Wallet | null {
  const ledger = useLedger();
  const [wallet, setWallet] = useState<LedgerWallet | null>(null);

  useEffect(() => {
    if (!ledger) {
      return;
    }

    setWallet(new LedgerWallet(ledger));
  }, [ledger]);

  return wallet;
}
