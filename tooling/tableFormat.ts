export const number = (value: number, digits = 2): string =>
  Number.isFinite(value) ? value.toFixed(digits) : "∞";

export const table = (headers: string[], rows: Array<Array<string | number>>): string => {
  const widths = headers.map((header, column) =>
    Math.max(header.length, ...rows.map((row) => String(row[column] ?? "").length))
  );
  const line = (row: Array<string | number>): string =>
    row.map((value, column) => String(value).padEnd(widths[column] ?? 0)).join("  ");
  return [line(headers), line(widths.map((width) => "-".repeat(width))), ...rows.map(line)].join(
    "\n"
  );
};
