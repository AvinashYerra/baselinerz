import express from "express";
import postcss from "postcss";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { fetchCssFilesFromRepo } from "./github.js";

// JSON read fix
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const featuresData = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, "node_modules/web-features/data.json"),
    "utf-8"
  )
);

const app = express();
app.use(express.json());
app.use(express.static('../frontend'));

app.post('/scan', async (req, res) => {
    const { url } = req.body;
    try {
        const cssFiles = await fetchCssFilesFromRepo(url);

        const result = {}; // filename -> counts

        for (const file of cssFiles) {
            const root = postcss.parse(file.content);
            const fileFeatures = { widely: 0, limited: 0, newly: 0 };

            const usedFeatures = new Set();
            root.walkDecls(decl => usedFeatures.add(decl.prop));

            usedFeatures.forEach(f => {
                const feat = featuresData[f];
                if(!feat) return;
                if(feat.stats['chrome']?.y) fileFeatures.widely++;
                else if(feat.stats['chrome']?.n) fileFeatures.limited++;
                else fileFeatures.newly++;
            });

            result[file.name] = fileFeatures;
        }

        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(3000, () => console.log("Server running on http://localhost:3000"));
