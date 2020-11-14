declare module '@ledgerhq/hw-transport-webusb' {
  import Transport from '@ledgerhq/hw-transport';

  class TransportWebUSB extends Transport {
    static openConnected(): Promise<TransportWebUSB>;
  }

  export default TransportWebUSB;
}
