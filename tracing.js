// tracing.js
const { NodeTracerProvider } = require('@opentelemetry/sdk-trace-node');
const { SimpleSpanProcessor, ConsoleSpanExporter } = require('@opentelemetry/sdk-trace-base');
const { JaegerExporter } = require('@opentelemetry/exporter-jaeger');
const { Resource } = require('@opentelemetry/resources');
const { SemanticResourceAttributes } = require('@opentelemetry/semantic-conventions');
const { registerInstrumentations } = require('@opentelemetry/instrumentation');
const { ExpressInstrumentation } = require('@opentelemetry/instrumentation-express');
const { HttpInstrumentation } = require('@opentelemetry/instrumentation-http');
const { WinstonInstrumentation } = require('@opentelemetry/instrumentation-winston');
const { trace } = require('@opentelemetry/api');
const winston = require('winston');

// Configure logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/application.log' })
  ]
});

// Configure tracing
const provider = new NodeTracerProvider({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: 'personal-blog',
    [SemanticResourceAttributes.SERVICE_VERSION]: '1.0.0',
    'environment': process.env.NODE_ENV || 'development'
  }),
});

// Configure Jaeger exporter
const jaegerExporter = new JaegerExporter({
  serviceName: 'personal-blog',
  endpoint: 'http://localhost:14268/api/traces',
});

// For debugging, also log spans to console
const consoleExporter = new ConsoleSpanExporter();

// Add both exporters (remove console exporter in production)
provider.addSpanProcessor(new SimpleSpanProcessor(jaegerExporter));
provider.addSpanProcessor(new SimpleSpanProcessor(consoleExporter));

provider.register();

// Get the tracer
const tracer = trace.getTracer('personal-blog');

// Register instrumentations
registerInstrumentations({
  instrumentations: [
    new HttpInstrumentation(),
    new ExpressInstrumentation(),
    new WinstonInstrumentation({ logger }),
  ],
});

// Export the logger and tracer to use in other files
module.exports = { logger, tracer };