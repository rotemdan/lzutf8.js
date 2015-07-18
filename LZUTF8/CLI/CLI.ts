module LZUTF8
{
	export class CLI
	{
		static start()
		{
			var compareByteArraysAndLogToConsole = (array1: Uint8Array, array2: Uint8Array): boolean =>
			{
				if (array1.length !== array2.length)
				{
					console.log("Arrays did not match: Array 1 length is " + array1.length + ", Array 2 length is " + array2.length);

					return false;
				}

				for (var i = 0; i < array1.length; i++)
					if (array1[i] !== array1[i])
					{
						console.log("Arrays did not match: array1[" + i + "] === " + array1[i] + ", array2[" + i + "] === " + array2[i]);
						return false;
					}

				return true;
			}

			var NodeFS: typeof fs = require("fs");

			function getFileSize(filePath): number
			{
				return NodeFS.statSync(filePath).size;
			}

			var cmdArguments = process.argv.slice(2);
			var command: string = cmdArguments[0];
			var sourceFilePath: string = cmdArguments[1];
			var destinationFilePath: string = cmdArguments[2];

			if (cmdArguments.length == 0)
			{
				console.log("Usage: node lz-utf8-cli [command] [source] [destination?]")
				console.log();
				console.log("Commands:");
				console.log("  c   Compress [source] to [destination]");
				console.log("  d   Decompress [source] to [destination]");
				console.log("  t   Test compression and decompression correctness using [source]");

				process.exit(1);
			}

			if (!sourceFilePath)
			{
				console.log("No source file specified");
				process.exit(1);
			}

			if (!NodeFS.existsSync(sourceFilePath))
			{
				console.log("Source file \"" + sourceFilePath + "\" doesn't exist");
				process.exit(1);
			}

			if (command != "t" && !destinationFilePath)
			{
				console.log("No destination file specified");
				process.exit(1);
			}

			if (command == "c")
			{
				var sourceReadStream = NodeFS.createReadStream(sourceFilePath);
				var destWriteStream = NodeFS.createWriteStream(destinationFilePath);
				var compressionStream = createCompressionStream();

				var timer = new Timer();
				var resultStream = sourceReadStream.pipe(compressionStream).pipe(destWriteStream);

				resultStream.on("close", () =>
				{
					var elapsedTime = timer.getElapsedTime();
					console.log("Compressed " + getFileSize(sourceFilePath) + " to " + getFileSize(destinationFilePath) + " bytes in " + elapsedTime.toFixed(2) + "ms (" + (getFileSize(sourceFilePath) / 1000000 / elapsedTime * 1000).toFixed(2) + "MB/s).");
				});
			}
			else if (command == "d")
			{
				var sourceReadStream = NodeFS.createReadStream(sourceFilePath);
				var destWriteStream = NodeFS.createWriteStream(destinationFilePath);
				var decompressionStream = createDecompressionStream();

				var timer = new Timer();
				var resultStream = sourceReadStream.pipe(decompressionStream).pipe(destWriteStream);

				resultStream.on("close", () =>
				{
					var elapsedTime = timer.getElapsedTime();
					console.log("Decompressed " + getFileSize(sourceFilePath) + " to " + getFileSize(destinationFilePath) + " bytes in " + elapsedTime.toFixed(2) + "ms (" + (getFileSize(destinationFilePath) / 1000000 / elapsedTime * 1000).toFixed(2) + "MB/s).");
				});
			}
			else if (command == "t")
			{
				var temporaryFilePath = sourceFilePath + "." + (Math.random() * Math.pow(10, 8)).toFixed(0);

				var sourceReadStream = NodeFS.createReadStream(sourceFilePath);
				var destWriteStream = NodeFS.createWriteStream(temporaryFilePath);

				var compressionStream = createCompressionStream();
				var decompressionStream = createDecompressionStream();

				var timer = new Timer();
				var compressionCorrectnessTestStream = sourceReadStream.pipe(compressionStream).pipe(decompressionStream).pipe(destWriteStream);

				compressionCorrectnessTestStream.on("close", () =>
				{
					var sourceFileContent = new Uint8Array(<any> NodeFS.readFileSync(sourceFilePath));
					var temporaryFileContent = new Uint8Array(<any> NodeFS.readFileSync(temporaryFilePath));

					NodeFS.unlinkSync(temporaryFilePath);

					var result = compareByteArraysAndLogToConsole(sourceFileContent, temporaryFileContent);

					if (result == true)
						console.log("Test result: *Passed* in " + timer.getElapsedTime().toFixed(2) + "ms");
					else
						console.log("Test result: *Failed* in " + timer.getElapsedTime().toFixed(2) + "ms");
				});
			}
			else
			{
				console.log("Invalid command: \"" + command + "\"");
				process.exit(1);
			}
		}
	}
}