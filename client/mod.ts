import {cacheHandlers, Collection, decode, encode, TableName} from "./deps.ts";
import extensionCodec from "../utils/messagepack.ts";
import {readStream} from "../utils/readStream.ts";

export function setupCache() {
    cacheHandlers.set = async (table: TableName, key: bigint, value: any) => {
        const data = encode(value, {extensionCodec});
        return decode((await(await fetch(`http://localhost:9999/${table}/${key}/set`, {
            method: 'POST',
            body: data,
            headers: {
                'Content-Type': 'application/msgpack',
                'Content-Length': data.byteLength
            },
        })).body!.getReader().read()).value, {extensionCodec}).response;
    }

    cacheHandlers.get = async (table: TableName, key: bigint) => {
        return decode(await readStream((await fetch(`http://localhost:9999/${table}/${key}/get`)).body!.getReader()), {extensionCodec}).response;
    }

    cacheHandlers.clear = async (table: TableName) => {
        return await fetch(`http://localhost:9999/${table}/clear`);
    }

    cacheHandlers.delete = async (table: TableName, key: bigint) => {
        return decode(await readStream((await fetch(`http://localhost:9999/${table}/${key}/delete`)).body!.getReader()), {extensionCodec}).response;
    }

    cacheHandlers.has = async (table: TableName, key: bigint) => {
        return decode(await readStream((await fetch(`http://localhost:9999/${table}/${key}/has`)).body!.getReader()), {extensionCodec}).response;
    }

    cacheHandlers.size = async (table: TableName) => {
        return Number(decode(await readStream((await fetch(`http://localhost:9999/${table}/size`)).body!.getReader()), {extensionCodec}).response)
    }

    cacheHandlers.forEach = async (table: TableName, callback: (value: any, key: bigint, map: Map<bigint, any>) => unknown) => {
        const values: Collection<bigint, any> = decode(await readStream((await fetch(`http://localhost:9999/${table}/getAll`)).body!.getReader()), {extensionCodec}).response;
        console.log(values);
        return values.forEach(callback);
    }

    cacheHandlers.filter = async (table: TableName, callback: (value: any, key: bigint) => boolean) => {
        const values: Collection<bigint, any> = decode(await readStream((await fetch(`http://localhost:9999/${table}/getAll`)).body!.getReader()), {extensionCodec}).response;
        console.log(values);
        return values.filter(callback);
    }
}
