var gulp = require('gulp');
var tslint = require('gulp-tslint');
var exec = require('child_process').exec;
var jasmine = require('gulp-jasmine');
var gulp = require('gulp-help')(gulp);
var tsconfig = require('gulp-tsconfig-files');
var path = require('path');
var inject = require('gulp-inject');
var gulpSequence = require('gulp-sequence');
var del = require('del');
var dtsGenerator = require('dts-generator');
var ts = require('gulp-typescript');
var tsProject = ts.createProject('tsconfig.json');
var rimraf = require('rimraf');
require('dotbin');

var tsFilesGlob = (function (c) {
  return c.filesGlob || c.files || '**/*.ts';
})(require('./tsconfig.json'));

var appName = (function (p) {
  return p.name;
})(require('./package.json'));

gulp.task('default', ['build', 'watch']);

gulp.task('update-tsconfig', 'Update files section in tsconfig.json', function () {
  gulp.src(tsFilesGlob).pipe(tsconfig());
});

gulp.task('clean', 'Cleans the generated js files from lib directory', function () {
  return del([
    './lib/**/*'
  ]);
});

gulp.task('tslint', 'Lints all TypeScript source files', function () {
  return gulp.src(tsFilesGlob)
    .pipe(tslint())
    .pipe(tslint.report('verbose'));
});

gulp.task('gen-def', 'Generate a single .d.ts bundle containing external module declarations exported from TypeScript module files', function (cb) {
  return dtsGenerator.default({
    name: appName,
    project: '.',
    out: './lib/' + appName + '.d.ts',
    exclude: ['node_modules/**/*.d.ts', 'typings/**/*.d.ts', './test/**/*.d.ts']
  });
});

gulp.task('_build', 'INTERNAL TASK - Compiles all TypeScript source files', function (cb) {
   return tsProject.src('./src/**/*.ts')
    .pipe(ts(tsProject))
    .pipe(gulp.dest('./lib/'));
});

gulp.task('build', 'Compiles all TypeScript source files and updates module references', function(callback) {
    rimraf.sync('./lib');
    gulpSequence('tslint', ['update-tsconfig'], '_build')(callback);
});

gulp.task('test', 'Runs the Jasmine test specs', ['test-build'], function () {
    return gulp.src('./.test/**/*.js')
        .pipe(jasmine());
});

gulp.task('test-build', function() {
   rimraf.sync('./.test');
   return tsProject.src('./test/**/*.ts')
    .pipe(ts(tsProject))
    .pipe(gulp.dest('./.test/'));
});

gulp.task('watch', 'Watches ts source files and runs build on change', function () {
  gulp.watch('./src/**/*.ts', ['build', 'test']);
  gulp.watch('./test/**/*.ts', ['test']);
});
