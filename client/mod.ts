import {
    cacheHandlers,
    Collection,
    TableName,
} from "./deps.ts";
import {
    sendClearRequest,
    sendDeleteRequest, sendGetAllRequest,
    sendGetRequest,
    sendHasRequest,
    sendSetRequest, sendSizeRequest,
    startCacheClient
} from "./tcp.ts";

export function setupCache() {
    cacheHandlers.set = async (table: TableName, key: bigint, value: any) => {
        return await sendSetRequest(table, key, value);
    };

    cacheHandlers.get = async (table: TableName, key: bigint) => {
        return await sendGetRequest(table, key);
    };

    cacheHandlers.clear = async (table: TableName) => {
        return await sendClearRequest(table);
    };

    cacheHandlers.delete = async (table: TableName, key: bigint) => {
        return await sendDeleteRequest(table, key);
    };

    cacheHandlers.has = async (table: TableName, key: bigint) => {
        return await sendHasRequest(table, key);
    };

    cacheHandlers.size = async (table: TableName) => {
        return await sendSizeRequest(table);
    };

    cacheHandlers.getAll = async (table: TableName) => {
        return await sendGetAllRequest(table);
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
        return;
    };

    cacheHandlers.filter = async (
        type: "GET_MEMBERS_IN_GUILD"
    ) => {
        return new Collection();
    };

    startCacheClient().then(undefined);
}

