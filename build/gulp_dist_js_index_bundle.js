
'use strict'

var source = require('vinyl-source-stream')
var buffer = require('vinyl-buffer')
var gutil = require('gulp-util');
var browserify = require('browserify')

var DST_PUBLIC_DIR = 'public/js/build'
var DST_PUBLIC_INDEX = './dist/js/index.js'
var DST_PUBLIC_BUNDLE = 'devapt-core-browser.js'


const browserify_settings = {
	entries: [DST_PUBLIC_INDEX]
}



module.exports = function (gulp, plugins, arg_task_name)
{
	var bundler = browserify(browserify_settings)

	gulp.task(arg_task_name, bundle)

	function bundle() {
		bundler
			.ignore('sequelize')
			.ignore('restify')
			.ignore('winston')
			.ignore('passport')
			.ignore('socket.io')
			.ignore('node-forge')
			
			.require('./dist/js/runtime/client_runtime.js', { expose:'client_runtime' } )
			.require('./dist/js/index.js', { expose:'devapt' } )
			.require('./public/js/forge.min.js', { expose:'forge-browser' } )
		
		var stream = bundler.bundle()
			.on('error', gutil.log.bind(gutil, 'Browserify Error'))
			.on('error',
				function(err)
				{
					console.error(err)
					this.emit('end')
				}
			)
			.pipe( source(DST_PUBLIC_BUNDLE) )
			.pipe( new buffer() )
			.pipe( plugins.sourcemaps.init() )
			.pipe( plugins.sourcemaps.write('.') )
			.pipe( gulp.dest(DST_PUBLIC_DIR) )
			.pipe( plugins.livereload() )
		
		return stream
	}
}
