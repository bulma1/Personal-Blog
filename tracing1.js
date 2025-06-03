// // tracing.js
// const { NodeTracerProvider } = require('@opentelemetry/sdk-trace-node');
// const { SimpleSpanProcessor } = require('@opentelemetry/sdk-trace-base');
// const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http');
// const opentelemetry = require('@opentelemetry/resources');
// const { SemanticResourceAttributes } = require('@opentelemetry/semantic-conventions');
// const { registerInstrumentations } = require('@opentelemetry/instrumentation');
// const { ExpressInstrumentation } = require('@opentelemetry/instrumentation-express');
// const { HttpInstrumentation } = require('@opentelemetry/instrumentation-http');
// const { WinstonInstrumentation } = require('@opentelemetry/instrumentation-winston');
// const { trace } = require('@opentelemetry/api');

// const winston = require('winston');

// // Configure logger
// const logger = winston.createLogger({
//   level: 'info',
//   format: winston.format.combine(
//     winston.format.timestamp(),
//     winston.format.json()
//   ),
//   transports: [
//     new winston.transports.Console(),
//     new winston.transports.File({ filename: 'logs/application.log' })
//   ]
// });

// // Configure tracing
// const provider = new NodeTracerProvider({
//   resource: new opentelemetry.Resource({
//     [SemanticResourceAttributes.SERVICE_NAME]: 'personal-blog',
//   }),
// });

// // Use OTLP exporter for Coroot
// const exporter = new OTLPTraceExporter({
//   url: 'http://localhost:4318/v1/traces' // Default OTLP HTTP endpoint
// });

// provider.addSpanProcessor(new SimpleSpanProcessor(exporter));
// provider.register();

// // Get the tracer
// const tracer = trace.getTracer('personal-blog');

// // Register instrumentations
// registerInstrumentations({
//   instrumentations: [
//     new HttpInstrumentation(),
//     new ExpressInstrumentation(),
//     new WinstonInstrumentation({ logger }),
//   ],
// });

// // Export the logger and tracer to use in other files
// module.exports = { logger, tracer };