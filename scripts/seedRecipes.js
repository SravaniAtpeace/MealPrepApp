import 'dotenv/config';
import path from 'node:path';
import fs from 'node:fs';
import mongoose from 'mongoose';
import XLSX from 'xlsx';
const { readFile, utils } = XLSX;

import Recipe from '../server/src/models/Recipe.js';
import Ingredient from '../server/src/models/Ingredient.js';
import { tokenizeIngredientsRaw } from '../server/src/lib/ingredientTokenizer.js';
import { eligibleSlotsFor } from '../server/src/lib/courseToSlots.js';

function numOrNull(v) {
  if (v === '' || v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

async function main() {
  const xlsxPath = process.argv[2];
  if (!xlsxPath) {
    console.error('Usage: node scripts/seedRecipes.js <path/to/recipes.xlsx>');
    process.exit(1);
  }
  if (!fs.existsSync(xlsxPath)) {
    console.error(`File not found: ${xlsxPath}`);
    process.exit(1);
  }
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI not set in env (or .env).');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);

  const wb = readFile(xlsxPath);
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = utils.sheet_to_json(sheet, {defval: ''});

  const ingredientNames = new Set();
  const parseFailures = [];
  let inserted = 0;
  let matched = 0;

  for (const row of rows) {
    const name = String(row.TranslatedRecipeName || '').trim();
    if (!name) continue;

    const ingredientsRaw = row.TranslatedIngredients ?? '';
    const ingredientsParsed = tokenizeIngredientsRaw(ingredientsRaw);

    for (const item of ingredientsParsed){
      if (item.name) ingredientNames.add(item.name);
      if (item.qty == null) {
        parseFailures.push({ recipe: name, raw: item.raw });
      }
    }

    const doc = {
      name,
      ingredientsRaw,
      ingredientsParsed,
      prepTimeMins:  numOrNull(row.PrepTimeInMins),
      cookTimeMins:  numOrNull(row.CookTimeInMins),
      totalTimeMins: numOrNull(row.TotalTimeInMins),
      servings:      numOrNull(row.Servings),
      cuisine:       String(row.Cuisine || '').trim(),
      course:        String(row.Course  || '').trim(),
      diet:          String(row.Diet    || '').trim(),
      eligibleSlots: eligibleSlotsFor(row.Course),
      instructions:  row.TranslatedInstructions ?? '',
    };
    
    const res = await Recipe.updateOne(
      { name },
      { $set: doc},
      { upsert: true }
    );
    if (res.upsertedCount) inserted++ ;
    else if(res.matchedCount) matched++ ;
    
  }

  let ingInserted = 0;
  let ingMatched = 0;
  for (const ingName of ingredientNames) {
    const res = await Ingredient.updateOne(
      { name : ingName },
      { $setOnInsert: { name: ingName, aliases: [], deafaultUnit: null, category: null} },
      { upsert: true }
    );
    if ( res.upsertedCount ) ingInserted++;
    else if (res.matchedCount) ingMatched++;
  }

  await Recipe.syncIndexes(); // write notes about syncIndexes()
  await Ingredient.syncIndexes();

  if (parseFailures.length) {
    const logsDir = path.resolve('./logs');
    fs.mkdirSync(logsDir, { recursive: true });//write notes about mkdirSync
    fs.writeFileSync(
      path.join(logsDir, 'seed-parse-failures.json'),
      JSON.stringify(parseFailures, null, 2)
    );
  }

  console.log(JSON.stringify({
    rowsRead: rows.length,
    recipesUpserted: { inserted, matched },
    ingredientUpserted: { inserted: ingInserted, matched: ingMatched },
    parseFailures: parseFailures.length,
  }, null, 2));

  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error(err);
  try { await mongoose.disconnect(); } catch {}
  process.exit(1);
});