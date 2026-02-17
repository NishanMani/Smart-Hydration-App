const ML_PER_OZ = 29.5735;

export const normalizeUnit = (value) => (value === "oz" ? "oz" : "ml");

export const toDisplayAmount = (amountInMl, unit) => {
  const safeAmount = Number(amountInMl || 0);
  if (normalizeUnit(unit) === "oz") {
    return Math.round((safeAmount / ML_PER_OZ) * 10) / 10;
  }
  return Math.round(safeAmount);
};

export const toMlAmount = (amount, unit) => {
  const safeAmount = Number(amount || 0);
  if (normalizeUnit(unit) === "oz") {
    return Math.round(safeAmount * ML_PER_OZ);
  }
  return Math.round(safeAmount);
};
