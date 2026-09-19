import { findContactByEmail } from "../src/holdedClient.js";
for (const email of process.argv.slice(2)) {
  const c = await findContactByEmail(email);
  console.log(email, "->", c ? `${c.id} (${c.name})` : "no encontrado");
}
