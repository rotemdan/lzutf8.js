namespace LZUTF8 {
	export namespace BufferTools {
		export const convertToUint8ArrayIfNeeded = function (input: any): any {
			if (typeof Buffer === "function" && Buffer.isBuffer(input))
				return bufferToUint8Array(input);
			else
				return input;
		}

		export const uint8ArrayToBuffer = function (arr: Uint8Array): Buffer {
			if (Buffer.prototype instanceof Uint8Array) {
				// A simple technique based on how buffer objects are created in node 3/4+
				// See: https://github.com/nodejs/node/blob/627524973a22c584fdd06c951fbe82364927a1ed/lib/buffer.js#L67

				const arrClone = new Uint8Array(arr.buffer, arr.byteOffset, arr.byteLength)
				Object["setPrototypeOf"](arrClone, Buffer.prototype);
				return <any>arrClone;
			}
			else {
				const len = arr.length;
				const buf = new Buffer(len);
				//const buf = Buffer["from"](len);

				for (let i = 0; i < len; i++)
					buf[i] = arr[i];

				return buf;
			}
		}

		export const bufferToUint8Array = function (buf: Buffer): Uint8Array {
			if (Buffer.prototype instanceof Uint8Array) {
				return new Uint8Array(buf["buffer"], buf["byteOffset"], buf["byteLength"]);
			}
			else {
				const len = buf.length;
				const arr = new Uint8Array(len);

				for (let i = 0; i < len; i++)
					arr[i] = buf[i];

				return arr;
			}
		}
	}
}
