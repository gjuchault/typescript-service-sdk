import type { Histogram, NodeGCPerformanceDetail } from "node:perf_hooks";
import perfHooks from "node:perf_hooks";

import { match } from "ts-pattern";

import { noop } from "../../../noop.js";
import type { Meter } from "../../../opentelemetry/index.js";
import { api } from "../../../opentelemetry/index.js";

const { ValueType } = api;

// https://github.com/siimon/prom-client/blob/master/lib/metrics

const startInSeconds = Math.round(Date.now() / 1000 - process.uptime());

export function bindSystemMetrics({ metrics }: { metrics: Meter }) {
  // eventLoopLag
  const eventLoopDelay = perfHooks.monitorEventLoopDelay();
  eventLoopDelay.enable();

  const eventLoopKeys: (keyof Histogram)[] = ["min", "max", "mean", "stddev"];

  for (const key of eventLoopKeys) {
    const gauge = metrics.createObservableGauge(
      `nodejs_eventloop_lag_${key}_seconds`,
      {
        description: `${key} event loop lag in seconds`,
        unit: "seconds",
        valueType: ValueType.DOUBLE,
      },
    );

    gauge.addCallback((observableResult) => {
      match(key)
        .with("min", () => observableResult.observe(eventLoopDelay.min / 1e9))
        .with("max", () => observableResult.observe(eventLoopDelay.max / 1e9))
        .with("mean", () => observableResult.observe(eventLoopDelay.mean / 1e9))
        .with("stddev", () =>
          observableResult.observe(eventLoopDelay.stddev / 1e9),
        )
        .with("percentiles", noop)
        .with("exceeds", noop)
        .with("reset", noop)
        .with("percentile", noop)
        .exhaustive();
    });
  }

  const percentileKeys = [50, 90, 99];
  for (const percentile of percentileKeys) {
    const gauge = metrics.createObservableGauge(
      `nodejs_eventloop_lag_p${percentile.toString()}_seconds`,
      {
        description: `The ${percentile.toString()}th percentile of the recorded event loop delays`,
        unit: "seconds",
        valueType: ValueType.DOUBLE,
      },
    );

    gauge.addCallback((observableResult) => {
      observableResult.observe(eventLoopDelay.percentile(percentile) / 1e9);
    });
  }

  // gc
  const gcHistogram = metrics.createHistogram("nodejs_gc_duration_seconds", {
    description:
      "Garbage collection duration by kind, one of major, minor, incremental or weakcb in seconds",
    unit: "seconds",
    valueType: ValueType.DOUBLE,
  });

  const kinds = new Map<number, string>();
  kinds.set(perfHooks.constants.NODE_PERFORMANCE_GC_MAJOR, "major");
  kinds.set(perfHooks.constants.NODE_PERFORMANCE_GC_MINOR, "minor");
  kinds.set(perfHooks.constants.NODE_PERFORMANCE_GC_INCREMENTAL, "incremental");
  kinds.set(perfHooks.constants.NODE_PERFORMANCE_GC_WEAKCB, "weakcb");

  const gcObserver = new perfHooks.PerformanceObserver((list) => {
    const entry = list.getEntries()[0];

    if (entry === undefined) {
      return;
    }

    const kind = (entry.detail as NodeGCPerformanceDetail).kind;

    if (kind === undefined) {
      return;
    }

    gcHistogram.record(entry.duration / 1000, { kind: kinds.get(kind) ?? "" });
  });
  gcObserver.observe({ entryTypes: ["gc"] });

  // heapSizeAndUsed
  // share a variable to avoid discrepancies between values
  let sharedMemoryUsage: NodeJS.MemoryUsage;
  const memoryKeys: (keyof NodeJS.MemoryUsage)[] = [
    "heapTotal",
    "heapUsed",
    "external",
  ];
  for (const key of memoryKeys) {
    const gauge = metrics.createObservableGauge(
      "nodejs_heap_size_total_bytes",
      {
        description: `${key} size in bytes`,
        unit: "bytes",
        valueType: ValueType.INT,
      },
    );

    gauge.addCallback((observableResult) => {
      match(key)
        .with("heapTotal", () => {
          try {
            sharedMemoryUsage = process.memoryUsage();
            observableResult.observe(sharedMemoryUsage.heapTotal);
          } catch {
            // ignore
          }
        })
        .with("heapUsed", () => {
          observableResult.observe(sharedMemoryUsage.heapUsed);
        })
        .with("external", () => {
          observableResult.observe(sharedMemoryUsage.external);
        })
        .with("rss", noop)
        .with("arrayBuffers", noop)
        .exhaustive();
    });
  }

  // processCpuTotal
  let lastCpuUsage = process.cpuUsage();
  let sharedCpuUsage: NodeJS.CpuUsage;
  for (const key of ["user", "system", "shared"]) {
    const gauge = metrics.createObservableCounter(
      `process_cpu_${key}_seconds_total`,
      {
        description: `Total ${key} CPU time spent in seconds`,
        unit: "seconds",
        valueType: ValueType.DOUBLE,
      },
    );

    gauge.addCallback((observableResult) => {
      if (key === "user") {
        sharedCpuUsage = process.cpuUsage();
        // wait for other counters to report
        setTimeout(() => {
          lastCpuUsage = sharedCpuUsage;
        });
      }

      const userUsageMicros = sharedCpuUsage.user - lastCpuUsage.user;
      const systemUsageMicros = sharedCpuUsage.system - lastCpuUsage.system;

      const value =
        key === "user"
          ? userUsageMicros
          : key === "system"
            ? systemUsageMicros
            : userUsageMicros + systemUsageMicros;

      observableResult.observe(value / 1e6);
    });
  }

  // processHandles
  const processHandlesGauge = metrics.createObservableGauge(
    "nodejs_active_handles",
    {
      description: "Number of active handles",
      unit: "handles",
      valueType: ValueType.INT,
    },
  );

  processHandlesGauge.addCallback((observableResult) => {
    if ("getActiveResourcesInfo" in process) {
      const handles = (process.getActiveResourcesInfo as () => string[])();
      observableResult.observe(handles.length);
    }
  });

  // processStartTime
  const processStartTimeGauge = metrics.createObservableGauge(
    "nodejs_process_start_time_seconds",
    {
      description: "Start time of the process in seconds unix timestamp",
      unit: "seconds",
      valueType: ValueType.INT,
    },
  );

  processStartTimeGauge.addCallback((observableResult) => {
    observableResult.observe(startInSeconds);
  });

  const processUpTimeGauge = metrics.createObservableGauge(
    "nodejs_process_up_time_seconds",
    {
      description: "Up time of the process in seconds",
      unit: "seconds",
      valueType: ValueType.INT,
    },
  );

  processUpTimeGauge.addCallback((observableResult) => {
    observableResult.observe(Math.round(Date.now() / 1000 - startInSeconds));
  });
}
