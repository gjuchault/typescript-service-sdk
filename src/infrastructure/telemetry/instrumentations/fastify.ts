import type { FastifyRequest } from "fastify";

import { semanticConventions } from "../../../opentelemetry/index.js";
import type { OpenTelemetryPluginOptions } from "../../http/fastify-opentelemetry.js";

const { NetTransportValues, SemanticAttributes } = semanticConventions;

export const ATTRIBUTE_ERROR_NAME = "error.name";
export const ATTRIBUTE_ERROR_MESSAGE = "error.message";
export const ATTRIBUTE_ERROR_STACK = "error.stack";

export function createOpenTelemetryPluginOptions({
  config,
}: {
  config: { name: string; version: string };
}): OpenTelemetryPluginOptions {
  return {
    moduleName: config.name,
    moduleVersion: config.version,
    exposeApi: true,
    wrapRoutes: true,
    formatSpanName(request) {
      const pathname = request.routeOptions.url;
      return `${request.method} ${pathname}`;
    },
    formatSpanAttributes: {
      request(request): Record<string, string | number | undefined> {
        const requestUrl = getAbsoluteUrl(request);
        const headers = request.headers;
        const userAgent = headers["user-agent"];
        const ips = headers["x-forwarded-for"];
        const httpVersion = request.raw.httpVersion;
        const target = requestUrl.pathname ?? "/";

        const pathname = request.routeOptions.url;
        const clientIp =
          typeof ips === "string" ? ips.split(",")[0] : undefined;
        const netTransport =
          httpVersion === "QUIC"
            ? NetTransportValues.IP_UDP
            : NetTransportValues.IP_TCP;

        return {
          [SemanticAttributes.HTTP_URL]: requestUrl.toString(),
          [SemanticAttributes.HTTP_HOST]: requestUrl.host,
          [SemanticAttributes.NET_HOST_NAME]: requestUrl.hostname,
          [SemanticAttributes.HTTP_METHOD]: request.method,
          [SemanticAttributes.HTTP_ROUTE]: pathname,
          [SemanticAttributes.HTTP_CLIENT_IP]: clientIp,
          [SemanticAttributes.HTTP_TARGET]: target,
          [SemanticAttributes.HTTP_USER_AGENT]: userAgent,
          [SemanticAttributes.HTTP_FLAVOR]: httpVersion,
          [SemanticAttributes.HTTP_SERVER_NAME]: config.name,
          [SemanticAttributes.NET_TRANSPORT]: netTransport,
          ...getRequestContentLength(request),
        };
      },
      reply(reply) {
        return {
          [SemanticAttributes.HTTP_STATUS_CODE]: reply.statusCode,
        };
      },
      error(error) {
        return {
          [ATTRIBUTE_ERROR_NAME]: error.name,
          [ATTRIBUTE_ERROR_MESSAGE]: error.message,
          [ATTRIBUTE_ERROR_STACK]: error.stack,
        };
      },
    },
  };

  function getRequestContentLength(
    request: FastifyRequest,
  ): Record<string, number> | undefined {
    const length = Number(request.headers["content-length"]);

    if (!Number.isSafeInteger(length)) {
      return;
    }

    const isRequestCompressed =
      request.headers["content-encoding"] !== undefined &&
      request.headers["content-encoding"] !== "identity";

    const attribute = isRequestCompressed
      ? SemanticAttributes.HTTP_RESPONSE_CONTENT_LENGTH
      : SemanticAttributes.HTTP_RESPONSE_CONTENT_LENGTH_UNCOMPRESSED;

    return {
      [attribute]: length,
    };
  }
}

export function getAbsoluteUrl(request: FastifyRequest): URL {
  const protocol = request.protocol + ":";
  const host = request.hostname;
  const path = request.url;

  return new URL(protocol + "//" + host + path);
}
