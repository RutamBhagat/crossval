export const categories = [
  { id: "marketing", name: "Marketing", code: "MKT" },
  { id: "payroll", name: "Payroll", code: "PAY" },
  { id: "tools", name: "Tools", code: "TLS" },
] as const;

export type CategoryId = (typeof categories)[number]["id"];
