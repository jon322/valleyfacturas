import axios from "axios";
import { config } from "../src/config.js";
const holded = axios.create({
  baseURL: "https://api.holded.com/api/v2",
  headers: { Authorization: `Bearer ${config.holded.apiKey}` },
});
const ids = process.argv.slice(2);
for (const id of ids) {
  const { data } = await holded.get(`/purchases/${id}`);
  console.log(JSON.stringify({ id: data.id, document_number: data.document_number, contact_name: data.contact_name, total: data.total, status: data.status, draft: data.draft }));
}
