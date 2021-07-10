import {Channel, Collection, DiscordenoThread, Guild, GuildMemberWithUser, Message, PresenceUpdate} from "./deps.ts";

export const TableNames = [
    "channels",
    "guilds",
    "members",
    "messages",
    "presences",
    "unavailableGuilds",
    "threads",
    "prefixes"
] as const;
export type CacheTableNames = typeof TableNames[number];

export const cache: { [table: string]: Collection<any, any> } = {
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
