declare module '@zondax/ledger-filecoin' {
  import type Transport from '@ledgerhq/hw-transport';

  type BaseResponse = {
    error_message: string;
    return_code: number;
  };

  type AddressAndPubkeyResponse = {
    addrByte: Uint8Array;
    addrString: string;
    compressed_pk: Uint8Array;
  } & BaseResponse;

  type SignResponse = {
    signature_compact?: Uint8Array;
    signature_der?: Uint8Array;
  } & BaseResponse;

  type DeviceInfoResponse = {
    flag: string;
    mcuVersion: string;
    seVersion: string;
    targetId: string;
  } & BaseResponse;

  type VersionResponse = {
    device_locked: boolean;
    version: string;
    major: number;
    minor: number;
    patch: number;
    target_id: string;
    test_mode: boolean;
  } & BaseResponse;

  type AppInfoResponse = {
    appName: string;
    appVersion: string;
    flagLen: number;
    flag_onboarded: boolean;
    flag_pin_validated: boolean;
    flag_recovery: boolean;
    flag_signed_mcu_code: boolean;
    flagsValue: number;
  } & BaseResponse;

  class FilecoinApp {
    transport: Transport;

    constructor(transport: Transport);

    async getAddressAndPubKey(path: string): Promise<AddressAndPubkeyResponse>;
    async sign(path: string, message: Buffer): Promise<SignResponse>;
    async deviceInfo(): Promise<DeviceInfoResponse>;
    async getVersion(): Promise<VersionResponse>;
    async appInfo(): Promise<AppInfoResponse>;
  }

  export type { AddressAndPubkeyResponse };
  export default FilecoinApp;
}
