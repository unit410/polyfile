declare module '@zondax/ledger-filecoin' {
  import type Transport from '@ledgerhq/hw-transport';

  type AddressAndPubkeyResponse = {
    addrByte: Uint8Array;
    addrString: string;
    compressed_pk: Uint8Array;
    error_message: string;
    return_code: number;
  };

  type SignResponse = {
    error_message: string;
    return_code: number;
    signature_compact?: Uint8Array;
    signature_der?: Uint8Array;
  };

  type DeviceInfoResponse = {
    error_message: string;
    flag: string;
    mcuVersion: string;
    return_code: number;
    seVersion: string;
    targetId: string;
  };

  class FilecoinApp {
    transport: Transport;

    constructor(transport: Transport);

    async getAddressAndPubKey(path: string): Promise<AddressAndPubkeyResponse>;
    async sign(path: string, message: Buffer): Promise<SignResponse>;
    async deviceInfo(): Promise<DeviceInfoResponse>;

    /*
    appInfo: async (...args) => {…}
    getVersion: async (...args) => {…}
    sign: async (...args) => {…}
    */
  }

  export type { AddressAndPubkeyResponse };
  export default FilecoinApp;
}
