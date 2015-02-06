var gulp = require('gulp'),
        jshint = require('gulp-jshint'),
        filelog = require('gulp-filelog'),
        rename = require('gulp-rename'),
        uglify = require('gulp-uglify'),
        jshint = require('gulp-jshint'),
	coveralls = require('gulp-coveralls'),
        options =  {
            globals: {
                exports: true,
                console: true,
                DEBUG: true,
                window: true
            },
            laxcomma: true,
            strict: false,
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

gulp.task('lint', function() {
  return gulp.src('eventhub.js')
    .pipe(jshint())
    .pipe(jshint.reporter('default'));
});

gulp.task('test', function () {
    var karma = require('karma').server;

    karma.start({
        autoWatch: false,
        browsers: [
            'PhantomJS'
        ],
        coverageReporter: {
            type : 'lcov',
            dir : 'coverage/'
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
            'dots',
            'junit',
            'coverage'
        ],
        singleRun: true
    });
});

gulp.task('coveralls', ['test'], function () {
    gulp.src('coverage/**/lcov.info')
      .pipe(coveralls());
});
