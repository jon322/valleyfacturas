import axios from "axios";
import { config } from "../src/config.js";
const holded = axios.create({
  baseURL: "https://api.holded.com/api/v2",
  headers: { Authorization: `Bearer ${config.holded.apiKey}` },
});

const [id, itemsJson] = process.argv.slice(2);
const items = JSON.parse(itemsJson).map(it => ({
  ...it,
  tax: 0,
  taxes: ["p_iva_21"],
  account: config.holded.defaultAccountId,
}));

try {
  const { data } = await holded.put(`/purchases/${id}`, { items });
  console.log(id, "-> actualizado:", JSON.stringify(data));
} catch (err) {
  console.log(id, "-> ERROR", err.response?.status, JSON.stringify(err.response?.data));
}
