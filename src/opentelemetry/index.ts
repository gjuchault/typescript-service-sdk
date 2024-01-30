import {
	SpanKind,
	SpanStatusCode,
	ValueType,
	default as OpentelemetryApi,
	trace,
} from "@opentelemetry/api";
import { default as core } from "@opentelemetry/core";
import { default as exporterPrometheus } from "@opentelemetry/exporter-prometheus";
import { default as resources } from "@opentelemetry/resources";
import { default as sdkNode } from "@opentelemetry/sdk-node";
import { default as sdkTraceBase } from "@opentelemetry/sdk-trace-base";
import { default as semanticConventions } from "@opentelemetry/semantic-conventions";

export const api = {
	...OpentelemetryApi,
	SpanKind,
	SpanStatusCode,
	trace,
	ValueType,
};

export {
	core,
	exporterPrometheus,
	resources,
	sdkNode,
	sdkTraceBase,
	semanticConventions,
};

export type {
	Meter,
	Span,
	SpanOptions,
	SpanStatusCode,
	Tracer,
} from "@opentelemetry/api/build/src";
export type { PrometheusExporter } from "@opentelemetry/exporter-prometheus/build/src";
export type { SpanExporter as SdkTraceBaseSpanExporter } from "@opentelemetry/sdk-trace-base/build/src";
