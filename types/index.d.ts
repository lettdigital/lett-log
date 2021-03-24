export interface Config {
  appName?: string
  host?: string
  protocol?: string
  port?: number
  facility?: string
  path?: string
  timestamp?: boolean
  colors?: boolean
}

export interface LogParams {
  type?: string
  namespace: string
  msg: string
  metadata: Record<string, unknown>
  stackTrace: Error
  args: Record<string, unknown>
}

export type GenericMeta = Record<string, unknown>

declare class Log {
  /**
   * @constructor
   */
  constructor(defaultMeta?: GenericMeta, params?: Config)

  /**
   * @description Override default metadata object
   * @param {Object} defaultMeta A default metadata to send on every log
   */
  setDefaultMeta(defaultMeta: GenericMeta): void

  /**
   * @deprecated
   * @description Override default metadata object
   * @param {Object} defaultMeta A default metadata to send on every log
   */
  setParams(defaultMeta: GenericMeta): void

  /**
   * @description Assing new properties to metadata object and override if already exists one or more properties
   * @param {Object} defaultMeta A default metadata to bind
   */
  assingToDefaultMeta(defaultMeta: GenericMeta): void

  /**
   * @description A GenericMeta log function to handle all possible logs
   * @private
   * @param {String} type A log level
   * @param {String} namespace The log namespace
   * @param {String} msg A message like a commit
   * @param {Object=} metadata A JSON data with important information to find logs
   * @param {Error=} stackTrace An error stack
   */
  show(params: LogParams): void

  /**
   * @description Log level error - priority 0
   * @param {String} type A log level
   * @param {String} namespace The log namespace
   * @param {String} msg A message like a commit
   * @param {Object=} metadata A JSON data with important information to find logs
   * @param {Error=} stackTrace An error stack
   */
  error(params: LogParams): void

  /**
   * @description Log level warn - priority 1
   * @param {String} type A log level
   * @param {String} namespace The log namespace
   * @param {String} msg A message like a commit
   * @param {Object=} metadata A JSON data with important information to find logs
   * @param {Error=} stackTrace An error stack
   */
  warn(params: LogParams): void

  /**
   * @description Log level info - priority 2
   * @param {String} type A log level
   * @param {String} namespace The log namespace
   * @param {String} msg A message like a commit
   * @param {Object=} metadata A JSON data with important information to find logs
   * @param {Error=} stackTrace An error stack
   */
  info(params: LogParams): void

  /**
   * @description Log level debug - priority 3
   * @param {String} type A log level
   * @param {String} namespace The log namespace
   * @param {String} msg A message like a commit
   * @param {Object=} metadata A JSON data with important information to find logs
   * @param {Error=} stackTrace An error stack
   */
  debug(params: LogParams): void

  /**
   * @description Parse every property from error to string
   * @param {Error} err
   * @return {String} Striginfied error
   *
   */
  toError(error: Error): string
}

export = Log
