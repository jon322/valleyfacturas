import axios from "axios";
import { config } from "../src/config.js";
const holded = axios.create({
  baseURL: "https://api.holded.com/api/v2",
  headers: { Authorization: `Bearer ${config.holded.apiKey}` },
});
const id = process.argv[2];
for (const path of [`/purchases/${id}/approve`, `/purchases/${id}/confirm`]) {
  try {
    const { data, status } = await holded.post(path);
    console.log(path, "->", status, JSON.stringify(data));
  } catch (err) {
    console.log(path, "-> ERROR", err.response?.status, err.response?.data?.detail);
  }
}
