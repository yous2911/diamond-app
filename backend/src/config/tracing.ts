// Conditional OpenTelemetry import
let openTelemetryApi: any;

try {
  openTelemetryApi = require('@opentelemetry/api');
  const { NodeSDK } = require('@opentelemetry/auto-instrumentations-node');
  
  const sdk = new NodeSDK({
    instrumentations: [], // Add instrumentations as needed
  });
  
  sdk.start();
  console.log('OpenTelemetry initialized successfully');
} catch (error: unknown) {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
  console.warn('OpenTelemetry not installed, tracing disabled:', errorMessage);
  
  // Mock OpenTelemetry API
  openTelemetryApi = {
    trace: {
      getTracer: () => ({
        startSpan: (_name: string) => ({
          end: () => {},
          setStatus: () => {},
          setAttributes: () => {},
          recordException: () => {},
        }),
      }),
    },
  };
}

export const _tracer = openTelemetryApi.trace.getTracer('reved-kids-fastify'); 