export const categories = [
  { id: "marketing", name: "Marketing", code: "MKT" },
  { id: "payroll", name: "Payroll", code: "PAY" },
  { id: "tools", name: "Tools", code: "TLS" },
] as const;

export const categoryOptions = categories.map((category) => ({
  label: category.name,
  value: category.id,
}));

export function getCategoryName(categoryId: string) {
  return (
    categories.find((category) => category.id === categoryId)?.name ??
    categoryId
  );
}

export type CategoryId = (typeof categories)[number]["id"];

export const categoryIds = categories.map(
  (category) => category.id,
) as [CategoryId, ...CategoryId[]];
