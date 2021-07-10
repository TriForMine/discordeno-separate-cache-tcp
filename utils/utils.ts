import extensionCodec from "./messagepack.ts";
import { encode, decode } from "../server/deps.ts";

export function encodeData(data: any) {
    return encode(
        data,
        { extensionCodec }
    )
}

export function decodeData(data: Uint8Array) {
    return decode(
        data,
        { extensionCodec }
    )
}
