import {
  Channel,
  decode,
  encode,
  Guild,
  GuildMemberWithUser,
  Message,
  PresenceUpdate,
  snowflakeToBigint,
  TableName,
  DiscordenoThread,
  Collection,
} from "./deps.ts";
import extensionCodec from "../utils/messagepack.ts";
import { readStream } from "../utils/readStream.ts";

export const cache = {
  channels: new Collection<bigint, Channel>(),
  guilds: new Collection<bigint, Guild & { shardId: number }>(),
  members: new Collection<
    bigint,
    (GuildMemberWithUser & { guildId: string })[]
  >(),
  messages: new Collection<bigint, Message>(),
  presences: new Collection<bigint, PresenceUpdate>(),
  unavailableGuilds: new Collection<bigint, number>(),
  threads: new Collection<bigint, DiscordenoThread>(),
} as const;

// Start listening on localhost.
const server = Deno.listen({ port: 9999 });
console.log(`HTTP webserver running.  Access it at:  http://localhost:9999/`);

// Connections to the server will be yielded up as an async iterable.
for await (const conn of server) {
  try {
    // In order to not be blocking, we need to handle each connection individually
    // in its own async function.
    (async () => {
      // This "upgrades" a network connection into an HTTP connection.
      const httpConn = Deno.serveHttp(conn);
      // Each request sent over the HTTP connection will be yielded as an async
      // iterator from the HTTP connection.
      try {
        for await (const requestEvent of httpConn) {
          (async () => {
            try {
              if (requestEvent.request.url.endsWith("/memory")) {
                return requestEvent.respondWith(
                  new Response(
                    JSON.stringify({
                      success: true,
                      response: Deno.memoryUsage(),
                    }),
                    {
                      headers: {
                        "Content-Type": "application/json",
                      },
                      status: 200,
                    }
                  )
                );
              }

              let data;

              if (
                requestEvent.request.headers.get("Content-Type") ===
                "application/msgpack"
              ) {
                if (!requestEvent.request.body) {
                  return requestEvent.respondWith(
                    new Response(encode({ success: false }), {
                      headers: {
                        "Content-Type": "application/msgpack",
                      },
                      status: 400,
                    })
                  );
                }
                data = decode(
                  await readStream(requestEvent.request.body.getReader()),
                  { extensionCodec }
                );
              }

              const [tableName, id, type]: [TableName, string, string] =
                requestEvent.request.url.split("/").slice(3) as [
                  TableName,
                  string,
                  string
                ];

              let response;

              if (id) {
                if (id === "clear" || id === "size" || id == "getAll") {
                  switch (id) {
                    case "clear":
                      cache[tableName].clear();
                      break;
                    case "size":
                      response = cache[tableName].size;
                      break;
                    case "getAll":
                      response = cache[tableName].array();
                      break;
                  }
                } else {
                  switch (type) {
                    case "get":
                      response = cache[tableName].get(snowflakeToBigint(id));
                      break;
                    case "set":
                      cache[tableName].set(snowflakeToBigint(id), data);
                      break;
                    case "delete":
                      response = cache[tableName].delete(snowflakeToBigint(id));
                      break;
                    case "has":
                      response = cache[tableName].has(snowflakeToBigint(id));
                      break;
                  }
                }
              }

              const responseData = encode(
                { success: true, response },
                { extensionCodec }
              );

              requestEvent.respondWith(
                new Response(responseData, {
                  headers: {
                    "Content-Type": "application/msgpack",
                  },
                  status: 200,
                })
              );
            } catch (e) {
              console.error(e);
            }
          })().then(undefined);
        }
      } catch (e) {
        console.error(e);
      }
    })();
  } catch (e) {
    console.error(e);
  }
}
