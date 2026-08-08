const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

function formatCurrency(cents: number) {
  return currencyFormatter.format(cents / 100);
}

function formatSignedCurrency(cents: number) {
  const amount = formatCurrency(cents);
  return cents > 0 ? `+${amount}` : amount;
}

function formatSignedPercent(percent: number | null) {
  if (percent === null) {
    return "N/A";
  }

  return `${percent > 0 ? "+" : ""}${percent.toFixed(2)}%`;
}

export { formatCurrency, formatSignedCurrency, formatSignedPercent };
