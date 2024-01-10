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

export function createDependencyStore<
  TExtendedStore = Record<never, never>,
>(): DependencyStore<TExtendedStore> {
  type LocalStore = Partial<
    Omit<DefaultSdkStore, keyof TExtendedStore> & TExtendedStore
  >;

  const store: LocalStore = {};

  return {
    set<TKey extends keyof DefaultSdkStore | keyof TExtendedStore>(
      name: TKey,
      provider: Fallback<TExtendedStore, TKey>,
    ): void {
      store[name as keyof LocalStore] =
        provider as LocalStore[keyof LocalStore];
    },

    get<TKey extends keyof DefaultSdkStore | keyof TExtendedStore>(
      name: TKey,
    ): Fallback<TExtendedStore, TKey> {
      const provider = store[name as keyof LocalStore];

      if (!provider) {
        throw new Error(`No provider for ${name.toString()}`);
      }

      return provider as Fallback<TExtendedStore, TKey>;
    },
  };
}
