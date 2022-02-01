import Address from '~/common/Address';
import Cid from '~/common/Cid';
import Message from '~/common/Message';
import MsigActorState from '~/common/MsigActorState';
import MsigPendingTxn from '~/common/MsigPendingTxn';
import { MsigMethod } from '~/common/MsigMethod';
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

interface MessageGas {
  GasFeeCap: string;
  GasLimit: number;
  GasPremium: string;
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

  async msigGetPendingTxns(address: Address, cids: Cid[]): Promise<MsigPendingTxn[]> {
    const resp = await this.request<string>('MsigGetPending', address.toString(), cids);
    const pendingTxns = new Array<MsigPendingTxn>();

    // Artisanal type conversion. Using the exact API(MsigGetPending) allows us to unmarshal nested interfaces using
    // their field names as opposed to using arbitrary indexes inside of raw byte buffer which can be error prone.
    Object.keys(resp).forEach(function (key: string) {
      const approvedAddrs = new Array<Address>();
      const pendingTxn = <MsigPendingTxn>{};
      const rawTxn = resp[key];

      Object.keys(rawTxn).forEach(function (field) {
        switch (field) {
          case 'ID':
            pendingTxn.id = <number>rawTxn[field];
            break;
          case 'To':
            pendingTxn.to = Address.FromString(<string>rawTxn[field]);
            break;
          case 'Value':
            pendingTxn.value = <BigInt>rawTxn[field];
            break;
          case 'Method':
            pendingTxn.method = <MsigMethod>rawTxn[field];
            break;
          case 'Params':
            pendingTxn.params = <Buffer>rawTxn[field];
            // Fixes crash at PendingTxnCard.tsx#L127 where we check params.length < 0
            if (pendingTxn.params == null) {
              pendingTxn.params = <Buffer>{};
            }
            break;
          case 'Approved':
            for (const a of <string>rawTxn[field]) {
              const addr = Address.FromString(a);
              approvedAddrs.push(addr);
            }
            pendingTxn.approved = approvedAddrs;
            break;
          default:
            console.log('field not supported');
        }
      });
      pendingTxns.push(pendingTxn);
    });

    return pendingTxns;
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

  async gasEstimateMessageGas(message: Message, cids: Cid[]): Promise<MessageGas> {
    const lotusMessage = {
      To: message.to.toString(),
      From: message.from.toString(),
      Nonce: message.nonce,
      Value: message.value.toString(),
      Method: message.method,
      Params: message.params.toString('base64'),
    };

    // filecoin token amount has 18 decimal places (attoFil)
    // here we specify 1 filecoin as the maximum
    const sendSpec = {
      MaxFee: '1000000000000000000',
    };

    const res = await this.request<MessageGas>(
      'GasEstimateMessageGas',
      lotusMessage,
      sendSpec,
      cids,
    );

    return {
      GasPremium: res.GasPremium,
      GasFeeCap: res.GasFeeCap,
      GasLimit: res.GasLimit,
    };
  }

  async gasEstimateFeeCap(message: Message, maxQueueBlocks: number, cids: Cid[]): Promise<number> {
    const lotusMessage = {
      To: message.to.toString(),
      From: message.from.toString(),
      Nonce: message.nonce,
      Value: message.value.toString(),
      Method: message.method,
      Params: message.params.toString('base64'),
    };

    return await this.request<number>('GasEstimateFeeCap', lotusMessage, maxQueueBlocks, cids);
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
