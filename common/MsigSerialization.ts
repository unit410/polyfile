import cbor from 'cbor';

import Address from './Address';
import type MsigPendingTxn from './MsigPendingTxn';
import type MsigTxnIdParams from './MsigTxnIdParams';
import type MsigProposeParams from './MsigProposeParams';
import type Message from './Message';
import MsigAddSignerParams from './MsigAddSignerParams';

function serializeBigint(bigint: BigInt): Buffer {
  // zero values can use an empty buffer
  if (bigint === 0n) {
    return Buffer.from('');
  }

  // filecoin serialization uses a leading sign byte (yes whole byte)
  // 0 = positive number
  // 1 = negative number
  const signByteHex = bigint < 0n ? '01' : '00';

  // Bigint.toString does not output an even length hex string so we prefix a 0
  // to make a buffer compatible hex string - otherwise Buffer.from will truncate characters
  let bigIntHex = BigInt(bigint).toString(16);
  if (bigIntHex.length % 2 !== 0) {
    bigIntHex = '0' + bigIntHex;
  }

  return Buffer.from(signByteHex + bigIntHex, 'hex');
}

export default {
  PendingTxns: {
    FromBuffer: (buffer: Buffer): MsigPendingTxn[] => {
      const decoded = cbor.decode(buffer);

      const encodedTxns = decoded[1];
      const pendingTxns = new Array<MsigPendingTxn>();

      for (const encodedTxn of encodedTxns) {
        const entry = encodedTxn[1];

        for (const pendingTx of entry) {
          const txidRaw = pendingTx[0];
          const txId = txidRaw.readIntBE(0, txidRaw.length) >> 1;
          const detail = pendingTx[1];

          const to = Address.FromBuffer(detail[0]);
          const valueRaw = detail[1];
          const value = valueRaw.length > 0 ? BigInt(`0x${valueRaw.toString('hex')}`) : 0n;
          const method = detail[2];
          const params = detail[3];
          const approved = (detail[4] as Buffer[]).map((item) => Address.FromBuffer(item));

          pendingTxns.push({
            id: txId,
            to,
            value,
            method,
            params,
            approved,
          });
        }
      }

      return pendingTxns;
    },
  },
  TxnIdParams: {
    ToBuffer: (txnIdParams: MsigTxnIdParams): Buffer => {
      return Buffer.from(
        cbor.encode([txnIdParams.txid, txnIdParams.proposalHash ?? Buffer.alloc(0)]),
      );
    },
  },
  ProposeParams: {
    // [to, value, method, params]
    FromBuffer: (buffer: Buffer): MsigProposeParams => {
      const decoded = cbor.decode(buffer);

      return {
        to: Address.FromBuffer(decoded[0]),
        value: decoded[1],
        method: decoded[2],
        params: decoded[3],
      };
    },
    ToBuffer: (params: MsigProposeParams): Buffer => {
      const serialized = cbor.encode([
        params.to.toBuffer(),
        serializeBigint(params.value),
        params.method,
        params.params,
      ]);

      return Buffer.from(serialized);
    },
  },
  AddSignerParams: {
    // [signer, increase]
    FromBuffer: (buffer: Buffer): MsigAddSignerParams => {
      const decoded = cbor.decode(buffer);

      const signer = Address.FromBuffer(decoded[0]);
      const increase = decoded[1];

      return {
        signer,
        increase,
      };
    },
  },
  Message: {
    // [version, to, from, nonce, value, gas limit, gas fee cap, gas premium, method, params]
    ToBuffer: (message: Message): Buffer => {
      const serialized = cbor.encode([
        message.version,
        message.to.toBuffer(),
        message.from.toBuffer(),
        message.nonce,
        serializeBigint(message.value),
        message.gaslimit,
        serializeBigint(message.gasfeecap),
        serializeBigint(message.gaspremium),
        message.method,
        message.params,
      ]);

      return Buffer.from(serialized);
    },
  },
};
