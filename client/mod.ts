import { cacheHandlers, decode, encode, TableName } from "./deps.ts";
import extensionCodec from "../utils/messagepack.ts";
import { readStream } from "../utils/readStream.ts";
import {decodeData, encodeData} from "../utils/utils.ts";

async function fetchData(url: string, body?: Uint8Array) {
    return decodeData(
        await readStream(
            (
                await fetch(url, body ? {
                    method: "POST",
                    body: body,
                    headers: {
                        "Content-Type": "application/msgpack",
                        "Content-Length": body.byteLength.toString(),
                    },
                } : { method: "GET" })
            ).body!.getReader()
        )
    );
}

export function setupCache() {
    cacheHandlers.set = async (table: TableName, key: bigint, value: any) => {
        return fetchData(`http://localhost:9999/${table}/${key}/set`, encodeData(value));
    };

    cacheHandlers.get = async (table: TableName, key: bigint) => {
        return fetchData(`http://localhost:9999/${table}/${key}/get`);
    };

    cacheHandlers.clear = async (table: TableName) => {
        return fetchData(`http://localhost:9999/${table}/clear`);
    };

    cacheHandlers.delete = async (table: TableName, key: bigint) => {
        return fetchData(`http://localhost:9999/${table}/${key}/delete`);
    };

    cacheHandlers.has = async (table: TableName, key: bigint) => {
        return fetchData(`http://localhost:9999/${table}/${key}/has`);
    };

    cacheHandlers.size = async (table: TableName) => {
        return fetchData(`http://localhost:9999/${table}/size`);
    };

  cacheHandlers.forEach = async (
    type:
      | "DELETE_MESSAGES_FROM_CHANNEL"
      | "DELETE_MESSAGES_FROM_GUILD"
      | "DELETE_CHANNELS_FROM_GUILD"
      | "DELETE_GUILD_FROM_MEMBER"
      | "DELETE_ROLE_FROM_MEMBER",
    options?: Record<string, unknown>
  ) => {
    return decode(
      await readStream(
        (
          await fetch(
            `http://localhost:9999/forEach/${type}/${
              options ? Object.values(options).join("/") : ""
            }`
          )
        ).body!.getReader()
      ),
      { extensionCodec }
    ).response;
  };

  cacheHandlers.filter = async (
    type: "GET_MEMBERS_IN_GUILD",
    options: { guildId: bigint }
  ) => {
    return decode(
      await readStream(
        (
          await fetch(`http://localhost:9999/filter/${type}/${options.guildId}`)
        ).body!.getReader()
      ),
      { extensionCodec }
    ).response;
  };
}
