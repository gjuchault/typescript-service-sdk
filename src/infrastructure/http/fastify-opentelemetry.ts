import type { Context, Span, Tracer } from "@opentelemetry/api";
import {
  context,
  defaultTextMapGetter,
  defaultTextMapSetter,
  propagation,
  SpanStatusCode,
  trace,
} from "@opentelemetry/api";
import type {
  FastifyInstance,
  FastifyReply,
  FastifyRequest,
  RouteHandlerMethod,
} from "fastify";
import fp from "fastify-plugin";

export interface RequestDecorator {
  activeSpan: Span | undefined;
  context: Context;
  tracer: Tracer;
  inject<TCarrier>(
    carrier: TCarrier,
    setter?: typeof defaultTextMapSetter,
  ): void;
  extract<TCarrier>(
    carrier: TCarrier,
    getter?: typeof defaultTextMapGetter,
  ): Context;
}

export interface OpenTelemetryPluginOptions {
  moduleName: string;
  moduleVersion: string;
  wrapRoutes?: boolean | string[];
  exposeApi?: boolean;
  formatSpanAttributes?: {
    request: (
      request: FastifyRequest,
    ) => Record<string, string | number | undefined>;
    reply: (reply: FastifyReply) => Record<string, string | number | undefined>;
    error: (error: Error) => Record<string, string | number | undefined>;
  };
  formatSpanName?: (request: FastifyRequest) => string;
  ignoreRoutes?: string[] | ((path: string, method: string) => boolean);
}

function defaultFormatSpanName(request: FastifyRequest): string {
  const {
    method,
    routeOptions: { url },
  } = request;
  return `${method} ${url}`;
}

const defaultFormatSpanAttributes = {
  request(request: FastifyRequest) {
    return {
      "req.method": request.raw.method,
      "req.url": request.raw.url,
    };
  },
  reply(reply: FastifyReply) {
    return {
      "reply.statusCode": reply.statusCode,
    };
  },
  error(error: Error) {
    return {
      "error.name": error.name,
      "error.message": error.message,
      "error.stack": error.stack,
    };
  },
};

// still better to have async function than callback
// eslint-disable-next-line @typescript-eslint/require-await
async function openTelemetryPluginImplementation(
  fastify: FastifyInstance,
  {
    moduleName,
    moduleVersion,
    wrapRoutes = false,
    exposeApi = true,
    formatSpanName = defaultFormatSpanName,
    ignoreRoutes = [],
    formatSpanAttributes: inputFormatSpanAttributes,
  }: OpenTelemetryPluginOptions,
): Promise<undefined> {
  const shouldIgnoreRoute =
    typeof ignoreRoutes === "function"
      ? ignoreRoutes
      : (path: string) => ignoreRoutes.includes(path);

  const formatSpanAttributes = {
    ...defaultFormatSpanAttributes,
    ...(inputFormatSpanAttributes || {}),
  };

  function getContext(request: FastifyRequest) {
    return contextMap.get(request) || context.active();
  }

  function openTelemetryRequestDecorator(
    this: FastifyRequest,
  ): RequestDecorator {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const request = this;

    return {
      get activeSpan() {
        return trace.getSpan(getContext(request));
      },
      get context() {
        return getContext(request);
      },
      get tracer() {
        return tracer;
      },
      inject<TCarrier>(carrier: TCarrier, setter = defaultTextMapSetter) {
        return propagation.inject(getContext(request), carrier, setter);
      },
      extract<TCarrier>(carrier: TCarrier, getter = defaultTextMapGetter) {
        return propagation.extract(getContext(request), carrier, getter);
      },
    };
  }

  if (exposeApi) {
    fastify.decorateRequest("openTelemetry", openTelemetryRequestDecorator);
  }

  const contextMap = new WeakMap<FastifyRequest, Context>();
  const tracer = trace.getTracer(moduleName, moduleVersion);

  // still better to have async function than callback
  // eslint-disable-next-line @typescript-eslint/require-await
  async function onRequest(request: FastifyRequest) {
    if (shouldIgnoreRoute(request.url, request.method)) return;

    let activeContext = context.active();

    // if not running within a local span then extract the context from the headers carrier
    if (!trace.getSpan(activeContext)) {
      activeContext = propagation.extract(activeContext, request.headers);
    }

    const span = tracer.startSpan(formatSpanName(request), {}, activeContext);
    span.setAttributes(formatSpanAttributes.request(request));
    contextMap.set(request, trace.setSpan(activeContext, span));
  }

  // still better to have async function than callback
  // eslint-disable-next-line @typescript-eslint/require-await
  async function onResponse(request: FastifyRequest, reply: FastifyReply) {
    if (shouldIgnoreRoute(request.url, request.method)) return;

    const activeContext = getContext(request);
    const span = trace.getSpan(activeContext);
    const spanStatus = { code: SpanStatusCode.OK };

    if (reply.statusCode >= 400) {
      spanStatus.code = SpanStatusCode.ERROR;
    }

    if (span !== undefined) {
      span.setAttributes(formatSpanAttributes.reply(reply));
      span.setStatus(spanStatus);
      span.end();
    }

    contextMap.delete(request);
  }

  // still better to have async function than callback
  // eslint-disable-next-line @typescript-eslint/require-await
  async function onError(
    request: FastifyRequest,
    reply: FastifyReply,
    error: Error,
  ) {
    if (shouldIgnoreRoute(request.url, request.method)) return;

    const activeContext = getContext(request);
    const span = trace.getSpan(activeContext);

    if (span !== undefined) {
      span.setAttributes(formatSpanAttributes.error(error));
    }
  }

  fastify.addHook("onRequest", onRequest);
  fastify.addHook("onResponse", onResponse);
  fastify.addHook("onError", onError);

  function wrapRoute(routeHandler: RouteHandlerMethod) {
    return async function (request: FastifyRequest, reply: FastifyReply) {
      const reqContext = getContext(request);
      return await context.with(reqContext, async (): Promise<void> => {
        await routeHandler.call(request.server, request, reply);
      });
    };
  }

  if (wrapRoutes) {
    // still better to have async function than callback
    // eslint-disable-next-line @typescript-eslint/require-await
    fastify.addHook("onRoute", async function (routeOpts) {
      const { path, handler, method } = routeOpts;

      if (!Array.isArray(method) && !shouldIgnoreRoute(path, method)) {
        if (wrapRoutes === true) {
          routeOpts.handler = wrapRoute(handler);
        } else if (Array.isArray(wrapRoutes) && wrapRoutes.includes(path)) {
          routeOpts.handler = wrapRoute(handler);
        }
      }
    });
  }

  return undefined;
}

export const openTelemetryPlugin = fp(openTelemetryPluginImplementation, {
  fastify: "4.x",
  name: "fastify-opentelemetry",
});
