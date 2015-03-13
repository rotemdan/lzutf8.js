/// <vs SolutionOpened='watch' />
module.exports = function (grunt)
{
	function generateTypeScriptReferencesFile(filters, outFilename)
	{
		var fileNames = [];
		
		for (var i=0; i < filters.length; i++)
			fileNames = fileNames.concat(grunt.file.expand(filters[i]))
		
		function getPriorityByFileExtension(filePath)
		{
			if (/.+\.d.ts$/.test(filePath))
				return 0;
			else if (/.+\.ext.ts$/.test(filePath))
				return 1;
			else if (/.+\.spec.ts$/.test(filePath))
				return 3;
			else
				return 2;
		}
		
		fileNames.sort(function (fileName1, fileName2) { return getPriorityByFileExtension(fileName1) - getPriorityByFileExtension(fileName2) });
		fileContent = fileNames.reduce(function(result, filePath) {	return result + "/// <reference path=\"" + filePath + "\"/>\n";	}, "");

		grunt.file.write(outFilename, fileContent);
		grunt.log.writeln(fileNames.join("\n"));
	}
	
	var releaseBuildBanner = '/*\n LZ-UTF8 v<%=pkg.version%>\n\n Copyright (c) 2014-2015, Rotem Dan <rotemdan@gmail.com> \n Released under the MIT license.\n\n Build date: <%= grunt.template.today("yyyy-mm-dd") %> \n*/\n';
	
	// Project configuration.
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),

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
			},
			
			updateBowerPackageVersion:
			{
				src: './package.json',
				dest: './bower.json',
				fields: {'version': 'version'}
			},
		},
		
		copy:
		{
			copyReadmeToReleaseBuild:
			{
				files: [ {expand: true, src: ['./README.md'], dest: './ReleaseBuild'} ]
			},
		},
		
		watch:
		{
			options:
			{
				dateFormat: function(time)
				{
					var currentDate = new Date();
					grunt.log.writeln('Completed in ' + (time.toFixed(3) + 's at ' + currentDate.toTimeString()));
				},				
			},
			
			typescriptFiles:
			{
				files: ["LZUTF8/**/*.ts"],
				
				tasks: ['buildDebug'],
				
				options: 
				{
					spawn: false,
					//event: 'changed'
				}
			},
			
			configFiles:
			{
				files: ["Gruntfile.js"],
				
				options:
				{
					reload: true
				}
			},
		},		
	});
	
	require('load-grunt-tasks')(grunt);

	grunt.registerTask('generateDebugBuildReferencesFile', 'Generate debug build references file', function() 
	{
		generateTypeScriptReferencesFile(["./LZUTF8/**/*.ts"], "./_DebugBuildReferences.ts");
	});
	
	grunt.registerTask('generateReleaseBuildReferencesFile', 'Generate release build references file', function() 
	{
		generateTypeScriptReferencesFile(["./LZUTF8/Library/**/*.ts"], "./_ReleaseBuildReferences.ts");
	});	

	grunt.registerTask('default',
		[
			// Generate debug build
			'generateDebugBuildReferencesFile',
			'ts:buildDebug',
			'clean:deleteDebugBuildReferencesFile',	
			
			// Run tests included within the debug build
			'jasmine_nodejs:runJasmineTestsWithinDebugBuild',
			
			// Generate release build
			'generateReleaseBuildReferencesFile',
			'ts:buildRelease',
			'clean:deleteReleaseBuildReferencesFile',			
			
			// Add banner to the release build
			'concat:addBannerToReleaseBuild',
			
			// Minify release build
			'uglify:minifyReleaseBuild',
			
			// Update NPM and bower package versions to version within the development package.json
			'update_json:updateNPMPackageVersion',
			'update_json:updateBowerPackageVersion',
			
			// Copy the readme file to the release path
			'copy:copyReadmeToReleaseBuild'
		]);
		
	grunt.registerTask('buildDebug',
		[
			// Generate debug build
			'generateDebugBuildReferencesFile',
			'ts:buildDebug',
			'clean:deleteDebugBuildReferencesFile',
		]);

	grunt.registerTask('test',
		[
			// Generate debug build
			'buildDebug',
			
			// Run tests included within the debug build
			'jasmine_nodejs:runJasmineTestsWithinDebugBuild',
		]);
};