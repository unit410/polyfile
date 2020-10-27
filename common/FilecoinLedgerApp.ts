import type Transport from '@ledgerhq/hw-transport';
import FilecoinApp, {
  AddressAndPubkeyResponse,
  SignResponse,
  DeviceInfoResponse,
  VersionResponse,
  AppInfoResponse,
} from '@zondax/ledger-filecoin';

import { Mutex } from 'async-mutex';

/** FilecoinApp wrapper that protects concurrent access to methods via an async mutex
 *
 * Ledger apps only support one req/res method at a time. If you invoke another method while
 * the first is not complete, the app responds with a busy error. This wrapper class prevents
 * concurrent calls via a mutex. If a call is made while another is in-flight, the new call is
 * blocked until the previous returns.
 */
class FilecoinLedgerApp implements FilecoinApp {
  #app: FilecoinApp;

  #lock = new Mutex();

  constructor(transport: Transport) {
    this.#app = new FilecoinApp(transport);
  }

  getAddressAndPubKey(path: string): Promise<AddressAndPubkeyResponse> {
    return this.#lock.runExclusive(() => this.#app.getAddressAndPubKey(path));
  }

  sign(path: string, message: Buffer): Promise<SignResponse> {
    return this.#lock.runExclusive(() => this.#app.sign(path, message));
  }

  deviceInfo(): Promise<DeviceInfoResponse> {
    return this.#lock.runExclusive(() => this.#app.deviceInfo());
  }

  getVersion(): Promise<VersionResponse> {
    return this.#lock.runExclusive(() => this.#app.getVersion());
  }

  appInfo(): Promise<AppInfoResponse> {
    return this.#lock.runExclusive(() => this.#app.appInfo());
  }
}

export default FilecoinLedgerApp;
