
'use strict'

var gulp = require('gulp')
var del = require('del')
var livereload = require('gulp-livereload')

var SRC_JS_FILES = 'src/js/**/*.js'
var DST_JS_DIR = 'dist/js'
var BUILD_JS_DIR = 'public/js/build'

var plugins = require('gulp-load-plugins')( { DEBUG:false } )

var clean_function = () => {
	del(BUILD_JS_DIR)
	return del(DST_JS_DIR)
}

var reload_function = (done) => {
	return livereload.listen() || done()
}

function getTask(arg_file_name, arg_task_name)
{
	console.log('loading task [%s] from file [%s]', arg_task_name, arg_file_name)
	return require('./build/' + arg_file_name)(gulp, plugins, arg_task_name)
}



// **************************************************************************************************
// DEVAPT CORE BROWSER
// **************************************************************************************************
getTask('gulp_src_js_transpile', 'src_js_transpile')
getTask('gulp_dist_js_index_bundle', 'dist_js_index_bundle')

gulp.task('watch',
	() => {
		gulp.watch(SRC_JS_FILES, gulp.series('build', 'reload') )
		.on('change',
			(path, stats) => {
				console.log('File ' + path + ' was changed, running task watch...')	
			}
		)
		.on('unlink',
			(path, stats) => {
				console.log('File ' + path + ' was deleted, running task watch...')	
			}
		)
	}
)

gulp.task('default', gulp.series('src_js_transpile', 'dist_js_index_bundle') )
gulp.task('clean', clean_function)
gulp.task('reload', reload_function)
gulp.task('rebuild', gulp.series('clean', 'default') )
