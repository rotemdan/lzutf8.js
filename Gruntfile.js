/*
  This is a Grunt build script for release builds, stored in the ReleaseBuild/ folder. Debug builds, which also 
  include the testing and benchmark code, are generated within visual studio and stored in the LZUTF8/Build/ folder.
*/

module.exports = function (grunt)
{
	var releaseBuildBanner = '/*\n LZ-UTF8 v<%=pkg.version%>\n\n Copyright (c) 2014-2015, Rotem Dan \n Released under the MIT license.\n\n Build date: <%= grunt.template.today("yyyy-mm-dd") %> \n*/\n';

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
		},
		
		update_json:
		{
			options:
			{
				indent: '\t'
			},
			
			updateNPMPackageVersion:
			{
				src: './package.json',
				dest: './ReleaseBuild/package.json',
				fields: {'version': 'version'}
			}
		},
		
		copy:
		{
			copyReadmeToReleaseBuild:
			{
				files: [ {expand: true, src: ['./README.md'], dest: './ReleaseBuild'} ]
			},
		}
	});

	require('load-grunt-tasks')(grunt);

	// Default task(s).
	grunt.registerTask('default',
		[
			'shell:generateTypescriptReferenceFile',
			'ts:buildRelease',
			'concat:addBannerToReleaseBuild',
			'uglify:minifyReleaseBuild',
			'shell:deleteTypescriptReferenceFile',
			'update_json:updateNPMPackageVersion',
			'copy:copyReadmeToReleaseBuild'
		]);
};