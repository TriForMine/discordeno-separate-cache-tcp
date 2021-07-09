# Discordeno Separate Cache Rest
A separate cache using a rest server and messagepack.

# How To Use
- Download/Copy the files in a folder
- Run the rest server using: ```deno run -A --unstable .\mod.ts```
- In your bot mod.ts import setupCache and add it before startBot()
```ts
setupCache();

startBot({
    token: configs.token,
    intents: [
        DiscordGatewayIntents.Guilds,
        DiscordGatewayIntents.GuildMessages,
        DiscordGatewayIntents.GuildEmojis,
        DiscordGatewayIntents.DirectMessages,
    ],
    eventHandlers: botCache.eventHandlers,
});
```

> Be careful, this is a sample project, it's not secure you should add a secret key on the rest server to avoid external access.
