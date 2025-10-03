import fs from "fs";
import path from "path";
import glob from "glob";
import { parse } from "@babel/parser";
import * as bcd from "@mdn/browser-compat-data";
import postcss from "postcss";

// Helper: check JS feature in MDN BCD
function getJSBaselineStatus(feature) {
  const mdnFeature = bcd.javascript.builtins[feature];
  if (!mdnFeature) return "Unknown";
  const support = mdnFeature.__compat.support;
  const browsers = ["chrome", "firefox", "safari"];
  const unsupported = browsers.some(b => support[b].version_added === false || support[b].version_added == null);
  return unsupported ? "Below Baseline" : "Above Baseline";
}

// Helper: check CSS property in MDN BCD
function getCSSBaselineStatus(prop) {
  const mdnProp = bcd.css.properties[prop];
  if (!mdnProp) return "Unknown";
  const support = mdnProp.__compat.support;
  const browsers = ["chrome", "firefox", "safari"];
  const unsupported = browsers.some(b => support[b].version_added === false || support[b].version_added == null);
  return unsupported ? "Below Baseline" : "Above Baseline";
}

export async function scanRepo(repoPath) {
  const features = [];

  // 1. Scan JS files
  const jsFiles = glob.sync(path.join(repoPath, "**/*.js"));
  for (const file of jsFiles) {
    const code = fs.readFileSync(file, "utf-8");
    let ast;
    try {
      ast = parse(code, { sourceType: "module" });
    } catch (err) {
      continue; // skip files that fail to parse
    }

    // simple traversal: detect usage of built-in identifiers
    const identifiers = ["fetch", "Promise", "Map", "Set", "WeakMap"]; // expand as needed
    identifiers.forEach(id => {
      if (code.includes(id)) {
        features.push({
          name: id + "()",
          file: path.relative(repoPath, file),
          line: code.split("\n").findIndex(l => l.includes(id)) + 1,
          status: getJSBaselineStatus(id)
        });
      }
    });
  }

  // 2. Scan CSS files
  const cssFiles = glob.sync(path.join(repoPath, "**/*.css"));
  for (const file of cssFiles) {
    const cssCode = fs.readFileSync(file, "utf-8");
    const root = postcss.parse(cssCode);
    root.walkDecls(decl => {
      const prop = decl.prop;
      const status = getCSSBaselineStatus(prop);
      if (status !== "Unknown") {
        features.push({
          name: prop,
          file: path.relative(repoPath, file),
          line: decl.source.start.line,
          status
        });
      }
    });
  }

  // 3. Calculate score
  const above = features.filter(f => f.status === "Above Baseline").length;
  const score = features.length ? Math.round((above / features.length) * 100) : 100;

  return { score, features };
}
