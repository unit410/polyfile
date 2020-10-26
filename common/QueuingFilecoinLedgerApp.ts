import type Transport from '@ledgerhq/hw-transport';
import FilecoinApp, {
  AddressAndPubkeyResponse,
  SignResponse,
  DeviceInfoResponse,
  VersionResponse,
  AppInfoResponse,
} from '@zondax/ledger-filecoin';

import AsyncQueue from './AsyncQueue';

class QueuingFilecoinLedgerApp implements FilecoinApp {
  #app: FilecoinApp;

  #requestQueue = new AsyncQueue();

  constructor(transport: Transport) {
    this.#app = new FilecoinApp(transport);
  }

  getAddressAndPubKey(path: string): Promise<AddressAndPubkeyResponse> {
    return this.#requestQueue.enqueue(() => this.#app.getAddressAndPubKey(path));
  }

  sign(path: string, message: Buffer): Promise<SignResponse> {
    return this.#requestQueue.enqueue(() => this.#app.sign(path, message));
  }

  deviceInfo(): Promise<DeviceInfoResponse> {
    return this.#requestQueue.enqueue(() => this.#app.deviceInfo());
  }

  getVersion(): Promise<VersionResponse> {
    return this.#requestQueue.enqueue(() => this.#app.getVersion());
  }

  appInfo(): Promise<AppInfoResponse> {
    return this.#requestQueue.enqueue(() => this.#app.appInfo());
  }
}

export default QueuingFilecoinLedgerApp;
