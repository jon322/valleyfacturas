import axios from "axios";
import { config } from "../src/config.js";
const holded = axios.create({
  baseURL: "https://api.holded.com/api/v2",
  headers: { Authorization: `Bearer ${config.holded.apiKey}` },
});
const [id, docNumber] = process.argv.slice(2);
try {
  const { data } = await holded.put(`/purchases/${id}`, { document_number: docNumber });
  console.log(id, "->", JSON.stringify(data));
} catch (err) {
  console.log(id, "-> ERROR", err.response?.status, JSON.stringify(err.response?.data));
}
