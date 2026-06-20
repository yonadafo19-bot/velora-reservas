declare const clpAmountBrand: unique symbol;

export type ClpAmount = number & { readonly [clpAmountBrand]: "ClpAmount" };

export function isClpAmount(value: unknown): value is ClpAmount {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

export function toClpAmount(value: number): ClpAmount {
  if (!isClpAmount(value)) {
    throw new RangeError("CLP amount must be a non-negative safe integer");
  }

  return value;
}

export function sumClpAmounts(values: readonly number[]): ClpAmount {
  return values.reduce<ClpAmount>(
    (total, value) => toClpAmount(total + toClpAmount(value)),
    toClpAmount(0),
  );
}

export function formatClp(value: number): string {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(toClpAmount(value));
}
