const Log = require('./index');
const trace_events = require('trace_events');
const t2 = trace_events.createTracing({ categories: ['node.perf', 'node'] });
t2.enable();

const log = new Log({ env: 'production' }, { appName: 'DOUGLAS' });

log.error({ namespace: 'DOUGLAS', msg: 'Your application is crashed', metadata: { task: 'Douglas' }, stackTrace: new Error('durp') });
log.warn({ namespace: 'WARNING', msg: 'There is a bug, no side effects', metadata: { task: 'Douglas' }, stackTrace: new Error('unhandled') });
log.info({ namespace: 'SERVER', msg: 'Just another important info', metadata: { express: 3.1 } });
log.debug({ namespace: 'ENTRYPOINT', msg: 'Debugging app' });

process.exit(1);
