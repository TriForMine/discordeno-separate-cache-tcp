import { cache } from "../cache.ts";

export default function forEach(type: "DELETE_MESSAGES_FROM_CHANNEL" | "DELETE_MESSAGES_FROM_GUILD" | "DELETE_CHANNELS_FROM_GUILD" | "DELETE_GUILD_FROM_MEMBER" | "DELETE_ROLE_FROM_MEMBER", options?: Record<string, unknown>) {
    switch (type) {
        case "DELETE_MESSAGES_FROM_CHANNEL":
            return cache.messages.forEach((message) => {
                if (message.channelId === options?.channelId as bigint)
                    cache.messages.delete(message.id);
            });
        case "DELETE_MESSAGES_FROM_GUILD":
            return cache.messages.forEach((message) => {
                if (message.guildId === options?.guildId as bigint)
                    cache.messages.delete(message.id);
            });
        case "DELETE_CHANNELS_FROM_GUILD":
            return cache.channels.forEach((channel) => {
                if (channel.guildId === options?.guildId as bigint)
                    cache.channels.delete(channel.id);
            });
        case "DELETE_GUILD_FROM_MEMBER":
            return cache.members.forEach((member) => {
                if (!member.guilds.has(options?.guildId as bigint)) return;

                member.guilds.delete(options?.guildId as bigint);

                if (!member.guilds.size) {
                    return cache.members.delete(member.id);
                }

                cache.members.set(member.id, member);
            });
        case "DELETE_ROLE_FROM_MEMBER":
            return cache.members.forEach((member) => {
                // Not in the relevant guild so just skip
                if (!member.guilds.has(options?.guildId as bigint)) return;

                const guildMember = member.guilds.get(
                    BigInt(options?.guildId) as bigint
                )!;

                guildMember.roles = guildMember.roles.filter(
                    (id: bigint) => id !== (options?.roleId as bigint)
                );
                cache.members.set(member.id, member);
            });
    }
}
