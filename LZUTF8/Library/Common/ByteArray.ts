module LZUTF8
{
	export function newByteArray(param): ByteArray
	{
		if (runningInNodeJS())
		{
			return convertToByteArray(new Buffer(param));
		}
		else if (typeof Uint8Array == "function")
		{
			return new Uint8Array(param);
		}
		else
		{
			if (typeof param == "number")
				return convertToByteArray(new Array(param));
			else if (param instanceof Array)
				return convertToByteArray(param.slice(0));
			else
				throw new TypeError("newByteArray: Invalid parameter");
		}
	}

	export function convertToByteArray(array: any): ByteArray
	{
		if (array == null)
			return array;

		if (runningInNodeJS())
		{
			if (array instanceof Buffer)
			{
				array["set"] = bufferSetFunctionPolyfill;
				array["subarray"] = genericArraySubarrayFunctionPolyfill;

				return array;
			}
			else if (array instanceof Uint8Array || array instanceof Array)
			{
				return newByteArray(array);
			}
			else
				throw new TypeError("convertToByteArray: invalid input array type");
		}
		else if (typeof Uint8Array == "function")
		{
			if (array instanceof Uint8Array)
			{
				return array;
			}
			else if (array instanceof Array)
			{
				return new Uint8Array(array);
			}
			else
				throw new TypeError("convertToByteArray: invalid input array type");
		}
		else if (array instanceof Array)
		{
			array["set"] = genericArraySetFunctionPolyfill;
			array["subarray"] = genericArraySubarrayFunctionPolyfill;

			return array;
		}
		else
			throw new TypeError("convertToByteArray: invalid input array type");
	}
	
	//
	// Polyfills
	//
	function bufferSetFunctionPolyfill(source: any, offset: number = 0)
	{
		if (source instanceof Buffer)
		{
			var sourceAsBuffer = <Buffer> source;
			sourceAsBuffer.copy(this, offset);
		}
		else if (source instanceof Uint8Array || source instanceof Array)
		{
			genericArraySetFunctionPolyfill(source, offset);
		}
		else
			throw new TypeError("ByteArray set() polyfill: Invalid source");
	}

	function genericArraySetFunctionPolyfill(source: any, offset: number = 0)
	{
		for (var i = 0, copyCount = Math.min(this.length - offset, source.length); i < copyCount; i++)
			this[i + offset] = source[i];
	}

	function genericArraySubarrayFunctionPolyfill(start: number, end?: number): ByteArray
	{
		if (end === undefined)
			end = this.length;

		return convertToByteArray(this.slice(start, end));
	}

	// Interfaces
	export interface ByteArray
	{
		[index: number]: number;
		length: number;

		set(array: any, offset?: number);
		subarray(start: number, end?: number): ByteArray;
	}
} 