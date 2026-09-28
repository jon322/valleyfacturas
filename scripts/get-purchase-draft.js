import axios from "axios";
import { config } from "../src/config.js";
const holded = axios.create({
  baseURL: "https://api.holded.com/api/v2",
  headers: { Authorization: `Bearer ${config.holded.apiKey}` },
});
const { data } = await holded.get(`/purchases/${process.argv[2]}`);
console.log(JSON.stringify({ id: data.id, draft: data.draft, status: data.status, document_number: data.document_number }, null, 2));
