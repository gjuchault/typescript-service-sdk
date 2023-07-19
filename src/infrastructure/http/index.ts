import { randomUUID } from "node:crypto";

import openTelemetryPlugin from "@autotelic/fastify-opentelemetry";
import circuitBreaker from "@fastify/circuit-breaker";
import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import etag from "@fastify/etag";
import formbody from "@fastify/formbody";
import helmet from "@fastify/helmet";
import multipart from "@fastify/multipart";
import rateLimit from "@fastify/rate-limit";
import underPressure from "@fastify/under-pressure";
import {
  AppRoute,
  AppRouter,
  ServerInferRequest,
  ServerInferResponses,
} from "@ts-rest/core";
import { initServer } from "@ts-rest/fastify";
import { generateOpenApi } from "@ts-rest/open-api";
import {
  fastify,
  type FastifyInstance,
  type FastifyReply,
  type FastifyRequest,
} from "fastify";
import ms from "ms";

import {
  createLogger,
  type LogLevel,
} from "../../infrastructure/logger/index.js";
import { createOpenTelemetryPluginOptions } from "../../infrastructure/telemetry/instrumentations/fastify.js";
import { metricsPlugin } from "../../infrastructure/telemetry/metrics/fastify.js";
import type { Cache } from "../cache/index.js";
import type { Telemetry } from "../telemetry/index.js";

export type HttpServer = FastifyInstance;
export type HttpRequest = FastifyRequest;
export type HttpReply = FastifyReply;

const requestTimeout = ms("120s");

function genericReturnTypeWrapper<TRouter extends AppRouter>() {
  return initServer().router<TRouter>({} as never, {} as never);
}

type InitializedRouter<TRouter extends AppRouter> = ReturnType<
  typeof genericReturnTypeWrapper<TRouter>
>;

export async function createHttpServer<TRouter extends AppRouter>({
  config,
  cache,
  telemetry,
  appRouter,
}: {
  config: { name: string; version: string; logLevel: LogLevel; secret: string };
  cache: Cache;
  telemetry: Telemetry;
  appRouter: InitializedRouter<TRouter>;
}) {
  const logger = createLogger("http", { config });

  const httpServer: HttpServer = fastify({
    requestTimeout,
    logger: undefined,
    requestIdHeader: "x-request-id",
    maxParamLength: 10_000,
    genReqId() {
      return randomUUID();
    },
  });

  await httpServer.register(
    openTelemetryPlugin,
    createOpenTelemetryPluginOptions({ config }),
  );
  await httpServer.register(metricsPlugin, telemetry);

  await httpServer.register(circuitBreaker);
  await httpServer.register(cookie, { secret: config.secret });
  await httpServer.register(cors);
  await httpServer.register(etag);
  await httpServer.register(helmet);
  await httpServer.register(formbody);
  await httpServer.register(multipart);
  await httpServer.register(rateLimit, {
    redis: cache,
  });
  await httpServer.register(underPressure);

  await httpServer.register(initServer().plugin(appRouter), {
    logLevel: config.logLevel,
    prefix: "/api",
  });

  httpServer.setNotFoundHandler(
    {
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      preHandler: httpServer.rateLimit(),
    },
    function (_request, reply) {
      void reply.code(404).send();
    },
  );

  httpServer.addHook("onRequest", (request, _response, done) => {
    logger.debug(`http request: ${request.method} ${request.url}`, {
      requestId: getRequestId(request),
      method: request.method,
      url: request.url,
      route: request.routerPath,
      userAgent: request.headers["user-agent"],
    });

    done();
  });

  httpServer.addHook("onResponse", (request, reply, done) => {
    logger.debug(
      `http reply: ${request.method} ${request.url} ${reply.statusCode}`,
      {
        requestId: getRequestId(request),
        method: request.method,
        url: request.url,
        route: request.routerPath,
        userAgent: request.headers["user-agent"],
        responseTime: Math.ceil(reply.getResponseTime()),
        httpStatusCode: reply.statusCode,
      },
    );

    done();
  });

  httpServer.addHook("onError", (request, reply, error, done) => {
    logger.error(`http error (${error.code}): ${error.name} ${error.message}`, {
      requestId: getRequestId(request),
      error: {
        name: error.name,
        message: error.message,
        code: error.code,
        stack: error.stack,
      },
      method: request.method,
      url: request.url,
      route: request.routerPath,
      userAgent: request.headers["user-agent"],
      responseTime: Math.ceil(reply.getResponseTime()),
      httpStatusCode: reply.statusCode,
    });

    done();
  });

  httpServer.get("/api/docs", (_request, reply) => {
    return reply.send(
      generateOpenApi(
        appRouter.contract,
        {
          info: {
            title: config.name,
            version: config.version,
          },
        },
        { setOperationId: true },
      ),
    );
  });

  return httpServer;
}

function getRequestId(request: FastifyRequest): string | undefined {
  if (typeof request.id === "string") {
    return request.id;
  }

  return undefined;
}

type AppRouteImplementation<T extends AppRoute> = (
  input: ServerInferRequest<T, FastifyRequest["headers"]> & {
    request: FastifyRequest;
    reply: FastifyReply;
  },
) => Promise<ServerInferResponses<T>>;

export type RouterImplementation<T extends AppRouter> = {
  [TKey in keyof T]: T[TKey] extends AppRouter
    ? RouterImplementation<T[TKey]>
    : T[TKey] extends AppRoute
    ? AppRouteImplementation<T[TKey]>
    : never;
};
