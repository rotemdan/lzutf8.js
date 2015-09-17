// Experimental, currently in development

if (typeof Uint8Array === "undefined")
{
	var Uint8Array = function(param)
	{
		var newArray = new Array(param);

		if (typeof param == "number")
		{
			// JS Arrays have all elements initially undefined so need to be zeroed
			for (var i = 0, length = newArray.length; i < length; i++)
				newArray[i] = 0;
		}

		function installPolyfills(arr)
		{
			arr.set = setPolyfill;
			arr.subarray = subarrayPolyfill;
		}

		function setPolyfill(source, offset)
		{
			for (var i = 0, copyCount = Math.min(this.length - offset, source.length); i < copyCount; i++)
				this[i + offset] = source[i];
		}

		function subarrayPolyfill(start, end)
		{
			var slicedArray = this.slice(start, end);
			installPolyfills(slicedArray);
			
			return slicedArray;
		}

		installPolyfills(newArray);

		return newArray;
	}
}