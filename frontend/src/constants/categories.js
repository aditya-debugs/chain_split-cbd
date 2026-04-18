export const EXPENSE_CATEGORIES = [
  { id: 0, label: "Other", icon: "📋", color: "gray" },
  { id: 1, label: "Food", icon: "🍔", color: "orange" },
  { id: 2, label: "Travel", icon: "✈️", color: "blue" },
  { id: 3, label: "Stay", icon: "🏨", color: "purple" },
  { id: 4, label: "Entertainment", icon: "🎡", color: "pink" },
];

export const getCategory = (id) => EXPENSE_CATEGORIES.find(c => c.id === Number(id)) || EXPENSE_CATEGORIES[0];
