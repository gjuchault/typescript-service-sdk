export type DependencyStore = {
  provide(name: string, provider: unknown): void;
  retrieve<T>(name: string): T;
};

export function createDependencyStore(): DependencyStore {
  const store = new Map<string, unknown>();

  return {
    provide(name: string, provider: unknown) {
      store.set(name, provider);
    },

    retrieve<T>(name: string): T {
      const provider = store.get(name);

      if (!provider) {
        throw new Error(`No provider for ${name}`);
      }

      return provider as T;
    },
  };
}
