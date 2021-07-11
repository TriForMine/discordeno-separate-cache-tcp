import { decodeDataMultiple, encodeData } from "../utils/utils.ts";
import { iter } from "./deps.ts";

export interface CacheClient {
  conn?: Deno.Conn;
  pendingRequests: Map<string, (data: any) => unknown>;
}

const cacheClient: CacheClient = {
  conn: undefined,
  pendingRequests: new Map<string, (data: any) => unknown>(),
};

async function sendCacheRequest(data: any) {
  if (!cacheClient.conn) throw new Error("Client is not connected!");
  const nonce = Date.now().toString(36) + Math.random().toString(36).substr(2);

  const encodedData = encodeData({ nonce, data });
  await cacheClient.conn.write(encodedData);
  return nonce;
}

async function createRequestPromise(nonce: string) {
  return new Promise((res, rej) => {
    const resolve = (data: any) => res(data);
    cacheClient.pendingRequests.set(nonce, resolve);
  });
}

export async function sendGetRequest(table: string, key: any) {
  const nonce = await sendCacheRequest({ type: "GET", table, key });
  return await createRequestPromise(nonce);
}

export async function sendSetRequest(table: string, key: any, value: any) {
  const nonce = await sendCacheRequest({ type: "SET", table, key, value });
  return await createRequestPromise(nonce);
}

export async function sendHasRequest(table: string, key: any) {
  const nonce = await sendCacheRequest({ type: "HAS", table, key });
  return await createRequestPromise(nonce);
}

export async function sendClearRequest(table: string) {
  const nonce = await sendCacheRequest({ type: "CLEAR", table });
  return await createRequestPromise(nonce);
}

export async function sendSizeRequest(table: string) {
  const nonce = await sendCacheRequest({ type: "SIZE", table });
  return await createRequestPromise(nonce);
}

export async function sendDeleteRequest(table: string, key: any) {
  const nonce = await sendCacheRequest({ type: "DELETE", table, key });
  return await createRequestPromise(nonce);
}

export async function sendGetAllRequest(table: string) {
  const nonce = await sendCacheRequest({ type: "GET_ALL", table });
  return await createRequestPromise(nonce);
}

async function onMessage(data: { nonce: string; data: any }) {
  if (cacheClient.pendingRequests.has(data.nonce)) {
    cacheClient.pendingRequests.get(data.nonce)!(data.data);
    cacheClient.pendingRequests.delete(data.nonce);
  }
}

async function listenMessages() {
  if (!cacheClient.conn) return;
  try {
    for await (const data of iter(cacheClient.conn, { bufSize: 64 * 1024 })) {
      try {
        for (const decodedData of decodeDataMultiple(data)) {
          if (decodedData) onMessage(decodedData);
        }
      } catch (e) {
        console.error(e);
      }
    }
  } catch (e) {
    console.error(e);
  }
}

export async function startCacheClient() {
  cacheClient.conn = await Deno.connect({ port: 8080 });
  listenMessages();
}
