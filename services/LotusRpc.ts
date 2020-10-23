import Address from '~/common/Address';
import Cid from '~/common/Cid';
import Message from '~/common/Message';
import MsigActorState from '~/common/MsigActorState';
import SignedMessage from '~/common/SignedMessage';

// https://github.com/filecoin-project/lotus/blob/master/api/api_full.go

interface RpcResponse<T> {
  id: number;
  jsonrpc: number;
  result?: T;
  error?: { code: number; message: string };
}

interface ChainHead {
  Cids: Cid[];
}

class LotusRpc {
  #endpoint: string;

  constructor(endpoint: string) {
    this.#endpoint = endpoint;
  }

  async chainHead(): Promise<ChainHead> {
    const resp = await this.request<ChainHead>('ChainHead');
    return resp;
  }

  async chainReadObj(cid: Cid): Promise<Buffer> {
    const resp = await this.request<string>('ChainReadObj', cid);
    return Buffer.from(resp, 'base64');
  }

  async stateReadState(actorAddress: Address, cids: Cid[]): Promise<MsigActorState> {
    interface LotusRpcMsigActorState {
      Balance: string;
      State: {
        Signers: string[];
        InitialBalance: string;
        NextTxnID: number;
        NumApprovalsThreshold: number;
        StartEpoch: number;
        UnlockDuration: number;
        PendingTxns: Cid;
      };
    }

    const resp = await this.request<LotusRpcMsigActorState>(
      'StateReadState',
      actorAddress.toString(),
      cids,
    );

    const state = resp.State;
    return {
      balance: BigInt(resp.Balance),
      state: {
        signers: state.Signers.map(Address.FromString),
        initialBalance: BigInt(state.InitialBalance),
        nextTxnID: state.NextTxnID,
        numApprovalsThreshold: state.NumApprovalsThreshold,
        startEpoch: state.StartEpoch,
        unlockDuration: state.UnlockDuration,
        pendingTxns: state.PendingTxns,
      },
    };
  }

  async stateAccountKey(actorAddress: Address, cids: Cid[]): Promise<Address> {
    const resp = await this.request<string>('StateAccountKey', actorAddress.toString(), cids);
    return Address.FromString(resp);
  }

  async mpoolGetNonce(address: Address): Promise<number> {
    const resp = await this.request<number>('MpoolGetNonce', address.toString());
    return resp;
  }

  async mpoolPush(signedMessage: SignedMessage): Promise<Cid> {
    const message = signedMessage.message;

    const lotusSignedMessage = {
      Message: {
        To: message.to.toString(),
        From: message.from.toString(),
        Nonce: message.nonce,
        Value: message.value.toString(),
        Method: message.method,
        Params: message.params.toString('base64'),
        GasFeeCap: message.gasfeecap.toString(),
        GasLimit: message.gaslimit,
        GasPremium: message.gaspremium.toString(),
      },
      Signature: {
        Type: signedMessage.signature.type,
        Data: Buffer.from(signedMessage.signature.data).toString('base64'),
      },
    };

    const resp = await this.request<Cid>('MpoolPush', lotusSignedMessage);
    return resp;
  }

  async msigGetAvailableBalance(address: Address, cids: Cid[]): Promise<string> {
    const resp = await this.request<string>('MsigGetAvailableBalance', address.toString(), cids);
    return resp;
  }

  async gasEstimateGasLimit(message: Message, cids: Cid[]): Promise<number> {
    const lotusMessage = {
      To: message.to.toString(),
      From: message.from.toString(),
      Nonce: message.nonce,
      Value: message.value.toString(),
      Method: message.method,
      Params: message.params.toString('base64'),
    };

    const resp = await this.request<number>('GasEstimateGasLimit', lotusMessage, cids);
    return resp;
  }

  async request<T>(method: string, ...params: unknown[]): Promise<T> {
    const resp = await fetch(this.#endpoint, {
      method: 'post',
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: `Filecoin.${method}`,
        params: [...params],
        id: 1,
      }),
    });

    if (resp.status !== 200) {
      throw new Error('request failed');
    }

    const body = (await resp.json()) as RpcResponse<T>;

    if (body.error) {
      throw new Error(body.error.message);
    }

    if (body.result === undefined) {
      throw new Error('Unexpected missing result in jsonrpc response');
    }

    return body.result;
  }
}

export default LotusRpc;
