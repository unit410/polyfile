declare module 'leb128' {
  function decode(buffer: Buffer): string;
  function encode(num: string | number): Buffer;

  const signed = { decode, encode };
  const unsigned = { decode, encode };

  export { signed, unsigned };
}
