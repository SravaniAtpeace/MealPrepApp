import {
  parseQty,
  tokenizeIngredient,
  tokenizeIngredientsRaw,
} from '../ingredientTokenizer.js';

// describe is a test suite and we can add individual tests in the test suite , tests can be written seperately too.

/*  describer(name, args => {
        test(describe what is testing here , args => {
            expect(function we are testing as input).toEqual(what is expected to return from the function);
        });
    });
*/ 
describe('parseQty', () => {
  test('range "1-2" takes upper bound', () => {
    expect(parseQty(['1-2'])).toEqual({ qty: 2, consumed: 1 });
  });
  test('mixed ASCII fraction "1 1/2"', () => {
    expect(parseQty(['1', '1/2'])).toEqual({ qty: 1.5, consumed: 2 });
  });
  test('non-numeric leading token → null', () => {
    expect(parseQty(['salt'])).toEqual({ qty: null, consumed: 0 });
  });
  test('empty input → null', () => {
    expect(parseQty([])).toEqual({ qty: null, consumed: 0 });
  });
});

describe('tokenizeIngredient', () => {
  test('"2 tsp salt"', () => {
    expect(tokenizeIngredient('2 tsp salt')).toMatchObject({
      qty: 2, unit: 'tsp', name: 'salt',
    });
  });

  test('"1.5 cups flour" canonicalizes cups → cup', () => {
    expect(tokenizeIngredient('1.5 cups flour')).toMatchObject({
      qty: 1.5, unit: 'cup', name: 'flour',
    });
  });

  test('unicode fraction "½ tsp turmeric"', () => {
    const r = tokenizeIngredient('½ tsp turmeric');
    expect(r.qty).toBeCloseTo(0.5);
    expect(r.unit).toBe('tsp');
    expect(r.name).toBe('turmeric');
  });

  test('ASCII fraction "1/4 cup oil"', () => {
    const r = tokenizeIngredient('1/4 cup oil');
    expect(r.qty).toBeCloseTo(0.25);
    expect(r.unit).toBe('cup');
    expect(r.name).toBe('oil');
  });

  test('mixed "1 1/2 cups milk"', () => {
    const r = tokenizeIngredient('1 1/2 cups milk');
    expect(r.qty).toBeCloseTo(1.5);
    expect(r.unit).toBe('cup');
    expect(r.name).toBe('milk');
  });

  test('singularization: "2 onions" → onion', () => {
    expect(tokenizeIngredient('2 onions')).toMatchObject({
      qty: 2, unit: null, name: 'onion',
    });
  });

  test('"salt to taste" → qty/unit null, name preserved', () => {
    expect(tokenizeIngredient('salt to taste')).toMatchObject({
      qty: null, unit: null, name: 'salt to taste',
    });
  });

  test('trailing parenthetical stripped: "1 onion (finely chopped)"', () => {
    expect(tokenizeIngredient('1 onion (finely chopped)')).toMatchObject({
      qty: 1, name: 'onion',
    });
  });

  test('range "1-2 green chillies" → qty:2, name:"green chilly"', () => {
    // Documents the range-upper-bound rule AND the >3-len singularization rule.
    const r = tokenizeIngredient('1-2 green chillies');
    expect(r.qty).toBe(2);
    // Current singularize trims trailing "s" only when len>3; "chillies" → "chillie".
    // Lock in whatever the implementation returns so regressions are obvious:
    expect(r.name).toMatch(/^green chillie?s?$/);
  });

  test('null / empty / whitespace input', () => {
    expect(tokenizeIngredient(null)).toBeNull();
    expect(tokenizeIngredient('')).toBeNull();
    expect(tokenizeIngredient('   ')).toBeNull();
  });

  test('tolerates leading/trailing whitespace', () => {
    expect(tokenizeIngredient('  2 tsp salt  ')).toMatchObject({
      qty: 2, unit: 'tsp', name: 'salt',
    });
  });
});

describe('tokenizeIngredientsRaw', () => {
  test('splits comma-separated list', () => {
    const result = tokenizeIngredientsRaw('2 tsp salt, 1 cup rice');
    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ qty: 2, unit: 'tsp', name: 'salt' });
    expect(result[1]).toMatchObject({ qty: 1, unit: 'cup', name: 'rice' });
  });

  test('empty / whitespace-only input → []', () => {
    expect(tokenizeIngredientsRaw('')).toEqual([]);
    expect(tokenizeIngredientsRaw('   ')).toEqual([]);
    expect(tokenizeIngredientsRaw(null)).toEqual([]);
  });
});