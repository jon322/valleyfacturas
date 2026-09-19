import axios from "axios";
import "dotenv/config";
const discord = axios.create({
  baseURL: "https://discord.com/api/v10",
  headers: { Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}` },
});
const channelId = process.argv[2];
const { data } = await discord.get(`/channels/${channelId}/messages`, { params: { limit: 50 } });
console.log(`${data.length} mensajes`);
for (const m of data.reverse()) {
  console.log(`- [${m.timestamp}] ${m.author.username}: "${m.content}" attachments: ${m.attachments.map(a => a.filename + " (" + a.content_type + ")").join(", ") || "ninguno"}`);
}
