import axios from "axios";
import "dotenv/config";
const discord = axios.create({
  baseURL: "https://discord.com/api/v10",
  headers: { Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}` },
});
const { data } = await discord.get(`/channels/${process.argv[2]}/messages`, { params: { limit: 5 } });
console.log(JSON.stringify(data, null, 2));
