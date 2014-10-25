/*
  This is a Grunt build script for release builds. Debug builds, which also 
  include the testing and benchmark code, are generated within visual studio.
*/

module.exports = function (grunt)
{
	var releaseBuildBanner = '/*\n LZ-UTF8 v<%=pkg.version%>\n\n Copyright (c) 2014, Rotem Dan \n Released under the GNU Affero GPL v3.0 license.\n\n Build date: <%= grunt.template.today("yyyy-mm-dd") %> \n*/\n';

	// Project configuration.
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),

		shell:
		{
			generateTypescriptReferenceFile:
			{
				command: 'node ./TSBuildTools/GenerateTypescriptReferenceFile.js ./LZUTF8/Library ./_ReleaseBuildReferences.ts'
			},

			deleteTypescriptReferenceFile:
			{
				command: 'del _ReleaseBuildReferences.ts'
			}
		},

		ts:
		{
			buildRelease:
			{
				src: './_ReleaseBuildReferences.ts',
				out: './ReleaseBuild/lzutf8.js',
				options:
				{
					target: 'es5',
					module: 'commonjs',
					fast: 'never',
					sourceMap: false
				}
			}
		},

		concat:
		{
			addBannerToReleaseBuild:
			{
				src: ['./ReleaseBuild/lzutf8.js'],
				dest: './ReleaseBuild/lzutf8.js',

				options:
				{
					banner: releaseBuildBanner
				}
			}
		},

		uglify:
		{
			minifyReleaseBuild:
			{
				src: './ReleaseBuild/lzutf8.js',
				dest: './ReleaseBuild/lzutf8.min.js',

				options:
				{
					mangle: true,
					compress: true,
					banner: releaseBuildBanner
				}
			}
		}
	});

	grunt.loadNpmTasks('grunt-shell');
	grunt.loadNpmTasks('grunt-ts');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-uglify');


	// Default task(s).
	grunt.registerTask('default',
		[
			'shell:generateTypescriptReferenceFile',
			'ts:buildRelease',
			'concat:addBannerToReleaseBuild',
			'uglify:minifyReleaseBuild',
			'shell:deleteTypescriptReferenceFile'
		]);
};