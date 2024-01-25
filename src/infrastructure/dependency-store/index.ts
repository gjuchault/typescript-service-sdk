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

type Fallback<ExtendedStore, K> = K extends keyof DefaultSdkStore
	? DefaultSdkStore[K]
	: K extends keyof ExtendedStore
	  ? ExtendedStore[K]
	  : never;

export type DependencyStore<ExtendedStore = Record<never, never>> = {
	set<Key extends keyof DefaultSdkStore | keyof ExtendedStore>(
		name: Key,
		provider: Fallback<ExtendedStore, Key>,
	): void;
	get<Key extends keyof DefaultSdkStore | keyof ExtendedStore>(
		name: Key,
	): Fallback<ExtendedStore, Key>;
};

export function createDependencyStore<ExtendedStore = Record<never, never>>(
	initialProviders: Partial<
		Omit<DefaultSdkStore, keyof ExtendedStore> & ExtendedStore
	> = {},
): DependencyStore<ExtendedStore> {
	type Store = typeof initialProviders;
	const store = initialProviders;

	return {
		set<Key extends keyof DefaultSdkStore | keyof ExtendedStore>(
			name: Key,
			provider: Fallback<ExtendedStore, Key>,
		): void {
			store[name as keyof Store] = provider as Store[keyof Store];
		},

		get<Key extends keyof DefaultSdkStore | keyof ExtendedStore>(
			name: Key,
		): Fallback<ExtendedStore, Key> {
			const provider = store[name as keyof Store];

			if (!provider) {
				throw new Error(`No provider for ${name.toString()}`);
			}

			return provider as Fallback<ExtendedStore, Key>;
		},
	};
}
