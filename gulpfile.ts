import * as gulp from 'gulp';
import run from 'gulp-run-command';
const del = require('del');
const vinylPaths = require('vinyl-paths');

const paths = {
    src: 'src/',
    build: 'dist/'
};

gulp.task('clean', () => {
    return gulp.src(`${paths.build}*`)
        .pipe(vinylPaths(del));
});

gulp.task('webpack', async () => {
	run('yarn webpack')();
});

gulp.task('copy-resources', function () {
	return gulp.src([
		`${paths.src}/images/**/*.png`,
		`${paths.src}/images/**/*.json`,

		`${paths.src}/materials/*.json`,
		`${paths.src}/meshes/*.json`,
		`${paths.src}/meshes/*.staticmesh`,
		`${paths.src}/meshes/*.morphedmesh`,
		`${paths.src}/scenes/*.json`
	],{
	"base" : paths.src
	})
	.pipe(gulp.dest(paths.build));
});

gulp.task('copy-html', function () {
    return gulp.src(`templates/index.html`)
        .pipe(gulp.dest(paths.build));
});

gulp.task('watch-scripts', () => {
	gulp.watch(`${paths.src}**/*.ts`);
});

gulp.task('server', () => {
	run(`http-server -c-1 ${paths.build}`)();
});

gulp.task('default', gulp.series('clean', 'webpack', 'copy-resources', 'copy-html'));

gulp.task('run', gulp.parallel('server'));

gulp.task('dev-env', () => {
	run('gulp')();
	run('gulp run')();
});