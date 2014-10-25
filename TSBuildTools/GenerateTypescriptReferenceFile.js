var App;
(function (App) {
    var NodeFS = require("fs");
    var NodePath = require("path");

    var FileSystem = (function () {
        function FileSystem() {
        }
        FileSystem.readFileSync = function (path, options) {
            return NodeFS.readFileSync(path, options);
        };

        FileSystem.writeFileSync = function (path, data, options) {
            NodeFS.writeFileSync(path, data, options);
        };

        FileSystem.readDirectorySync = function (path) {
            return NodeFS.readdirSync(path);
        };

        FileSystem.getFileInformationSync = function (path) {
            return NodeFS.statSync(path);
        };

        FileSystem.findAllFiles = function (predicate, basePath) {
            var _this = this;
            if (typeof basePath === "undefined") { basePath = "."; }
            var matchingFilesFound = [];

            var files = FileSystem.readDirectorySync(basePath);

            files.forEach(function (fileName) {
                var currentFilePath = basePath + "/" + fileName;

                var currentFileInformation = FileSystem.getFileInformationSync(currentFilePath);

                if (currentFileInformation.isDirectory()) {
                    var matchingFilesInDirectory = _this.findAllFiles(predicate, currentFilePath);

                    if (matchingFilesInDirectory.length > 0)
                        matchingFilesInDirectory.forEach(function (matchingFile) {
                            return matchingFilesFound.push(matchingFile);
                        });
                } else if (currentFileInformation.isFile() && predicate(currentFilePath))
                    matchingFilesFound.push(currentFilePath);
            });

            return matchingFilesFound;
        };
        return FileSystem;
    })();
    App.FileSystem = FileSystem;

    var TypescriptReferenceFileGenerator = (function () {
        function TypescriptReferenceFileGenerator() {
        }
        TypescriptReferenceFileGenerator.start = function () {
            if (process.argv.length < 4) {
                console.log("\nUsage:\n node GenerateTypescriptReferences [Base path] [Output filename]");
                return;
            }

            var thisScriptFileName = NodePath.basename(require.main.filename, ".js");

            // Find all TypeScript files (but not automated tests) in path tree
            var predicate = function (fileName) {
                return NodePath.extname(fileName) == ".ts";
            };
            var typescriptFiles = FileSystem.findAllFiles(predicate, process.argv[2]);

            // Sort by TypeScript subtypes
            typescriptFiles.sort(function (a, b) {
                return TypescriptReferenceFileGenerator.getSortingValueByFileExtension(a) - TypescriptReferenceFileGenerator.getSortingValueByFileExtension(b);
            });

            // Create the output reference file
            var typescriptReferenceFileContent = "";
            var outputFilePath = process.argv[3];

            typescriptFiles = typescriptFiles.filter(function (filePath) {
                return filePath != outputFilePath;
            });

            typescriptReferenceFileContent = typescriptFiles.reduce(function (result, filePath) {
                if (NodePath.basename(filePath, ".ts") == thisScriptFileName)
                    return result + "";

                return result + "/// <reference path=\"" + filePath + "\"/>\n";
            }, "");

            FileSystem.writeFileSync(outputFilePath, typescriptReferenceFileContent);

            console.log("Written to " + outputFilePath + ":");
            console.log(typescriptReferenceFileContent);
        };

        TypescriptReferenceFileGenerator.getSortingValueByFileExtension = function (filePath) {
            if (/.+\.d.ts$/.test(filePath))
                return 0;
            else if (/.+\.ext.ts$/.test(filePath))
                return 1;
            else if (/.+\.spec.ts$/.test(filePath))
                return 3;
            else
                return 2;
        };
        return TypescriptReferenceFileGenerator;
    })();

    TypescriptReferenceFileGenerator.start();
})(App || (App = {}));
//# sourceMappingURL=GenerateTypeScriptReferenceFile.js.map
