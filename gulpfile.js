var gulp = require('gulp'),
        jshint = require('gulp-jshint'),
        filelog = require('gulp-filelog'),
        rename = require('gulp-rename'),
        uglify = require('gulp-uglify'),
        options =  {
            globals: {
                Eventhub: true,
                console: true,
                DEBUG: true
            },
            laxcomma: true,
            strict: true,
            validthis: true,
            undef: true
        };

gulp.task('default', function () {
    gulp.src('eventhub.js')
            .pipe(filelog())
            .pipe(jshint(options))
            .pipe(jshint.reporter('default'))
            .pipe(uglify())
            .pipe(rename('eventhub.min.js'))
            .pipe(gulp.dest('.'));
});

gulp.task('test', function () {
    var karma = require('karma').server;

    karma.start({
        autoWatch: false,
        browsers: [
            'PhantomJS'
        ],
        coverageReporter: {
            type : 'text',
            dir : 'target/coverage/'
        },
        frameworks: [
            'jasmine'
        ],
        files: [
            'eventhub.js',
            'tests/eventhub.spec.js'
        ],
        junitReporter: {
            outputFile: 'target/junit.xml'
        },
        preprocessors: {
            'eventhub.js': 'coverage'
        },
        reporters: [
            'junit',
            'coverage'
        ],
        singleRun: true
    });
});
