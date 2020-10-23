import Address from './Address';

export default interface Message {
  version: number;
  to: Address;
  from: Address;
  nonce: number;
  value: BigInt;
  method: number;
  params: Buffer;
  gasfeecap: BigInt;
  gaspremium: BigInt;
  gaslimit: number;
}
