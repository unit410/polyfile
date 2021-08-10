import cbor from 'cbor';

import Address from './Address';
import type MsigPendingTxn from './MsigPendingTxn';
import type MsigTxnIdParams from './MsigTxnIdParams';
import type MsigProposeParams from './MsigProposeParams';
import type Message from './Message';
import MsigAddSignerParams from './MsigAddSignerParams';
import { BufferReader } from 'protobufjs';

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

      const pendingTxns = new Array<MsigPendingTxn>();

      // https://github.com/filecoin-project/specs-actors/blob/845089a6d2580e46055c24415a6c32ee688e5186/actors/builtin/multisig/multisig_state.go#L24
      // The decoded cbor represents a HAMT[TxId] => Transaction
      // extractTxn recursively goes through the decoded cbor array looking for a tuple of [txnid, transaction]
      // If the tuple is found, parse it into our pendingTxn. Continue recursing until all txn parsed.
      function extractTxn(array: unknown[]) {
        if (array.length === 2) {
          const maybeTxId = array[0];
          const maybeTxn = array[1];
          if (maybeTxId instanceof Uint8Array && Array.isArray(maybeTxn) && maybeTxn.length === 5) {
            // lotus serializes the transaction id using golang encoding/binary
            // which implements variant encoding for signed integers following protocol buffers
            // https://developers.google.com/protocol-buffers/docs/encoding#signed_integers
            const reader = new BufferReader(maybeTxId);
            // the return type annotation is wrong on sint64
            // in-browser testing shows it returns a number not a Long as documented
            const txId = (reader.sint64() as unknown) as number;

            // parse
            try {
              const to = Address.FromBuffer(maybeTxn[0]);
              const valueRaw = Buffer.from(maybeTxn[1]);
              const value = valueRaw.length > 0 ? BigInt(`0x${valueRaw.toString('hex')}`) : 0n;
              const method = maybeTxn[2];
              const params = maybeTxn[3];
              const approved = (maybeTxn[4] as Buffer[]).map((item) => Address.FromBuffer(item));

              pendingTxns.push({
                id: txId,
                to,
                value,
                method,
                params,
                approved,
              });
              return;
            } catch (err) {
              // ignore error as we tried to recursively parse something that wasn't valid
            }
          }
        }

        if (!Array.isArray(array)) {
          return;
        }

        for (const item of array) {
          extractTxn(item as unknown[]);
        }
      }

      extractTxn(decoded);
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
