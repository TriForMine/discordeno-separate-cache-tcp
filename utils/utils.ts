import extensionCodec from "./messagepack.ts";
import { encode, decode, decodeMulti } from "./deps.ts";

export function encodeData(data: any) {
  return encode(data, { extensionCodec });
}

export function decodeData(data: Uint8Array) {
  return decode(data, { extensionCodec });
}

export function decodeDataMultiple(data: Uint8Array) {
  return decodeMulti(data, { extensionCodec });
}
