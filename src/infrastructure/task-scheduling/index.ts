import path from "node:path";
import url from "node:url";

import type { Job, JobsOptions } from "bullmq";
import { Queue, scriptLoader, Worker } from "bullmq";

import type { Cache } from "../cache/index.js";
import type { DependencyStore } from "../index.js";
import { getSpanOptions } from "../telemetry/instrumentations/bullmq.js";

const __dirname = url.fileURLToPath(new URL(".", import.meta.url));

export type Dependencies = {
  config: { name: string; redisUrl: string };
  dependencyStore: DependencyStore;
};

export type TaskScheduling = {
  createTask<TPayload>(
    taskName: string,
    processFunction: (job: Job<TPayload>) => Promise<void>,
    workersCount?: number,
  ): Promise<(payloads: TPayload[], options?: JobsOptions) => Promise<void>>;
  allWorkers: Worker[];
  allQueues: Queue[];
  allConnections: Cache[];
};

export function createTaskScheduling({
  config,
  dependencyStore,
}: Dependencies): TaskScheduling {
  const createLogger = dependencyStore.get("logger");
  const cache = dependencyStore.get("cache");
  const telemetry = dependencyStore.get("telemetry");

  const allQueues: Queue[] = [];
  const allWorkers: Worker[] = [];
  const allConnections: Cache[] = [];

  // prevent bullmq from reading from node_modules that might not exist if we
  // bundle the files
  scriptLoader.load = async (client: Cache) => {
    const scripts = await scriptLoader.loadScripts(
      path.join(__dirname, "./bullmq-commands"),
    );
    for (const command of scripts) {
      if (!(client as unknown as Record<string, unknown>)[command.name]) {
        client.defineCommand(command.name, command.options);
      }
    }
  };

  return {
    async createTask<TPayload>(
      taskName: string,
      processFunction: (job: Job<TPayload>) => Promise<void>,
      workersCount = 1,
    ) {
      const name = `${config.name}-task-scheduling-${taskName}`;
      const logger = createLogger(`task-scheduling-${taskName}`);

      const queueConnection = cache.duplicate({ maxRetriesPerRequest: null });
      const queue = new Queue(name, {
        connection: queueConnection,
      });

      await queue.waitUntilReady();

      allQueues.push(queue);
      allConnections.push(queueConnection);

      for (let index = 0; index < workersCount; index += 1) {
        const workerConnection = cache.duplicate({
          maxRetriesPerRequest: null,
        });
        const worker = new Worker<TPayload>(
          name,
          async (job) => {
            await telemetry.startSpan(
              "taskScheduling.worker",
              getSpanOptions({
                worker,
                job,
                taskName,
                url: config.redisUrl,
              }),
              () => processFunction(job),
            );
          },
          { connection: workerConnection },
        );

        await worker.waitUntilReady();

        allWorkers.push(worker);
        allConnections.push(workerConnection);

        worker.on("active", (job) => {
          logger.debug(`Worker ${worker.id} taking ${taskName}`, {
            ...job.toJSON(),
          });
        });

        worker.on("failed", (job, error) => {
          logger.debug(`Worker ${worker.id} failed ${taskName}`, {
            error,
            ...(job === undefined ? {} : job.toJSON()),
          });
        });

        worker.on("completed", (job) => {
          logger.debug(`Worker ${worker.id} completed ${taskName}`, {
            ...job.toJSON(),
          });
        });
      }

      return async function enqueue(
        payloads: TPayload[],
        options?: JobsOptions,
      ) {
        logger.debug(`enqueuing ${taskName}`, {
          payloads,
          options,
        });

        await queue.addBulk(
          payloads.map((data) => ({ name, data, opts: options })),
        );
      };
    },

    allWorkers,
    allQueues,
    allConnections,
  };
}
