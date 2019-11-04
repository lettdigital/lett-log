const winston = require('winston');
require('winston-syslog').Syslog;

const SYSLOG_HOST = process.env.SYSLOG_HOST;
const SYSLOG_PROTOCOL = process.env.SYSLOG_PROTOCOL;
const SYSLOG_PORT = process.env.SYSLOG_PORT;
const SYSLOG_FACILITY = process.env.SYSLOG_FACILITY;
const SYSLOG_PATH = process.env.SYSLOG_PATH;
const SYSLOG_APP_NAME = process.env.APP_NAME;
const LOG_COLOR = process.env.LOG_COLOR;

const { format } = require('winston');
const { combine, label, printf, timestamp: timestampWinston, colorize } = format;

const myFormat = printf(log => {
    // Date format = YYYY-MM-DD HH:mm:ss,SSSZ
    const isoDate = new Date()
        .toISOString()
        .replace('T', ' ')
        .replace('.', ',');
    const logParsed = JSON.parse(log.message);
    return `${isoDate}[${log.level.toUpperCase()}][${log.label}]:[MSG](${logParsed.namespace})${logParsed.msg} (ARGS)=${JSON.stringify(
        logParsed.args,
    )}(ERROR)=${logParsed.stackTrace}[METADATA]${JSON.stringify(logParsed.metadata)}`;
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
 * @description A log class to manage Console and Syslog transports
 * @param {Object=} configuration A configuration object
 * @param {String} configuration.host Host to send logs
 * @param {String} configuration.appName An uniq name for app
 * @param {String} configuration.protocol A protocol to send logs (UPD or TCP)
 * @param {Number} configuration.port A port to connect
 * @param {String} configuration.facility An user
 * @param {String} connection.path A path to write logs
 * @param {String} [connection.timestamp=false] Toggle on/off timestamp
 * @param {String} [connection.colors=true] Toggle on/off console.log colors
 * @param {Object=} [defaultMeta={}] A default metadata to send on every log
 */
class Log {
    /**
     * @constructor
     */
    constructor(
        defaultMeta = {},
        { appName = '', host = '', protocol = '', port = 0, facility = '', path = '', timestamp = false, colors = true } = {},
    ) {
        if (!appName && !SYSLOG_APP_NAME) {
            throw 'No appName or environment variable SYSLOG_APP_NAME defined';
        }

        if (LOG_COLOR) {
            colors = LOG_COLOR;
        }

        winston.addColors(myCustomLevels.colors);
        this.logger = winston.createLogger({
            levels: myCustomLevels.levels,
            level: 'debug',
            format: combine(label({ label: appName || SYSLOG_APP_NAME }), myFormat),
            transports: [
                new winston.transports.Console({
                    format: combine(
                        colors ? colorize() : printf(log => log),
                        timestampWinston(),
                        printf(({ message, timestamp: timestampFromWinston, level }) => {
                            const ts = timestampFromWinston.slice(0, 19).replace('T', ' ');
                            const log = JSON.parse(message);

                            const backgroundWhite = colors ? '\x1b[47m' : '';
                            const foregroundBlack = colors ? '\x1b[30m' : '';
                            const foregroundMagenta = colors ? '\x1b[35m' : '';
                            const foregroundCyan = colors ? '\x1b[36m' : '';
                            const brightStyle = colors ? '\x1b[1m' : '';
                            const resetLogStyle = colors ? '\x1b[0m' : '';

                            return `${timestamp ? `[${ts}]` : ''}${brightStyle}[${level} @ ${log.namespace}]:${backgroundWhite}${foregroundBlack}${
                                log.msg
                            }${resetLogStyle}${
                                log.args && Object.keys(log.args).length
                                    ? Object.keys(log.args)
                                          .map(
                                              key =>
                                                  `\n${foregroundCyan}(${key})${resetLogStyle}=${
                                                      typeof log.args[key] === 'object' ? JSON.stringify(log.args[key], null, 2) : log.args[key]
                                                  }`,
                                          )
                                          .join('')
                                    : ''
                            }${
                                Object.keys(log.metadata).length
                                    ? `\n${foregroundCyan}[METADATA]${resetLogStyle}${JSON.stringify(log.metadata, null, 2)}`
                                    : ''
                            }${log.stackTrace ? `\n${foregroundMagenta}[STACKTRACE]${resetLogStyle}${log.stackTrace}` : ''}`;
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
     * @description A generic log function to handle all possible logs
     * @private
     * @param {String} type A log level
     * @param {String} namespace The log namespace
     * @param {String} msg A message like a commit
     * @param {Object=} metadata A JSON data with important information to find logs
     * @param {Error=} stackTrace An error stack
     */
    show({ namespace, type, msg, metadata = {}, stackTrace, args }) {
        if (!namespace) {
            throw 'namespace is a required argumment';
        }
        if (!type) {
            throw 'type is a required argumment';
        }
        if (!msg) {
            throw 'msg is a required argumment';
        }
        if (metadata && typeof metadata !== 'object') {
            throw 'metadata argumment must be an object';
        }
        let errEvent = undefined;
        if (stackTrace) {
            errEvent = this.toError(stackTrace);
        }

        const meta = {};
        Object.assign(meta, this.defaultMeta, metadata || {});

        this.logger.log(type, JSON.stringify({ msg, namespace, metadata: meta, stackTrace: errEvent, args }));
    }

    /**
     * @description Log level error - priority 0
     * @param {String} type A log level
     * @param {String} namespace The log namespace
     * @param {String} msg A message like a commit
     * @param {Object=} metadata A JSON data with important information to find logs
     * @param {Error=} stackTrace An error stack
     */
    error({ namespace, msg, metadata, stackTrace, ...args }) {
        this.show({ type: 'error', msg, namespace, metadata, stackTrace, args });
    }

    /**
     * @description Log level warn - priority 1
     * @param {String} type A log level
     * @param {String} namespace The log namespace
     * @param {String} msg A message like a commit
     * @param {Object=} metadata A JSON data with important information to find logs
     * @param {Error=} stackTrace An error stack
     */
    warn({ namespace, msg, metadata, stackTrace, ...args }) {
        this.show({ type: 'warning', namespace, msg, metadata, stackTrace, args });
    }

    /**
     * @description Log level info - priority 2
     * @param {String} type A log level
     * @param {String} namespace The log namespace
     * @param {String} msg A message like a commit
     * @param {Object=} metadata A JSON data with important information to find logs
     * @param {Error=} stackTrace An error stack
     */
    info({ namespace, msg, metadata, stackTrace, ...args }) {
        this.show({ type: 'info', namespace, msg, metadata, stackTrace, args });
    }

    /**
     * @description Log level debug - priority 3
     * @param {String} type A log level
     * @param {String} namespace The log namespace
     * @param {String} msg A message like a commit
     * @param {Object=} metadata A JSON data with important information to find logs
     * @param {Error=} stackTrace An error stack
     */
    debug({ namespace, msg, metadata, stackTrace, ...args }) {
        this.show({ type: 'debug', namespace, msg, metadata, stackTrace, args });
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
