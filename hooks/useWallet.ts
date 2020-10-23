import { useState } from 'react';
import Transport from '@ledgerhq/hw-transport-webusb';
import FilecoinApp from '@zondax/ledger-filecoin';

import Address from '~/common/Address';
import Wallet, { SignResponse, WalletAddress, WalletError } from '~/common/Wallet';

class LedgerWallet implements Wallet {
  async addresses(): Promise<WalletAddress[]> {
    const addresses = new Array<WalletAddress>();
    const transport = await Transport.create();

    try {
      const app = new FilecoinApp(transport);

      // Load the first 5 addresses from the ledger
      // This path is compatible with glif wallet addresses when using ledger
      const pathBase = "m/44'/461'/0'/0";
      for (let i = 0; i < 5; ++i) {
        const path = `${pathBase}/${i}`;
        const addrResponse = await app.getAddressAndPubKey(path);
        if (addrResponse.error_message !== 'No errors') {
          console.error(
            new Error(`Error loading address at ${path}: ${addrResponse.error_message}`),
          );
          continue;
        }

        addresses.push({
          path,
          address: Address.FromString(addrResponse.addrString),
        });
      }

      return addresses;
    } finally {
      await transport.close();
    }
  }

  async sign(address: WalletAddress, message: Buffer): Promise<SignResponse> {
    const transport = await Transport.create();
    const app = new FilecoinApp(transport);

    try {
      const resp = await app.sign(address.path, message);

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
    } finally {
      await transport.close();
    }
  }
}

export default function useWallet(): Wallet {
  const [wallet] = useState(new LedgerWallet());
  return wallet;
}
