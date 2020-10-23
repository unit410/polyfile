import Address from './Address';
import { MsigMethod } from './MsigMethod';

export default interface MsigPendingTxn {
  id: number;
  to: Address;
  value: BigInt;
  method: MsigMethod;
  params: Buffer;
  approved: Address[];
}
