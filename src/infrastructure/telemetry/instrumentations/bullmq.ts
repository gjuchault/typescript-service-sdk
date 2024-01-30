import type { Job, Worker } from "bullmq";

import { api, semanticConventions } from "../../../opentelemetry/index.js";

const { SpanKind } = api;
const { DbSystemValues, SemanticAttributes } = semanticConventions;

const bullMqAttributes = {
	// biome-ignore lint/style/useNamingConvention: opentelemetry convention
	JOB_ATTEMPTS: "messaging.bullmq.job.attempts",
	// biome-ignore lint/style/useNamingConvention: opentelemetry convention
	JOB_DELAY: "messaging.bullmq.job.delay",
	// biome-ignore lint/style/useNamingConvention: opentelemetry convention
	JOB_NAME: "messaging.bullmq.job.name",
	// biome-ignore lint/style/useNamingConvention: opentelemetry convention
	JOB_TIMESTAMP: "messaging.bullmq.job.timestamp",
	// biome-ignore lint/style/useNamingConvention: opentelemetry convention
	QUEUE_NAME: "messaging.bullmq.queue.name",
	// biome-ignore lint/style/useNamingConvention: opentelemetry convention
	WORKER_NAME: "messaging.bullmq.worker.name",
};

export function getSpanOptions({
	worker,
	job,
	taskName,
	url,
}: {
	worker: Worker;
	job: Job;
	taskName: string;
	url: string;
}) {
	return {
		kind: SpanKind.CLIENT,
		attributes: {
			...getCommonSpanOptions(url),
			[SemanticAttributes.MESSAGING_CONSUMER_ID]: taskName,
			[SemanticAttributes.MESSAGING_MESSAGE_ID]: job.id ?? "unknown",
			[SemanticAttributes.MESSAGING_OPERATION]: "receive",
			[bullMqAttributes.JOB_NAME]: job.name,
			[bullMqAttributes.JOB_ATTEMPTS]: job.attemptsMade,
			[bullMqAttributes.JOB_TIMESTAMP]: job.timestamp,
			[bullMqAttributes.JOB_DELAY]: job.delay,
			[bullMqAttributes.QUEUE_NAME]: job.queueName,
			[bullMqAttributes.WORKER_NAME]: worker.name,
		},
	};
}

function getCommonSpanOptions(url: string) {
	const redisUrl = new URL(url);
	redisUrl.password = "";

	return {
		[SemanticAttributes.DB_SYSTEM]: DbSystemValues.REDIS,
		[SemanticAttributes.DB_NAME]:
			redisUrl.pathname.slice(1) === "" ? "0" : redisUrl.pathname.slice(1),
		[SemanticAttributes.NET_PEER_NAME]: redisUrl.host,
		[SemanticAttributes.NET_PEER_PORT]: redisUrl.port,
		[SemanticAttributes.DB_CONNECTION_STRING]: `redis://${redisUrl.host}:${redisUrl.port}`,
		[SemanticAttributes.DB_USER]: redisUrl.username,
		[SemanticAttributes.MESSAGING_SYSTEM]: "bullmq",
	};
}
