/**
 * A tuple of length `N` with elements of type `T`.
 */
export type Tuple<T, N extends number> = N extends N
  ? number extends N
    ? T[]
    : _TupleOf<T, N, []>
  : never;
type _TupleOf<T, N extends number, R extends unknown[]> = R["length"] extends N
  ? R
  : _TupleOf<T, N, [T, ...R]>;

export const tupleMapInner = <T, U, N extends number>(
  mapFn: (v: T) => U,
  tuple: Tuple<T, N>
): Tuple<U, N> => {
  return tuple.map((v) => mapFn(v)) as Tuple<U, N>;
};
