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

export type DependencyStore<TStore = DefaultSdkStore> = {
  set<TKey extends keyof (TStore & DefaultSdkStore)>(
    name: TKey,
    provider: (TStore & DefaultSdkStore)[TKey],
  ): void;
  get<TKey extends keyof (TStore & DefaultSdkStore)>(
    name: TKey,
  ): (TStore & DefaultSdkStore)[TKey];
};

export function createDependencyStore<
  TStore = DefaultSdkStore,
>(): DependencyStore<TStore & DefaultSdkStore> {
  const store: TStore & DefaultSdkStore = {} as TStore & DefaultSdkStore;

  return {
    set<TKey extends keyof (TStore & DefaultSdkStore)>(
      name: TKey,
      provider: (TStore & DefaultSdkStore)[TKey],
    ) {
      store[name] = provider;
    },

    get<TKey extends keyof (TStore & DefaultSdkStore)>(
      name: TKey,
    ): (TStore & DefaultSdkStore)[TKey] {
      const provider = store[name];

      if (!provider) {
        throw new Error(`No provider for ${name.toString()}`);
      }

      return provider;
    },
  };
}
