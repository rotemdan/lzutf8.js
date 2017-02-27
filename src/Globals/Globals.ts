namespace LZUTF8 {
	export const runningInNodeJS = function () {
		return ((typeof process === "object") && (typeof process.versions === "object") && (typeof process.versions.node === "string"));
	}

	export const runningInMainNodeJSModule = function () {
		return runningInNodeJS() && require.main === module;
	}

	export const commonJSAvailable = function () {
		return typeof module === "object" && typeof module.exports === "object";
	}

	export const runningInWebWorker = function () {
		return typeof window === "undefined" && typeof self === "object" && typeof self.addEventListener === "function" && typeof self.close === "function";
	}

	export const runningInNodeChildProcess = function () {
		return runningInNodeJS() && typeof process.send === "function";
	}

	export const runningInNullOrigin = function (): boolean {
		if (typeof window !== "object" || typeof window.location !== "object")
			return false;

		return document.location.protocol !== 'http:' && document.location.protocol !== 'https:';
	}

	export const webWorkersAvailable = function (): boolean {
		if (typeof Worker !== "function" || runningInNullOrigin())
			return false;

		if (runningInNodeJS())
			return false;

		if (navigator && navigator.userAgent && navigator.userAgent.indexOf("Android 4.3") >= 0)
			return false;

		return true;
	}

	export const log = function (message: any, appendToDocument = false) {
		if (typeof console !== "object")
			return;

		console.log(message);

		if (appendToDocument && typeof document == "object")
			document.body.innerHTML += message + "<br/>";
	}

	export const createErrorMessage = function (exception: any, title = "Unhandled exception"): string {
		if (exception == null)
			return title;

		title += ": ";

		if (typeof exception.content === "object") {
			if (runningInNodeJS()) {
				return title + exception.content.stack;
			}
			else {
				const exceptionJSON = JSON.stringify(exception.content);

				if (exceptionJSON !== "{}")
					return title + exceptionJSON;
				else
					return title + exception.content;
			}
		}
		else if (typeof exception.content === "string") {
			return title + exception.content;
		}
		else {
			return title + exception;
		}
	}

	export const printExceptionAndStackTraceToConsole = (exception: any, title = "Unhandled exception") => {
		log(createErrorMessage(exception, title));
	}

	export const getGlobalObject = function (): any {
		if (typeof global === "object")
			return global;
		else if (typeof window === "object")
			return window;
		else if (typeof self === "object")
			return self;
		else
			return {};
	}

	export const toString = Object.prototype.toString;

	if (commonJSAvailable())
		module.exports = LZUTF8;
}
