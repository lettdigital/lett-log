# lett-log

A log lib to send logs to elastic logs

## Connection

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
}
```

## Log level
```
0 - error
1 - warn
2 - alert
3 - info
4 - debug
```
