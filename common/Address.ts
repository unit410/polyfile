import { blake2b } from 'blakejs';
import leb from 'leb128';
import base32Encode from 'base32-encode';
import base32Decode from 'base32-decode';

type Network = 'f' | 't';

enum Protocol {
  ID = 0,
  SECP256K1 = 1,
  Actor = 2,
  BLS = 3,
}

function Checksum(buffer: Buffer): Buffer {
  return Buffer.from(blake2b(buffer, undefined, 4));
}

export { Protocol };

// https://github.com/filecoin-project/specs/blob/master/content/appendix/address.md
export default class Address {
  // The more common use of addresses is to display as strings
  // We keep a string representation as the internal form
  #str?: string;

  #protocol?: Protocol;
  #payload?: Buffer;

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private constructor() {}

  protocol(): Protocol | undefined {
    return this.#protocol;
  }

  toString(): string {
    if (!this.#str) {
      return '';
    }
    return this.#str;
  }

  toBuffer(): Buffer {
    if (!this.#payload || this.#protocol === undefined) {
      return Buffer.alloc(0);
    }

    return Buffer.concat([Buffer.from([this.#protocol]), this.#payload]);
  }

  isEmpty(): boolean {
    return this.#str === undefined;
  }

  static FromString(address: string): Address {
    const addr = new Address();

    if (address.length < 3) {
      throw new Error('Invalid address length');
    }

    const network = address[0];
    if (network !== 'f' && network !== 't') {
      throw new Error(`Unknown address network: ${network}`);
    }

    const protocolStr = address[1];
    const remainingStr = address.slice(2);

    const protocols = [Protocol.ID, Protocol.Actor, Protocol.SECP256K1, Protocol.BLS];
    for (const protocol of protocols) {
      if (protocolStr === String(protocol)) {
        addr.#protocol = protocol;
      }
    }

    if (addr.#protocol === undefined) {
      throw new Error('Unknown address protocol');
    }

    if (addr.#protocol === Protocol.ID) {
      addr.#payload = leb.unsigned.encode(remainingStr);
      addr.#str = address;
      return addr;
    }

    const remaining = Buffer.from(base32Decode(remainingStr.toUpperCase(), 'RFC4648'));
    if (remaining.length < 4) {
      throw new Error('Malformed address');
    }

    const checkSumLength = 4;
    const payload = remaining.slice(0, remaining.length - checkSumLength);

    if (addr.#protocol === Protocol.SECP256K1 || addr.#protocol === Protocol.Actor) {
      if (payload.length !== 20) {
        throw new Error('Malformed address');
      }
    }

    // check checksum we compute from payload against the checksum bytes
    const actualChecksum = remaining.slice(remaining.length - checkSumLength);
    const expectedChecksum = Checksum(Buffer.concat([Buffer.from([addr.#protocol]), payload]));
    if (Buffer.compare(actualChecksum, expectedChecksum) !== 0) {
      throw new Error('Malformed address');
    }

    addr.#payload = payload;
    addr.#str = address;

    return addr;
  }

  static FromBuffer(buffer: Buffer, network: Network = 'f'): Address {
    const addr = new Address();

    if (buffer.length < 2) {
      throw new Error('Not enough bytes in address buffer');
    }

    const protocol = buffer[0];
    const payload = buffer.slice(1);

    switch (protocol) {
      case Protocol.SECP256K1:
      case Protocol.BLS:
      case Protocol.Actor: {
        const checksum = Checksum(Buffer.concat([Buffer.from([protocol]), payload]));
        addr.#str = `${network}${protocol}${base32Encode(
          Buffer.concat([payload, checksum]),
          'RFC4648',
          { padding: false },
        ).toLowerCase()}`;
        break;
      }
      case Protocol.ID:
        addr.#str = `${network}${protocol}${leb.unsigned.decode(payload)}`;
        break;
      default:
        throw new Error(`Unknown address protocol: ${protocol}`);
    }

    addr.#protocol = protocol;
    addr.#payload = payload;

    return addr;
  }
}
