import type {
  Meter,
  PrometheusExporter,
  SdkTraceBaseSpanExporter,
  Span,
  SpanOptions,
  Tracer,
} from "../../opentelemetry/index.js";
import {
  api,
  core,
  exporterPrometheus,
  resources,
  sdkNode,
  sdkTraceBase,
  semanticConventions,
} from "../../opentelemetry/index.js";
import type { DependencyStore } from "../index.js";
import { bindSystemMetrics } from "./metrics/system.js";
import { createPinoSpanExporter } from "./pino-exporter.js";

const { W3CTraceContextPropagator } = core;
const { Resource } = resources;
const { TraceIdRatioBasedSampler } = sdkTraceBase;
const { SemanticResourceAttributes } = semanticConventions;
const {
  context,
  metrics: apiMetrics,
  propagation,
  trace,
  SpanStatusCode,
} = api;

export type Telemetry = {
  metrics: Meter;
  metricReader: PrometheusExporter;
  tracer: Tracer;
  startSpan<TResolved>(
    name: string,
    options: SpanOptions | undefined,
    callback: StartSpanCallback<TResolved>,
  ): Promise<TResolved>;
  shutdown(): Promise<void>;
};

type StartSpanCallback<TResolved> = (
  span: Span,
) => Promise<TResolved> | TResolved;

export function createTelemetry({
  config,
  dependencyStore,
}: {
  config: {
    name: string;
    version: string;
    envName: string;
    tracingSampling: number;
  };
  dependencyStore: DependencyStore;
}): Telemetry {
  const createLogger = dependencyStore.get("logger");
  const logger = createLogger("telemetry");

  const traceExporter: SdkTraceBaseSpanExporter = createPinoSpanExporter({
    logger,
  });

  const metricReader = new exporterPrometheus.PrometheusExporter({
    preventServerStart: true,
  });

  const sdk = new sdkNode.NodeSDK({
    traceExporter,
    metricReader,
    sampler: new TraceIdRatioBasedSampler(config.tracingSampling),
    resource: new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: config.name,
      [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: config.envName,
      [SemanticResourceAttributes.PROCESS_PID]: process.pid,
    }),
    autoDetectResources: false,
  });

  propagation.setGlobalPropagator(new W3CTraceContextPropagator());

  sdk.start();

  const tracer = trace.getTracer(config.name, config.version);

  const metrics = apiMetrics.getMeter(config.name, config.version);

  bindSystemMetrics({ metrics });

  async function startSpan<TResolved>(
    name: string,
    options: SpanOptions | undefined,
    callback: StartSpanCallback<TResolved>,
  ): Promise<TResolved> {
    const span = tracer.startSpan(name, options);
    const traceContext = trace.setSpan(context.active(), span);

    return context.with(traceContext, async () => {
      try {
        const result: TResolved = await callback(span);

        span.setStatus({ code: SpanStatusCode.OK });

        return result;
      } catch (error) {
        if (error instanceof Error) {
          span.recordException(error);
        }

        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: getErrorMessage(error),
        });

        throw error;
      } finally {
        span.end();
      }
    });
  }

  async function shutdown() {
    await sdk.shutdown();
  }

  return {
    metrics,
    metricReader,
    tracer,
    startSpan,
    shutdown,
  };
}

function getErrorMessage(error: unknown): string {
  if (typeof error === "string") {
    return error;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "telemetry: unknown error";
}
