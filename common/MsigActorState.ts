import Address from './Address';
import Cid from './Cid';

interface MsigActorState {
  balance: BigInt;
  state: {
    signers: Address[];
    initialBalance: BigInt;
    nextTxnID: number;
    numApprovalsThreshold: number;
    startEpoch: number;
    unlockDuration: number;
    pendingTxns: Cid;
  };
}

export default MsigActorState;
