declare module 'blakejs' {
  /** Computes the BLAKE2B hash of a string or byte array, and returns a Uint8Array
   *
   * @return n-byte Uint8Array
   *
   * @param input - the input bytes, as a string, Buffer, or Uint8Array (Strings are converted to UTF8 bytes)
   * @param key - optional key Uint8Array, up to 64 bytes
   * @param outlen - optional output length in bytes, default 64
   */
  function blake2b(
    input: string | Buffer | Uint8Array,
    key?: Uint8Array,
    outlen?: number,
  ): Uint8Array;

  export { blake2b };
}
