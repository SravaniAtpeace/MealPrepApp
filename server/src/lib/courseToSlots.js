const MAP = {
  'Breakfast': ['breakfast'],
  'Indian Breakfast': ['breakfast', 'midMorning'],
  'World Breakfast': ['breakfast'],
  'Snack': ['midMorning', 'eveningSnack'],
  'Appetizer': ['midMorning', 'eveningSnack'],
  'Lunch': ['lunch'],
  'Main Course': ['lunch', 'dinner'],
  'Side Dish': ['lunch', 'dinner'],
  'Dinner': ['dinner'],
  'One Pot Dish': ['lunch', 'dinner'],
  'Dessert': ['eveningSnack'],
};

export function eligibleSlotsFor(course) {
    if(!course) return ['lunch', 'dinner'];
    return MAP[course.trim()] ?? ['lunch', 'dinner'];
}