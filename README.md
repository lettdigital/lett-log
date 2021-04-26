# lett-log

A simple library to manage logs using winston and syslog.

## Documentation

:blue_book: [https://lettdigital.github.io/lett-log/docs](https://lettdigital.github.io/lett-log/docs/)

## Setup

### Connection

There is two ways to set a connection, the **first one always override de second one**!

### 1 - Define Connection in run time

```js
import Log from 'lett-log';

const log = new Log({
  host: "",
  protocol: "",
  port: "",
  facility: "",
  path: "",
  appName: "",
  colors: true,
  timestamp: false,
});
```

### 2 - Environment Variables

```json
{
  "SYSLOG_HOST": "",
  "SYSLOG_PROTOCOL": "",
  "SYSLOG_PORT": "",
  "SYSLOG_FACILITY": "",
  "SYSLOG_PATH": "",
  "APP_NAME": "",
  "LOG_COLOR": ""
}
```

## How to use

> The `appName` or `APP_NAME` should be a CONSTANT_CASE string.

### Log level

There are 4 log levels:
```
0 - error
1 - warn
2 - info
3 - debug
```

Let's explain each one:
1. :x: **error**: A crash application error.
  - Example: `Missing required environment variable`
2. :warning: **warn**: A error with no side effects
  - Example: `The image downalod failed`
3. :information_source: **info**: Informations about application lifecycle
  - Example: `Express successfully started`
4. :large_blue_diamond: **debug**: Other informations meaningful
  - Example: `Running query on database`

### Log paramenters

Checkout the full documentation
