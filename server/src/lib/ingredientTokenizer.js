export const UNITS = new Set([ 'tsp', 'teaspoon', 'teaspoons',
  'tbsp', 'tablespoon', 'tablespoons',
  'cup', 'cups',
  'g', 'gram', 'grams',
  'kg',
  'ml',
  'l', 'litre', 'litres', 'liter', 'liters',
  'pinch', 'pinches',
  'inch', 'inches',
  'clove', 'cloves',
  'piece', 'pieces',
  'sprig', 'sprigs',
  'stalk', 'stalks',
  'leaf', 'leaves',
  'can', 'cans',
  'slice', 'slices',
  'bunch', 'bunches',
  'handful',]);

// Map plural/variant unit forms to a canonical singular form,
// so downstream aggregation can sum across recipes that disagree on spelling.
const UNIT_CANONICAL = {
    teaspoon: 'tsp', teaspoons: 'tsp', tsp: 'tsp',
    tablespoon: 'tbsp', tablespoons: 'tbsp', tbsp: 'tbsp',
    cup: 'cup', cups: 'cup',
    gram: 'g', grams: 'g', g: 'g',
    kg: 'kg',
    ml: 'ml',
    l: 'l', litre: 'l', litres: 'l', liter: 'l', liters: 'l',
    pinch: 'pinch', pinches: 'pinch',
    inch: 'inch', inches: 'inch',
    clove: 'clove', cloves: 'clove',
    piece: 'piece', pieces: 'piece',
    sprig: 'sprig', sprigs: 'sprig',
    stalk: 'stalk', stalks: 'stalk',
    leaf: 'leaf', leaves: 'leaf',
    can: 'can', cans: 'can',
    slice: 'slice', slices: 'slice',
    bunch: 'bunch', bunches: 'bunch',
    handful: 'handful',
};

// Unicode fraction → decimal lookup 
const UNICODE_FRACTIONS = {
    '½': 0.5,  '⅓': 1 / 3, '⅔': 2 / 3,
    '¼': 0.25, '¾': 0.75,
    '⅕': 0.2,  '⅖': 0.4,  '⅗': 0.6,  '⅘': 0.8,
    '⅙': 1 / 6, '⅚': 5 / 6,
    '⅛': 0.125, '⅜': 0.375, '⅝': 0.625, '⅞': 0.875,
};

export function parseQty(tokens) {
  if (!tokens.length) return { qty: null, consumed: 0 };
  const t0 = tokens[0];

  // Range "1-2" → take upper bound
  const rangeMatch = t0.match(/^(\d+(?:\.\d+)?)-(\d+(?:\.\d+)?)$/);
  if (rangeMatch) return { qty: Number(rangeMatch[2]), consumed: 1 };

  // Integer + glued unicode fraction, e.g., "1½"
  const intUnicodeMatch = t0.match(/^(\d+)([½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞])$/);
  if (intUnicodeMatch) {
    return {
      qty: Number(intUnicodeMatch[1]) + UNICODE_FRACTIONS[intUnicodeMatch[2]],
      consumed: 1,
    };
  }

  // Standalone unicode fraction, e.g., "½"
  if (UNICODE_FRACTIONS[t0] !== undefined) {
    return { qty: UNICODE_FRACTIONS[t0], consumed: 1 };
  }

  // ASCII fraction, e.g., "1/2"
  const fracMatch = t0.match(/^(\d+)\/(\d+)$/);
  if (fracMatch) {
    const num = Number(fracMatch[1]);
    const den = Number(fracMatch[2]);
    if (den !== 0) return { qty: num / den, consumed: 1 };
  }

  // Decimal or integer, possibly followed by a mixed-fraction second token
  const numMatch = t0.match(/^(\d+(?:\.\d+)?)$/);
  if (numMatch) {
    const whole = Number(numMatch[1]);
    if (tokens.length > 1) {
      const t1 = tokens[1];
      // "1 1/2"
      const m = t1.match(/^(\d+)\/(\d+)$/);
      if (m && Number(m[2]) !== 0) {
        return { qty: whole + Number(m[1]) / Number(m[2]), consumed: 2 };
      }
      // "1 ½"
      if (UNICODE_FRACTIONS[t1] !== undefined) {
        return { qty: whole + UNICODE_FRACTIONS[t1], consumed: 2 };
      }
    }
    return { qty: whole, consumed: 1 };
  }

  return { qty: null, consumed: 0 };
}

function singularize(name) {
    if (!name) return name; // green chillies
    const parts = name.split(/\s+/);  // → ['green', 'chillies']
    const last  =parts[parts.length - 1]; // parts - 2
    if(last.length > 3 && last.endsWith('s') && !last.endsWith('ss')){ // condition on chillies; also if ends with ss then its not PLURAL (eg: glass)
        parts[parts.length - 1] = last.slice(0, -1);
    }
    return parts.join(' ');
}

// ─── 5. tokenizeIngredient ────
// One raw ingredient string → { name, qty, unit, raw }.
export function tokenizeIngredient(rawItem){    
  if (rawItem == null) return null;
  const raw = String(rawItem).trim();
  if (!raw) return null;

  // 1. Strip trailing parentheticals: "onion (finely chopped)" → "onion".
  const stripped = raw.replace(/\s*\([^)]*\)\s*$/,'').trim();
  if (!stripped){
    return {name: raw.toLowerCase(), qty:null, unit: null, raw};
  }

  // 2. Normalize whitespace and split into tokens.
  const tokens = stripped.replace(/\s+/g, ' ').split(' ')

  // 3. Pull qty off the front.
  const { qty, consumed } = parseQty(tokens);
  let rest = tokens.slice(consumed); //slice operation argument is the start number of rest of the string after the qty -> returns array of stings

   // 4. Pull unit off the next token if it matches the canonical vocabulary.
  let unit = null;
  if (rest.length) {
    // Strip a trailing period like "tsp." before matching.
    const unit_in_rest = rest[0].toLowerCase().replace(/\.$/, '');
    if (UNITS.has(unit_in_rest)) {
      unit = UNIT_CANONICAL[unit_in_rest] ?? unit_in_rest; //Nullish Coalescing Operator (??) -> provide a default value when a vairable is null/ undefined
      rest = rest.slice(1);
    }
  }

  // 5. Whatever's left is the ingredient name.
  const name = singularize(rest.join(' ').toLowerCase().trim());

  if (qty === null && unit === null) {
    return {
      name: singularize(stripped.toLowerCase()),
      qty: null,
      unit: null,
      raw,
    };
  }

  return {name,qty,unit,raw};
}

export function tokenizeIngredientsRaw(rawString) {
  if (!rawString) return [];
  return String(rawString)
    .split(',')
    .map((s) => tokenizeIngredient(s))
    .filter((item) => item && item.name);
}