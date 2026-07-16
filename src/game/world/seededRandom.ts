/** Small deterministic RNG for pre-simulation content draws (ADR-0003). */
export interface RandomSource {
  next: () => number;
}

export const seededRandom = (seed: number): RandomSource => {
  let value = seed >>> 0 || 1;
  return {
    next: () => {
      value ^= value << 13;
      value ^= value >>> 17;
      value ^= value << 5;
      return (value >>> 0) / 4_294_967_296;
    },
  };
};

export const drawIndex = (random: RandomSource, length: number): number => {
  if (length < 1) throw new Error("A seeded draw requires at least one candidate.");
  return Math.floor(random.next() * length);
};
