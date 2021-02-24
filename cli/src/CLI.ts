namespace LZUTF8 {
	export namespace CLI {
		export const start = function () {
			let compareByteArraysAndLogToConsole = (array1: Uint8Array, array2: Uint8Array): boolean => {
				if (array1.length !== array2.length) {
					log("Arrays did not match: Array 1 length is " + array1.length + ", Array 2 length is " + array2.length);

					return false;
				}

				for (let i = 0; i < array1.length; i++)
					if (array1[i] !== array1[i]) {
						log("Arrays did not match: array1[" + i + "] === " + array1[i] + ", array2[" + i + "] === " + array2[i]);
						return false;
					}

				return true;
			}

			let NodeFS: typeof fs = require("fs");

			function getFileSize(filePath: string): number {
				return NodeFS.statSync(filePath).size;
			}

			let cmdArguments = process.argv.slice(2);
			let command: string = cmdArguments[0];
			let sourceFilePath: string = cmdArguments[1];
			let destinationFilePath: string = cmdArguments[2];

			if (cmdArguments.length == 0) {
				log("Usage: node lzutf8-cli [command] [source] [destination?]")
				log("");
				log("Commands:");
				log("  c   Compress [source] to [destination]");
				log("  d   Decompress [source] to [destination]");
				log("  t   Test compression and decompression correctness using [source]");

				process.exit(1);
			}

			if (!sourceFilePath) {
				log("No source file specified");
				process.exit(1);
			}

			if (!NodeFS.existsSync(sourceFilePath)) {
				log("Source file \"" + sourceFilePath + "\" doesn't exist");
				process.exit(1);
			}

			if (command == "c") {
				if (!destinationFilePath)
					destinationFilePath = sourceFilePath + ".lzutf8";

				let sourceReadStream = NodeFS.createReadStream(sourceFilePath);
				let destWriteStream = NodeFS.createWriteStream(destinationFilePath);
				let compressionStream = createCompressionStream();

				let timer = new Timer();
				let resultStream = sourceReadStream.pipe(compressionStream).pipe(destWriteStream);

				resultStream.on("close", () => {
					let elapsedTime = timer.getElapsedTime();
					log("Compressed " + getFileSize(sourceFilePath) + " to " + getFileSize(destinationFilePath) + " bytes in " + elapsedTime.toFixed(2) + "ms (" + (getFileSize(sourceFilePath) / 1000000 / elapsedTime * 1000).toFixed(2) + "MB/s).");

					process.exit(0);
				});

			}
			else if (command == "d") {
				if (!destinationFilePath) {
					log("No destination file path specified");
					process.exit(1);
				}

				let sourceReadStream = NodeFS.createReadStream(sourceFilePath);
				let destWriteStream = NodeFS.createWriteStream(destinationFilePath);
				let decompressionStream = createDecompressionStream();

				let timer = new Timer();
				let resultStream = sourceReadStream.pipe(decompressionStream).pipe(destWriteStream);

				resultStream.on("close", () => {
					let elapsedTime = timer.getElapsedTime();
					log("Decompressed " + getFileSize(sourceFilePath) + " to " + getFileSize(destinationFilePath) + " bytes in " + elapsedTime.toFixed(2) + "ms (" + (getFileSize(destinationFilePath) / 1000000 / elapsedTime * 1000).toFixed(2) + "MB/s).");

					process.exit(0);
				});

			}
			else if (command == "t") {
				let temporaryFilePath = sourceFilePath + "." + (Math.random() * Math.pow(10, 8)).toFixed(0);

				let sourceReadStream = NodeFS.createReadStream(sourceFilePath);
				let destWriteStream = NodeFS.createWriteStream(temporaryFilePath);

				let compressionStream = createCompressionStream();
				let decompressionStream = createDecompressionStream();

				let timer = new Timer();
				let compressionCorrectnessTestStream = sourceReadStream.pipe(compressionStream).pipe(decompressionStream).pipe(destWriteStream);

				compressionCorrectnessTestStream.on("close", () => {
					let sourceFileContent = BufferTools.bufferToUint8Array(NodeFS.readFileSync(sourceFilePath));
					let temporaryFileContent = BufferTools.bufferToUint8Array(NodeFS.readFileSync(temporaryFilePath));

					NodeFS.unlinkSync(temporaryFilePath);

					let result = compareByteArraysAndLogToConsole(sourceFileContent, temporaryFileContent);

					if (result == true)
						log("Test result: *Passed* in " + timer.getElapsedTime().toFixed(2) + "ms");
					else
						log("Test result: *Failed* in " + timer.getElapsedTime().toFixed(2) + "ms");

					process.exit(0);
				});
			}
			else {
				log("Invalid command: \"" + command + "\"");
				process.exit(1);
			}
		}
	}
}
