import express from "express";
import fetch from "node-fetch";
import unzipper from "unzipper";
import fs from "fs";
import path from "path";
import { scanRepo } from "./scan.js";

const app = express();
app.use(express.json());
app.use(express.static("../frontend"));

app.post("/scan", async (req, res) => {
  const { repoUrl } = req.body;
  try {
    // Download, unzip, scan
    const result = await scanRepo(repoUrl);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to scan repo" });
  }
});

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
