import Address from './Address';

interface WalletAddress {
  path: string;
  address: Address;
}

interface SignResponse {
  returnCode: number;
  signatureCompact: Uint8Array;
  signatureDer: Uint8Array;
}

class WalletError extends Error {
  code?: number = 0;

  constructor(msg?: string, code?: number) {
    super(msg);
    this.code = code;
  }
}

interface Wallet {
  addresses(): Promise<WalletAddress[]>;
  sign(address: WalletAddress, message: Buffer): Promise<SignResponse>;
}

export type { WalletAddress, SignResponse };
export { WalletError };
export default Wallet;
