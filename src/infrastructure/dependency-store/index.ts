import type {
  Cache,
  CreateLogger,
  Database,
  DateProvider,
  HttpServer,
  TaskScheduling,
  Telemetry,
} from "../index.js";

type DefaultSdkStore = {
  logger: CreateLogger;
  telemetry: Telemetry;
  date: DateProvider;
  cache: Cache;
  taskScheduling: TaskScheduling;
  database: Database;
  httpServer: HttpServer;
};

type Fallback<TExtendedStore, K> = K extends keyof DefaultSdkStore
  ? DefaultSdkStore[K]
  : K extends keyof TExtendedStore
    ? TExtendedStore[K]
    : never;

export type DependencyStore<TExtendedStore = Record<never, never>> = {
  set<TKey extends keyof DefaultSdkStore | keyof TExtendedStore>(
    name: TKey,
    provider: Fallback<TExtendedStore, TKey>,
  ): void;
  get<TKey extends keyof DefaultSdkStore | keyof TExtendedStore>(
    name: TKey,
  ): Fallback<TExtendedStore, TKey>;
};

export function createDependencyStore<TExtendedStore = Record<never, never>>(
  initialProviders: Partial<
    Omit<DefaultSdkStore, keyof TExtendedStore> & TExtendedStore
  > = {},
): DependencyStore<TExtendedStore> {
  type Store = typeof initialProviders;
  const store = initialProviders;

  return {
    set<TKey extends keyof DefaultSdkStore | keyof TExtendedStore>(
      name: TKey,
      provider: Fallback<TExtendedStore, TKey>,
    ): void {
      store[name as keyof Store] = provider as Store[keyof Store];
    },

    get<TKey extends keyof DefaultSdkStore | keyof TExtendedStore>(
      name: TKey,
    ): Fallback<TExtendedStore, TKey> {
      const provider = store[name as keyof Store];

      if (!provider) {
        throw new Error(`No provider for ${name.toString()}`);
      }

      return provider as Fallback<TExtendedStore, TKey>;
    },
  };
}
