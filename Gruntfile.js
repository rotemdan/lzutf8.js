path = require("path");

module.exports = function (grunt) {
	const banner = '/*!\n LZ-UTF8 v<%=pkg.version%>\n\n Copyright (c) 2018, Rotem Dan\n Released under the MIT license.\n\n Build date: <%= grunt.template.today("yyyy-mm-dd") %> \n\n Please report any issue at https://github.com/rotemdan/lzutf8.js/issues\n*/\n';
	const dummyTypeDeclarations = `declare namespace LZUTF8 {
    type Buffer = any;

    namespace stream {
        type Transform = any;
    }
}

export = LZUTF8

`
	const tsc = 'node node_modules/typescript/lib/tsc';

	// Project configuration.
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),

		shell: {
			buildDevelopment: {
				options: {
					stdin: false,
					failOnError: true,
				},

				command: tsc + ' --diagnostics',
			},

			buildProduction: {
				options: {
					stdin: false,
					failOnError: true,
				},

				command: tsc + ' -p tsconfig_production.json --diagnostics',
			},
		},

		mochaTest:
		{
			runTestsWithinDevelopmentBuild: {
				options: {
					ui: 'bdd',
					slow: -1,
					timeout: 5000,
					reporter: 'spec',
					quiet: false,
					clearRequireCache: false,
					require: 'expectations'
				},

				src: ['build/development/lzutf8.js']
			},

			runInstrumentedTests: {
				options: {
					ui: 'bdd',
					slow: -1,
					timeout: 5000,
					reporter: 'spec',
					quiet: false,
					clearRequireCache: false,
					require: 'expectations'
				},

				src: ['tests/coverage/instrument/build/development/lzutf8.js']
			}
		},

		env: {
			coverage: {
				APP_DIR_FOR_CODE_COVERAGE: 'tests/coverage/instrument/build/development'
			}
		},

		instrument: {
			files: 'build/development/lzutf8.js',
			options: {
				lazy: true,
				basePath: 'tests/coverage/instrument/'
			}
		},

		storeCoverage: {
			options: {
				dir: 'tests/coverage/reports'
			}
		},

		makeReport: {
			src: 'tests/coverage/reports/**/*.json',
			options: {
				type: 'lcov',
				dir: 'tests/coverage/reports',
				print: 'detail'
			}
		},

		clean: {
			temporaryTestFiles: ['tests/temp/*'],
		},

		concat: {
			addBannerToDevelopmentBuild: {
				src: ['build/development/lzutf8.js'],
				dest: 'build/development/lzutf8.js',

				options: {
					banner: banner
				}
			},

			addBannerToProductionBuild: {
				src: ['build/production/lzutf8.js'],
				dest: 'build/production/lzutf8.js',

				options: {
					banner: banner
				}
			},

			addBannerToMinifiedProductionBuild: {
				src: ['build/production/lzutf8.min.js'],
				dest: 'build/production/lzutf8.min.js',

				options: {
					banner: banner
				}
			},

			addDummyDeclarationsToDevelopmentDeclarationFile: {
				src: ['build/development/lzutf8.d.ts'],
				dest: 'build/development/lzutf8.d.ts',

				options: {
					banner: dummyTypeDeclarations
				}
			},

			addDummyDeclarationsToProductionDeclarationFile: {
				src: ['build/production/lzutf8.d.ts'],
				dest: 'build/production/lzutf8.d.ts',

				options: {
					banner: dummyTypeDeclarations
				}
			}
		},

		uglify: {
			minifyProductionBuild: {
				options: {
					preserveComments: true
				},
				files: {
					'build/production/lzutf8.min.js': ['build/production/lzutf8.js']
				}
			}
		},

		connect: {
			devserver: {
				options: {
					port: 8888,
					keepalive: true,
				}
			},

			phantomjsTestServer: {
				options: {
					port: 25398,
				}
			}
		},

		mocha_phantomjs: {
			runTests: {
				options: {
					urls: ['http://localhost:25398/tests/index.html']
				}
			}
		}
	});

	require('load-grunt-tasks')(grunt);

	grunt.registerTask('buildDevelopment',
		[
			'shell:buildDevelopment',
			'concat:addBannerToDevelopmentBuild',
			'concat:addDummyDeclarationsToDevelopmentDeclarationFile'
		]);

	grunt.registerTask('test',
		[
			'buildDevelopment',
			'mochaTest:runTestsWithinDevelopmentBuild',
			'clean:temporaryTestFiles'
		]);

	grunt.registerTask('test_coverage', [
		'buildDevelopment',
		'env:coverage',
		'instrument',
		'mochaTest:runInstrumentedTests',
		'storeCoverage',
		'makeReport'
	]);

	grunt.registerTask('testPhantomjs',
		[
			'buildDevelopment',
			'connect:phantomjsTestServer',
			'mocha_phantomjs:runTests'
		]);

	grunt.registerTask('buildProduction',
		[
			'shell:buildProduction',
			'concat:addDummyDeclarationsToProductionDeclarationFile',
			'concat:addBannerToProductionBuild',
			'uglify:minifyProductionBuild',
			'concat:addBannerToMinifiedProductionBuild'
		]);

	grunt.registerTask('startDevServer',
		[
			'connect:devserver',
		]);

	grunt.registerTask('default',
		[
			'buildDevelopment',
			'buildProduction'
		]);
};
