const Log = require('./index');

const log = new Log({ env: 'test', name: 'doug' });

log.debug('hi I am Doug', { a: 1, doug: true });
log.info('hi I am Doug', { a: 1, doug: true });
log.alert('hi I am Doug', { a: 1, doug: true });
log.warn('hi I am Doug', { a: 1, doug: true });
log.error('hi I am Doug', { a: 1, doug: true });

process.exit(1);