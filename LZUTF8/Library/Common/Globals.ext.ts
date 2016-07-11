namespace LZUTF8
{
	export function runningInNodeJS()
	{
		return ((typeof process === "object") && (typeof process.versions === "object") && (typeof process.versions.node === "string"));
	}

	export function runningInMainNodeJSModule()
	{
		return runningInNodeJS() && require.main === module;
	}

	export function commonJSSupported()
	{
		return typeof module === "object" && typeof module.exports === "object";
	}

	export function runningInWebWorker()
	{
		return typeof window === "undefined" && typeof self === "object" && typeof self.addEventListener === "function";
	}

	export function runningInNullOrigin(): boolean
	{
		if (typeof window !== "object" || typeof window.location !== "object")
			return false;

		return document.location.protocol !== 'http:' && document.location.protocol !== 'https:';
	}

	export function webWorkersAvailable(): boolean
	{
		return typeof Worker === "function" && !runningInNullOrigin();
	}

	export function log(message: any, appendToDocument = false)
	{
		console.log(message);

		if (appendToDocument && typeof document == "object")
			document.body.innerHTML += message + "<br/>";
	}

	export function createErrorMessage(exception: any, title = "Unhandled exception"): string
	{
		title += ": ";

		if (typeof exception.content === "object")
		{
			if (runningInNodeJS())
			{
				return title + exception.content.stack;
			}
			else
			{
				let exceptionJSON = JSON.stringify(exception.content);

				if (exceptionJSON !== "{}")
					return title + exceptionJSON;
				else
					return title + exception.content;
			}
		}
		else if (typeof exception.content === "string")
		{
			return title + exception.content;
		}
		else
		{
			return title + exception;
		}
	}

	export function printExceptionAndStackTraceToConsole(exception: any, title = "Unhandled exception")
	{
		log(createErrorMessage(exception, title));
	}

	if (commonJSSupported())
	{
		module.exports = LZUTF8;
	}
}