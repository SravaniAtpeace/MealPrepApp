import { eligibleSlotsFor } from '../courseToSlots.js';

describe('eligibleSlotsFor', () => {
  test.each([
    ['Breakfast',         ['breakfast']],
    ['Indian Breakfast',  ['breakfast', 'midMorning']],
    ['World Breakfast',   ['breakfast']],
    ['Snack',             ['midMorning', 'eveningSnack']],
    ['Appetizer',         ['midMorning', 'eveningSnack']],
    ['Lunch',             ['lunch']],
    ['Main Course',       ['lunch', 'dinner']],
    ['Side Dish',         ['lunch', 'dinner']],
    ['Dinner',            ['dinner']],
    ['One Pot Dish',      ['lunch', 'dinner']],
    ['Dessert',           ['eveningSnack']],
  ])('maps %s → %j', (course, expected) => {
    expect(eligibleSlotsFor(course)).toEqual(expected);
  });

  test('trims whitespace before lookup', () => {
    expect(eligibleSlotsFor('  Lunch  ')).toEqual(['lunch']);
  });

  test('unknown course falls back to lunch+dinner', () => {
    expect(eligibleSlotsFor('Brunch')).toEqual(['lunch', 'dinner']);
  });

  test('undefined / null / empty string fall back', () => {
    expect(eligibleSlotsFor(undefined)).toEqual(['lunch', 'dinner']);
    expect(eligibleSlotsFor(null)).toEqual(['lunch', 'dinner']);
    expect(eligibleSlotsFor('')).toEqual(['lunch', 'dinner']);
  });
});