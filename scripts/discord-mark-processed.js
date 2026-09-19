// Marca un mensaje de Discord como procesado (reaccion checkmark).
// Uso: node scripts/discord-mark-processed.js <messageId>
import { markMessageProcessed } from "../src/discordClient.js";

await markMessageProcessed(process.argv[2]);
console.log("Marcado como procesado:", process.argv[2]);
