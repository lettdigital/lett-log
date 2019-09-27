const _ = require('lodash');
const moment = require('moment');
const winston = require('winston');
require('winston-syslog').Syslog;

const ENV = process.env.NODE_ENV;
const SYSLOG_HOST = process.env.SYSLOG_HOST;
const SYSLOG_PROTOCOL = process.env.SYSLOG_PROTOCOL;
const SYSLOG_PORT = process.env.SYSLOG_PORT;
const SYSLOG_FACILITY = process.env.SYSLOG_FACILITY;
const SYSLOG_PATH = process.env.SYSLOG_PATH;
const SYSLOG_APP_NAME = process.env.APP_NAME;

const { format } = require('winston');
const { combine, label, printf, prettyPrint } = format;

const myFormat = printf(log => {
    return (
        moment()
            .utc()
            .format('YYYY-MM-DD HH:mm:ss,SSSZ') + `[${log.level.toUpperCase()}][${log.label}]:${log.message}`
    );
});

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
    constructor(defaultMeta = {}, { appName = '', host = '', protocol = '', port = 0, facility = '', path = '' } = {}) {
        this.logger = winston.createLogger({
            levels: winston.config.syslog.levels,
            level: 'debug',
            format: combine(label({ label: appName || SYSLOG_APP_NAME }), myFormat),
            transports: [
                new winston.transports.Console({
                    colorize: true,
                    timestamp: true,
                    format: combine(prettyPrint()),
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
