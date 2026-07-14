import "dotenv/config";
import fs from "fs";
import path from "path";
import { prisma } from "../src/utils/prisma.js";

// Usage: node scripts/import.js [path-to-csv]
// Default path is the herblix codes export.
const csvPath =
  process.argv[2] ||
  path.resolve("data", "herblix-codes-10000.csv");

// Minimal RFC-4180-ish CSV parser (handles quotes, escaped quotes, commas).
function parseCsv(text) {
  const rows = [];
  let field = "";
  let row = [];
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (ch === "\r") {
      // ignore
    } else {
      field += ch;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

function toDate(v) {
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

async function main() {
  if (!fs.existsSync(csvPath)) {
    console.error(`CSV file not found: ${csvPath}`);
    console.error("Pass the path as an argument: node scripts/import.js <file.csv>");
    process.exit(1);
  }

  const text = fs.readFileSync(csvPath, "utf8").replace(/^﻿/, "");
  const rows = parseCsv(text).filter((r) => r.length > 1);
  const [header, ...dataRows] = rows;
  console.log(`Parsed ${dataRows.length} rows. Header: ${header.join(" | ")}`);

  const records = dataRows
    .map((r) => {
      const [code, productName, batchNumber, valid, createdAt, lastVerifiedAt, verifiedCount] =
        r;
      if (!code || !productName) return null;
      return {
        code: String(code).trim().toUpperCase(),
        productName: String(productName).trim(),
        batchNumber: batchNumber?.trim() || null,
        enabled: /^(yes|true|1)$/i.test(String(valid || "").trim()),
        createdAt: toDate(createdAt) || new Date(),
        lastVerifiedAt: toDate(lastVerifiedAt),
        verifiedCount: parseInt(verifiedCount, 10) || 0,
      };
    })
    .filter(Boolean);

  console.log(`Importing ${records.length} valid records...`);

  const CHUNK = 1000;
  let imported = 0;
  for (let i = 0; i < records.length; i += CHUNK) {
    const chunk = records.slice(i, i + CHUNK);
    const res = await prisma.verificationCode.createMany({
      data: chunk,
      skipDuplicates: true,
    });
    imported += res.count;
    console.log(`  ${Math.min(i + CHUNK, records.length)}/${records.length} (inserted ${imported})`);
  }

  const total = await prisma.verificationCode.count();
  console.log(`✅ Done. Inserted ${imported} new codes. Total in DB: ${total}.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
