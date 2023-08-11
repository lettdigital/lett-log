Use the following `Gruntfile.js` to migrate the the version 1 to version 2:

```js
module.exports = function(grunt) {
    grunt.initConfig({
        prependString: {
            options: {
                prependText: function(filepath) {
                    var filename = filepath.substring(filepath.lastIndexOf('/') + 1);
                    return `const namespace = '${filename}';\n`;
                },
                search: /this\.log\.debug\((.*?)\);/g, // Regex to match the pattern
                replacement: 'this.log.debug({ namespace, msg: $1 });', // Replacement text
            },
            prepend_namespace: {
                files: [
                    {
                        expand: true,
                        cwd: 'api', // Source directory
                        src: ['**/*.js'], // File patterns to match
                        dest: 'api2/', // Destination directory
                    },
                ],
            },
        },
    });

    grunt.registerMultiTask('prependString', function() {
        var options = this.options();

        this.files.forEach(function(file) {
            file.src.forEach(function(filepath) {
                var content = grunt.file.read(filepath);
                var prependedText = options.prependText(filepath);
                if (content.indexOf('this.log') !== -1) {
                    // Perform the replacement using the provided regex and replacement text
                    content = content.replace(options.search, options.replacement);
                    content = prependedText + content;
                    grunt.file.write(file.dest, content);
                }
            });
        });
    });

    grunt.registerTask('default', ['prependString:prepend_namespace']);
};
```
> Note this script only replace `log.debug`, change the search param to change another matches if necessary.
