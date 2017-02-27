// Internet Explorer 10 has a broken Typed Array
// implementation. subarray doesn't work correctly when slicing a
// zero-length subarray at the end of the array. Monkey-patch in a
// working version, adapted from the typed array polyfill.
//
// It was reported back in November, but they seem to have WONTFIXed
// the bug.
// https://connect.microsoft.com/IE/feedback/details/771452/typed-array-subarray-issue
if (typeof Uint8Array === "function" && new Uint8Array(1).subarray(1).byteLength !== 0) {
	const subarray = function (this: any, start: number, end: number) {
		const clamp = (v: number, min: number, max: number) => v < min ? min : v > max ? max : v;

		start = start | 0;
		end = end | 0;

		if (arguments.length < 1)
			start = 0;

		if (arguments.length < 2)
			end = this.length;

		if (start < 0)
			start = this.length + start;

		if (end < 0)
			end = this.length + end;

		start = clamp(<number>start, 0, this.length);
		end = clamp(<number>end, 0, this.length);

		let len = end - start;

		if (len < 0)
			len = 0;

		return new this.constructor(
			this.buffer,
			this.byteOffset + start * this.BYTES_PER_ELEMENT,
			len);
	}

	const types = ['Int8Array', 'Uint8Array', 'Uint8ClampedArray', 'Int16Array', 'Uint16Array', 'Int32Array', 'Uint32Array', 'Float32Array', 'Float64Array'];

	let globalObject: any;
	if (typeof window === "object")
		globalObject = window;
	else if (typeof self === "object")
		globalObject = self;

	if (globalObject !== undefined) {
		for (let i = 0; i < types.length; i++) {
			if (globalObject[types[i]])
				globalObject[types[i]].prototype.subarray = subarray;
		}
	}
}
