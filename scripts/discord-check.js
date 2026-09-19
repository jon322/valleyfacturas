import axios from "axios";
import "dotenv/config";

const discord = axios.create({
  baseURL: "https://discord.com/api/v10",
  headers: { Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}` },
});

const me = await discord.get("/users/@me");
console.log("Bot:", me.data.username, me.data.id);

const guilds = await discord.get("/users/@me/guilds");
console.log("Servidores donde ya esta el bot:", JSON.stringify(guilds.data.map(g => ({ id: g.id, name: g.name })), null, 2));
