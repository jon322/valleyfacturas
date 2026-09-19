// Comprobacion rapida de que las credenciales y la configuracion de Holded funcionan,
// sin crear datos de prueba en la cuenta real.
// Uso: npm run test:holded
import axios from "axios";
import { config } from "../src/config.js";

const holded = axios.create({
  baseURL: "https://api.holded.com/api/v2",
  headers: { Authorization: `Bearer ${config.holded.apiKey}` },
});

try {
  const { data } = await holded.get("/contacts", { params: { limit: 1 } });
  console.log(`OK: conexion con Holded correcta (${data.items.length} contacto(s) de prueba leido(s)).`);
} catch (err) {
  console.error("ERROR conectando con Holded:", err.response?.status, err.response?.data?.detail || err.message);
  process.exit(1);
}
