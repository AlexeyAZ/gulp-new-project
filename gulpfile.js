const gulp = require('gulp');
const bs = require('browser-sync').create();
const del = require('del');
const sourcemaps = require('gulp-sourcemaps');
const pug = require('gulp-pug');
const bulkSass = require('gulp-sass-bulk-import');
const moduleImporter = require('sass-module-importer');
const sass = require('gulp-sass');
const wait = require('gulp-wait');
const prefix = require('gulp-autoprefixer');
const svgSprite = require('gulp-svg-sprite');
const svgmin = require('gulp-svgmin');
const cheerio = require('gulp-cheerio');
const replace = require('gulp-replace');
const eslint = require('gulp-eslint');
const devip = require('dev-ip');
const imagemin = require('gulp-imagemin');
const webpack = require('webpack');
const webpackStream = require('webpack-stream');

const webpackConfig = require('./webpack.config');

console.log(`ip list: ${devip()}`); // show all ip list. Need for browsersync host option

const folders = {
  build: 'build',
  src: 'src',
  static: 'static'
};

const paths = {
  static: [`${folders.static}/**/*.*`],
  html: [`${folders.src}/views/**/*.pug`],
  styles: [`${folders.src}/styles/**/*.scss`],
  scripts: [`${folders.src}/scripts/**/*.js`],
  images: [`${folders.src}/img/**/*.png`, `${folders.src}/img/**/*.jpg`, `${folders.src}/img/**/*.svg`, `!${folders.src}/img/svg_sprite/**/*.*`],
  spriteImages: [`${folders.src}/img/svg_sprite/**/*.svg`]
};

const localServer = {
  options: {
    server: {
      baseDir: `./${folders.build}`
    },
    open: true,
    notify: false,
    https: true
  }
};

const browserSync = () => bs.init(localServer.options);

const clean = () => del([folders.build]);

const runTask = (file, task) => {
  if (gulp.lastRun(task) <= file.stat.ctime) {
    return 0;
  }

  return gulp.lastRun(task);
};

const staticFolder = () =>
  gulp.src(paths.static)
    .pipe(gulp.dest(folders.build));

const html = done =>
  gulp.src(paths.html)
    .pipe(pug({
      pretty: true
    }))
    .on('error', done)
    .pipe(gulp.dest(folders.build))
    .pipe(bs.stream({ once: true }));

const styles = () =>
  gulp.src(paths.styles)
    .pipe(bulkSass())
    .pipe(wait(500))
    .pipe(sourcemaps.init())
    .pipe(sass({
      outputStyle: 'compressed',
      includePaths: [`${folders.src}/styles/`, `${folders.src}/components/`],
      importer: moduleImporter()
    })
      .on('error', sass.logError))
    .pipe(prefix('last 3 version', '> 1%', 'ie 10'))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest(`${folders.build}/styles`))
    .pipe(bs.stream());

const scriptsLint = () =>
  gulp.src(paths.scripts)
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failAfterError());

const scripts = done =>
  gulp.src([`${folders.src}/scripts/app.js`])
    .pipe(webpackStream(webpackConfig, webpack))
    .on('error', done)
    .pipe(gulp.dest(`${folders.build}/scripts`))
    .pipe(bs.stream());

const scriptsWithLint = gulp.series(scriptsLint, scripts);

const images = () =>
  gulp.src(paths.images, {since: file => runTask(file, images)})
    .pipe(imagemin())
    .pipe(gulp.dest(`${folders.build}/img`));

const svgSpriteBuild = () =>
  gulp.src(paths.spriteImages)
    .pipe(svgmin({
      js2svg: {
        pretty: true
      }
    }))
    .pipe(cheerio({
      run: $ => {
        $('[fill]').removeAttr('fill');
        $('[stroke]').removeAttr('stroke');
        $('[style]').removeAttr('style');
      },
      parserOptions: { xmlMode: true }
    }))
    .pipe(replace('&gt;', '>'))
    .pipe(svgSprite({
      mode: {
        symbol: {
          sprite: `../../../${folders.build}/img/sprite.svg`,
          render: {
            scss: {
              dest: '../../../src/styles/_sprite.scss',
              template: `${folders.src}/styles/_sprite_template.scss`
            }
          }
        }
      }
    }))
    .pipe(gulp.dest(`${folders.build}/img/`));

const watchFiles = () => {
  gulp.watch(paths.static, staticFolder);
  gulp.watch(paths.html, html);
  gulp.watch(paths.styles, styles);
  gulp.watch(paths.scripts, scriptsWithLint);
  gulp.watch(paths.images, images);
  gulp.watch(paths.spriteImages, svgSpriteBuild);
};

const watch = gulp.parallel(watchFiles, browserSync);

exports.default = gulp.series(clean, gulp.parallel(html, styles, scriptsWithLint, images, staticFolder, svgSpriteBuild, watch));
