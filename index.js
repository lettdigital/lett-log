const winston = require('winston');
require('winston-syslog').Syslog;

const SYSLOG_HOST = process.env.SYSLOG_HOST;
const SYSLOG_PROTOCOL = process.env.SYSLOG_PROTOCOL;
const SYSLOG_PORT = process.env.SYSLOG_PORT;
const SYSLOG_FACILITY = process.env.SYSLOG_FACILITY;
const SYSLOG_PATH = process.env.SYSLOG_PATH;
const SYSLOG_APP_NAME = process.env.APP_NAME;

const { format } = require('winston');
const { combine, label, printf, timestamp, colorize } = format;

const myFormat = printf(log => {
    // Date format = YYYY-MM-DD HH:mm:ss,SSSZ
    const isoDate = new Date()
        .toISOString()
        .replace('T', ' ')
        .replace('.', ',');
    const logParsed = JSON.parse(log.message);
    return `${isoDate}[${log.level.toUpperCase()}][${log.label}]:[MSG](${logParsed.namespace})${logParsed.msg} (ERROR)=${
        logParsed.stackTrace
    }[METADATA]${JSON.stringify(logParsed.metadata)}`;
});

const myCustomLevels = {
    levels: {
        error: 0,
        warning: 1,
        info: 2,
        debug: 3,
    },
    colors: {
        error: 'red',
        warning: 'yellow',
        info: 'green',
        debug: 'blue',
    },
};

/**
 * @class
 * @author Douglas Eleutério <douglaseleuterio@lett.digital>
 * @description A log class to send messagens to elastic log
 * @param {Object=} connection A connection object
 * @param {String} connection.host Host to send logs
 * @param {String} connection.appName An uniq name for app
 * @param {String} connection.protocol A protocol to send logs (UPD or TCP)
 * @param {Number} connection.port A port to connect
 * @param {String} connection.facility An user
 * @param {String} connection.path A path to write logs
 * @param {Object=} defaultMeta A default metadata to send on every log
 */
class Log {
    /**
     * @constructor
     */
    constructor(defaultMeta = {}, { appName = '', host = '', protocol = '', port = 0, facility = '', path = '', timestamp = false } = {}) {
        if (!appName && !SYSLOG_APP_NAME) {
            throw 'No appName or environment variable SYSLOG_APP_NAME defined';
        }

        winston.addColors(myCustomLevels.colors);
        this.logger = winston.createLogger({
            levels: myCustomLevels.levels,
            level: 'debug',
            format: combine(label({ label: appName || SYSLOG_APP_NAME }), myFormat),
            transports: [
                new winston.transports.Console({
                    format: combine(
                        colorize(),
                        timestamp(),
                        printf(({ message, timestamp, level }) => {
                            const metadata = JSON.parse(message.substring(message.indexOf('[METADATA]')).replace('[METADATA]', ''));
                            const text = message.substring(5, message.indexOf('[METADATA]'));
                            const ts = timestamp.slice(0, 19).replace('T', ' ');
                            return `${ts} ${level}: ${text} ${Object.keys(metadata).length ? JSON.stringify(metadata, null, 2) : ''}\n`;
                        }),
                    ),
                }),
                new winston.transports.Syslog({
                    host: host || SYSLOG_HOST,
                    protocol: protocol || SYSLOG_PROTOCOL,
                    port: port || SYSLOG_PORT,
                    facility: facility || SYSLOG_FACILITY,
                    path: path || SYSLOG_PATH,
                    app_name: appName || SYSLOG_APP_NAME,
                }),
            ],
        });

        this.setDefaultMeta(defaultMeta);
    }

    /**
     * @description Override default metadata object
     * @param {Object} defaultMeta A default metadata to send on every log
     */
    setDefaultMeta(defaultMeta) {
        this.defaultMeta = defaultMeta;
    }

    /**
     * @deprecated
     * @description Override default metadata object
     * @param {Object} defaultMeta A default metadata to send on every log
     */
    setParams(defaultMeta) {
        this.setDefaultMeta(defaultMeta);
    }

    /**
     * @description Assing new properties to metadata object and override if already exists one or more properties
     * @param {Object} defaultMeta A default metadata to bind
     */
    assingToDefaultMeta(defaultMeta) {
        Object.assign(this.defaultMeta, defaultMeta);
    }

    /**
     * @description A generic log function
     * @param {String} type A log level
     * @param {String} msg A message which will be not indexed by elastic
     * @param {Object} metadata A JSON which will be indexed by elastic
     */
    show(type, msg, metadata) {
        let meta = metadata || {};
        if (this.defaultMeta) meta = _.merge(meta, this.defaultMeta);
        this.logger.log(type, `[MSG]${msg} [METADATA]${JSON.stringify(meta)}`);
    }

    /**
     * @description Log level error - priority 0
     * @param {String|Object} msg A message which will be not indexed by elastic or a error object to be stringified
     * @param {Object} metadata A JSON which will be indexed by elastic
     * @param {Boolean} toError Automatic parse error object to string
     */
    error(msg, metadata, toError) {
        let stringMsg = msg;
        if (toError) {
            stringMsg = this.toError(msg);
        }
        this.show('error', stringMsg, metadata);
    }

    /**
     * @description Log level warn - priority 1
     * @param {String} msg A message which will be not indexed by elastic
     * @param {Object} metadata A JSON which will be indexed by elastic
     */
    warn(msg, metadata) {
        this.show('warning', msg, metadata);
    }

    /**
     * @description Log level alert - priority 2
     * @param {String} msg A message which will be not indexed by elastic
     * @param {Object} metadata A JSON which will be indexed by elastic
     */
    alert(msg, metadata) {
        this.show('alert', msg, metadata);
    }

    /**
     * @description Log level info - priority 3
     * @param {String} msg A message which will be not indexed by elastic
     * @param {Object} metadata A JSON which will be indexed by elastic
     */
    info(msg, metadata) {
        this.show('info', msg, metadata);
    }

    /**
     * @description Log level debug - priority 4
     * @param {String} msg A message which will be not indexed by elastic
     * @param {Object} metadata A JSON which will be indexed by elastic
     */
    debug(msg, metadata) {
        this.show('debug', msg, metadata);
    }

    /**
     * @description Log level log
     * @param {String} msg A message which will be not indexed by elastic
     * @param {Object} metadata A JSON which will be indexed by elastic
     */
    log(msg, metadata) {
        this.show('log', msg, metadata);
    }

    /**
     * @description Parse every property from error to string
     * @param {Error} err
     * @return {String} Striginfied error
     *
     */
    toError(err) {
        return JSON.stringify(err, Object.getOwnPropertyNames(err));
    }
}

module.exports = Log;
