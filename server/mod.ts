import {decodeDataMultiple, encodeData} from "../utils/utils.ts";
import get from "./functions/get.ts";
import set from "./functions/set.ts";
import has from "./functions/has.ts";
import size from "./functions/size.ts";
import clear from "./functions/clear.ts";
import deleteOne from "./functions/delete.ts";
import getAll from "./functions/getAll.ts";
import { iter } from "./deps.ts";

async function sendResponse(conn: Deno.Conn, nonce: Uint8Array, data: Uint8Array) {
    await conn.write(encodeData({nonce, data}));
}

async function onMessage(conn: Deno.Conn, {data, nonce}: { nonce: Uint8Array, data: any }) {
    if(!data || !data.type)
        return;
    let result;
    switch (data.type) {
        case "GET":
            result = get(data.table, data.key);
            break;
        case "SET":
            set(data.table, data.key, data.value);
            result = true;
            break;
        case "HAS":
            result = has(data.table, data.key);
            break;
        case "SIZE":
            result = size(data.table);
            break;
        case "CLEAR":
            result = clear(data.table);
            break;
        case "DELETE":
            result = deleteOne(data.table, data.key);
            break;
        case "GET_ALL":
            result = getAll(data.table);
            break;
    }
    await sendResponse(conn, nonce, result);
}

async function listenMessages(conn: Deno.Conn) {
    try {
        for await (const data of iter(conn, {bufSize: 64 * 1024})){
            try {
                for (const decodedData of decodeDataMultiple(data)) {
                    if(decodedData)
                        onMessage(conn, decodedData);
                }
            } catch (e) {
                console.error(e);
            }
        }
    } catch (e) {
        console.error(e);
    }
}

async function startServer() {
    const listener = Deno.listen({ port: 8080 });
    console.log("listening on 0.0.0.0:8080");
    for await (const conn of listener) {
        listenMessages(conn);
    }
}

await startServer();
