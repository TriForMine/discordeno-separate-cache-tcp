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

const TableNames = ["channels", "guilds", "members", "messages", "presences", "unavailableGuilds", "threads", "prefixes"] as const;
type CacheTableNames = typeof TableNames[number];

export const cache: {[table: string]: Collection<any, any>} = {
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
  prefixes: new Collection<bigint, string>() // Custom cache for per guild prefixes. You can remove this if you don't want it
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

              const [tableName, id, type, optional]: [string, string, string, string] =
                  requestEvent.request.url.split("/").slice(3) as [
                    string,
                    string,
                    string,
                    string
                  ];

              let response;

              if (tableName === "forEach") {
                switch (id) {
                  case "DELETE_MESSAGES_FROM_CHANNEL":
                    cache.messages.forEach((message) => {
                      if (message.channelId === BigInt(type)) cache.messages.delete(message.id);
                    });
                    break;
                  case "DELETE_MESSAGES_FROM_GUILD":
                    cache.messages.forEach((message) => {
                      if (message.guildId === BigInt(type)) cache.messages.delete(message.id);
                    });
                    break;
                  case "DELETE_CHANNELS_FROM_GUILD":
                    cache.channels.forEach((channel) => {
                      if (channel.guildId === BigInt(type)) cache.channels.delete(channel.id);
                    });
                    break;
                  case "DELETE_GUILD_FROM_MEMBER":
                    cache.members.forEach((member) => {
                      if (!member.guilds.has(BigInt(type))) return;

                      member.guilds.delete(BigInt(type));

                      if (!member.guilds.size) {
                        return cache.members.delete(member.id);
                      }

                      cache.members.set(member.id, member);
                    });
                    break;
                  case "DELETE_ROLE_FROM_MEMBER":
                    cache.members.forEach((member) => {
                      // Not in the relevant guild so just skip
                      if (!member.guilds.has(BigInt(type))) return;

                      const guildMember = member.guilds.get(BigInt(type) as bigint)!;

                      guildMember.roles = guildMember.roles.filter((id: bigint) => id !== (BigInt(optional) as bigint));
                      cache.members.set(member.id, member);
                    });
                    break;
                }
              } else if (tableName === "filter") {
                if (id === "GET_MEMBERS_IN_GUILD") {
                  response = cache.members.filter((member) => member.guilds.has(type));
                }
              } else if (id) {
                if (TableNames.includes(tableName as TableName)) {
                  if (id === "clear" || id === "size" || id == "getAll" || id == "filter") {
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
