import axios from "axios";
import { config } from "../src/config.js";
const holded = axios.create({
  baseURL: "https://api.holded.com/api/v2",
  headers: { Authorization: `Bearer ${config.holded.apiKey}` },
});
const { data } = await holded.get(`/purchases/${process.argv[2]}`);
console.log(JSON.stringify({ id: data.id, subtotal: data.subtotal, tax: data.tax, total: data.total, status: data.status, lines: data.lines.map(l=>({name:l.name, price:l.price, taxes:l.taxes})) }, null, 2));
