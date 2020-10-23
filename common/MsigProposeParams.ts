import Address from './Address';
import { MsigMethod } from './MsigMethod';

export default interface MsigProposeParams {
  to: Address;
  value: BigInt;
  method: MsigMethod;
  params: Buffer;
}
