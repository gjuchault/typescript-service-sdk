export type DateProvider = {
  nowAsNumber: () => number;
  nowAsDate: () => Date;
};

export function createDateProvider(): DateProvider {
  return {
    nowAsNumber: () => Date.now(),
    nowAsDate: () => new Date(),
  };
}
