namespace LZUTF8 {
	export namespace WebWorker {
		type WorkerMessageCompress = {
			token: string;
			type: "compress";
			data: string | Uint8Array;
			inputEncoding?: UncompressedEncoding;
			outputEncoding?: CompressedEncoding;
		}

		type WorkerMessageDecompress = {
			token: string;
			type: "decompress";
			data: Uint8Array | string;
			inputEncoding?: CompressedEncoding;
			outputEncoding?: DecompressedEncoding;
		}

		type WorkerMessageCompressionResult = {
			token: string;
			type: "compressionResult";
			data: Uint8Array | string;
			encoding: CompressedEncoding;
		}

		type WorkerMessageDecompressionResult = {
			token: string;
			type: "decompressionResult";
			data: string | Uint8Array;
			encoding: DecompressedEncoding;
		}

		type WorkerMessageError = {
			token: string;
			type: "error";
			error: string;
		}

		type WorkerMessage = WorkerMessageCompress | WorkerMessageDecompress;
		export let globalWorker: Worker;
		export let scriptURI: string | undefined;

		export const compressAsync = function (input: any, options: CompressionOptions, callback: (result?: Uint8Array | Buffer | string, error?: Error) => void) {
			if (options.inputEncoding == "ByteArray") {
				if (!(input instanceof Uint8Array)) {
					callback(undefined, new TypeError("compressAsync: input is not a Uint8Array"));
					return;
				}
			}

			const request: WorkerMessageCompress = {
				token: Math.random().toString(),
				type: "compress",
				data: input,
				inputEncoding: options.inputEncoding,
				outputEncoding: options.outputEncoding
			};

			const responseListener = (e: any) => {
				const response: WorkerMessageCompress | WorkerMessageError = e.data;

				if (!response || response.token != request.token)
					return;

				WebWorker.globalWorker.removeEventListener("message", responseListener);

				if (response.type == "error")
					callback(undefined, new Error(response.error));
				else
					callback(response.data);
			}

			WebWorker.globalWorker.addEventListener("message", responseListener);
			WebWorker.globalWorker.postMessage(request, []);
		}

		export const decompressAsync = function (input: string | Uint8Array, options: DecompressionOptions, callback: (result?: string | Uint8Array, error?: Error) => void) {
			const request: WorkerMessageDecompress = {
				token: Math.random().toString(),
				type: "decompress",
				data: input,
				inputEncoding: options.inputEncoding,
				outputEncoding: options.outputEncoding
			};

			const responseListener = (e: any) => {
				const response: WorkerMessageDecompress | WorkerMessageError = e.data;

				if (!response || response.token != request.token)
					return;

				WebWorker.globalWorker.removeEventListener("message", responseListener);

				if (response.type == "error")
					callback(undefined, new Error(response.error));
				else
					callback(response.data);
			};

			WebWorker.globalWorker.addEventListener("message", responseListener);
			WebWorker.globalWorker.postMessage(request, []);
		}

		// Worker internal handler
		export const installWebWorkerIfNeeded = function () {
			if (typeof self == "object" && self.document === undefined && self.addEventListener != undefined) {
				self.addEventListener("message", (e: MessageEvent) => {
					const request: WorkerMessage = e.data;

					if (request.type == "compress") {
						let compressedData: Uint8Array | string;

						try {
							compressedData = <Uint8Array | string>compress(request.data, { outputEncoding: request.outputEncoding });
						}
						catch (e) {
							self.postMessage(<WorkerMessageError>{ token: request.token, type: "error", error: createErrorMessage(e) }, <any>[]);
							return;
						}

						const response: WorkerMessageCompressionResult = {
							token: request.token,
							type: "compressionResult",
							data: compressedData,
							encoding: request.outputEncoding!,
						};

						if (response.data instanceof Uint8Array && navigator.appVersion.indexOf("MSIE 10") === -1)
							self.postMessage(response, <any>[response.data.buffer]);
						else
							self.postMessage(response, <any>[]);
					}
					else if (request.type == "decompress") {
						let decompressedData: string | Uint8Array;

						try {
							decompressedData = <string | Uint8Array>decompress(request.data, { inputEncoding: request.inputEncoding, outputEncoding: request.outputEncoding });
						} catch (e) {
							self.postMessage(<WorkerMessageError>{ token: request.token, type: "error", error: createErrorMessage(e) }, <any>[]);
							return;
						}

						const response: WorkerMessageDecompressionResult =
							{
								token: request.token,
								type: "decompressionResult",
								data: decompressedData,
								encoding: request.outputEncoding!,
							};

						if (response.data instanceof Uint8Array && navigator.appVersion.indexOf("MSIE 10") === -1)
							self.postMessage(response, <any>[response.data.buffer]);
						else
							self.postMessage(response, <any>[]);
					}
				});

				self.addEventListener("error", (e: ErrorEvent) => {
					log(createErrorMessage(e.error, "Unexpected LZUTF8 WebWorker exception"));
				});
			}
		}

		export const createGlobalWorkerIfNeeded = function (): boolean {
			if (WebWorker.globalWorker)
				return true;

			if (!webWorkersAvailable())
				return false;

			if (!WebWorker.scriptURI && typeof document === "object") {
				const scriptElement = document.getElementById("lzutf8");
				if (scriptElement != null)
					WebWorker.scriptURI = scriptElement.getAttribute("src") || undefined;
			}

			if (WebWorker.scriptURI) {
				WebWorker.globalWorker = new Worker(WebWorker.scriptURI);
				return true;
			} else {
				return false;
			}
		}

		export const terminate = function () {
			if (WebWorker.globalWorker) {
				WebWorker.globalWorker.terminate();
				WebWorker.globalWorker = <any>undefined;
			}
		}
	}

	// Install listener during script load if inside a worker
	WebWorker.installWebWorkerIfNeeded();
}
