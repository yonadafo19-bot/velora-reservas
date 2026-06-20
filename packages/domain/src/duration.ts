declare const durationMinutesBrand: unique symbol;

export type DurationMinutes = number & {
  readonly [durationMinutesBrand]: "DurationMinutes";
};

export function isDurationMinutes(value: unknown): value is DurationMinutes {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0;
}

export function toDurationMinutes(value: number): DurationMinutes {
  if (!isDurationMinutes(value)) {
    throw new RangeError("Duration must be a positive safe integer of minutes");
  }

  return value;
}

export function sumDurations(values: readonly number[]): DurationMinutes {
  if (values.length === 0) {
    throw new RangeError("At least one duration is required");
  }

  const total = values.reduce(
    (accumulator, value) => accumulator + toDurationMinutes(value),
    0,
  );

  return toDurationMinutes(total);
}
