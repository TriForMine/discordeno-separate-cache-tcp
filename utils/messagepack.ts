import {
  ExtensionCodec,
  encode,
  decode,
  DecodeError,
  Collection,
} from "./deps.ts";

const extensionCodec = new ExtensionCodec();
extensionCodec.register({
  type: 0,
  encode: (input: unknown) => {
    if (typeof input === "bigint") {
      if (
        input <= Number.MAX_SAFE_INTEGER &&
        input >= Number.MIN_SAFE_INTEGER
      ) {
        return encode(parseInt(input.toString(), 10));
      } else {
        return encode(input.toString());
      }
    } else {
      return null;
    }
  },
  decode: (data: Uint8Array) => {
    const val = decode(data);
    if (!(typeof val === "string" || typeof val === "number")) {
      throw new DecodeError(`unexpected BigInt source: ${val} (${typeof val})`);
    }
    return BigInt(val);
  },
});

extensionCodec.register({
  type: 1,
  encode: (input: unknown) => {
    if (input instanceof Collection) {
      return encode(
        input.map((value, index) => [index, value]),
        { extensionCodec }
      );
    } else {
      return null;
    }
  },
  decode: (data: Uint8Array) => {
    const val = decode(data, { extensionCodec });
    if (!(typeof val === "object")) {
      throw new DecodeError(
        `unexpected Collection source: ${val} (${typeof val})`
      );
    }
    return new Collection(val);
  },
});

export default extensionCodec;
