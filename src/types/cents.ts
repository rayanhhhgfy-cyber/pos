declare const CentsBrand: unique symbol;
export type Cents = number & { [CentsBrand]: true };

export function asCents(value: number): Cents {
  return Math.round(value) as Cents;
}