import { api, semanticConventions } from "../../../opentelemetry/index.js";

const { SpanKind } = api;
const { DbSystemValues, SemanticAttributes } = semanticConventions;

export function getSpanOptions(url: string) {
	return {
		kind: SpanKind.CLIENT,
		attributes: {
			...getCommonSpanOptions(url),
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
	};
}
