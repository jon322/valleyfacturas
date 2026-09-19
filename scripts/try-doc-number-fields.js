import axios from "axios";
import { config } from "../src/config.js";
const holded = axios.create({
  baseURL: "https://api.holded.com/api/v2",
  headers: { Authorization: `Bearer ${config.holded.apiKey}` },
});
const id = "6aae6876eec7c5b1ff06744b";
for (const key of ["number", "doc_number", "invoice_number", "reference", "num", "documentNumber"]) {
  try {
    const { data } = await holded.put(`/purchases/${id}`, { [key]: "FRA.JUL260709" });
    console.log(key, "-> accepted:", JSON.stringify(data));
  } catch (err) {
    console.log(key, "-> ERROR", err.response?.status, JSON.stringify(err.response?.data));
  }
}
const check = await holded.get(`/purchases/${id}`);
console.log("document_number ahora:", check.data.document_number);
