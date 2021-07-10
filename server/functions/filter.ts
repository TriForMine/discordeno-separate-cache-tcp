import { cache } from "../cache.ts";

export default function filter(type: "GET_MEMBERS_IN_GUILD") {
    switch(type) {
        case "GET_MEMBERS_IN_GUILD":
            return cache.members.filter((member) =>
                member.guilds.has(type)
            );
        default:
            return undefined;
    }
}
