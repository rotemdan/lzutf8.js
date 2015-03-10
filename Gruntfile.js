/// <vs />
module.exports = function (grunt)
{
	var releaseBuildBanner = '/*\n LZ-UTF8 v<%=pkg.version%>\n\n Copyright (c) 2014-2015, Rotem Dan <rotemdan@gmail.com> \n Released under the MIT license.\n\n Build date: <%= grunt.template.today("yyyy-mm-dd") %> \n*/\n';
	
	// Project configuration.
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),

		shell:
		{
			generateDebugBuildReferencesFile:
			{
				options:
				{
					stdin: false
				},
				
				command: 'node ./TSBuildTools/GenerateTypescriptReferenceFile.js ./LZUTF8 ./_DebugBuildReferences.ts'
			},
			
			generateReleaseBuildReferencesFile:
			{
				options:
				{
					stdin: false
				},
				
				command: 'node ./TSBuildTools/GenerateTypescriptReferenceFile.js ./LZUTF8/Library ./_ReleaseBuildReferences.ts'
			},
		},
		
		clean: 
		{
			deleteDebugBuildReferencesFile: ["_DebugBuildReferences.ts"],
			deleteReleaseBuildReferencesFile: ["_ReleaseBuildReferences.ts"],
		},

		ts:
		{
			buildDebug:
			{
				src: './_DebugBuildReferences.ts',
				out: './LZUTF8/Build/lzutf8.js',
				options:
				{
					target: 'es3',
					module: 'commonjs',
					fast: 'never',
					sourceMap: true,
					removeComments: false
				}
			},
			
			buildRelease:
			{
				src: './_ReleaseBuildReferences.ts',
				out: './ReleaseBuild/lzutf8.js',
				options:
				{
					target: 'es3',
					module: 'commonjs',
					fast: 'never',
					sourceMap: false,
					removeComments: true
				}
			}
		},
		
		jasmine_nodejs:
		{
			options:
			{
				specNameSuffix: ".js"
			},
			
			runJasmineTestsWithinDebugBuild:
			{
				specs:
				[
					"./LZUTF8/Build/lzutf8.js"
				]
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

	grunt.registerTask('default',
		[
			// Generate debug build
			'shell:generateDebugBuildReferencesFile',
			'ts:buildDebug',
			'clean:deleteDebugBuildReferencesFile',	
			
			// Run tests included within the debug build
			'jasmine_nodejs:runJasmineTestsWithinDebugBuild',
			
			// Generate release build
			'shell:generateReleaseBuildReferencesFile',
			'ts:buildRelease',
			'clean:deleteReleaseBuildReferencesFile',			
			
			// Add banner to the release build
			'concat:addBannerToReleaseBuild',
			
			// Minify release build
			'uglify:minifyReleaseBuild',
			
			// Update NPM package version to version within the development package.json
			'update_json:updateNPMPackageVersion',
			
			// Copy the readme file to the release path
			'copy:copyReadmeToReleaseBuild'
		]);
		
	grunt.registerTask('test',
		[
			// Generate debug build
			'shell:generateDebugBuildReferencesFile',
			'ts:buildDebug',
			'clean:deleteDebugBuildReferencesFile',	
			
			// Run tests included within the debug build
			'jasmine_nodejs:runJasmineTestsWithinDebugBuild',
		]);		
};