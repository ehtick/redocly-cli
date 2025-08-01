import { resourceFromAttributes } from '@opentelemetry/resources';
import { NodeTracerProvider, SimpleSpanProcessor } from '@opentelemetry/sdk-trace-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';
import { version } from './package.js';
import { OTEL_TRACES_URL, DEFAULT_FETCH_TIMEOUT } from './constants.js';

import type { Analytics } from './telemetry.js';

type Events = {
  [key: string]: Analytics;
};

export class OtelServerTelemetry {
  send<K extends keyof Events>(event: K, data: Events[K]): void {
    const nodeTracerProvider = new NodeTracerProvider({
      resource: resourceFromAttributes({
        [ATTR_SERVICE_NAME]: `redocly-cli`,
        [ATTR_SERVICE_VERSION]: `@redocly/cli@${version}`,
      }),
      spanProcessors: [
        new SimpleSpanProcessor(
          new OTLPTraceExporter({
            url: OTEL_TRACES_URL,
            headers: {},
            timeoutMillis: DEFAULT_FETCH_TIMEOUT,
          })
        ),
      ],
    });

    const time = new Date();
    const eventId = crypto.randomUUID();
    const tracer = nodeTracerProvider.getTracer('CliTelemetry');
    const span = tracer.startSpan(`event.${event}`, {
      attributes: {
        'cloudevents.event_client.id': eventId,
        'cloudevents.event_client.type': event,
      },
      startTime: time,
    });
    for (const [key, value] of Object.entries(data)) {
      const keySnakeCase = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      if (value !== undefined) {
        span.setAttribute(`cloudevents.event_data.${keySnakeCase}`, value);
      }
    }
    span.end(time);
  }
}

export const otelTelemetry = new OtelServerTelemetry();
