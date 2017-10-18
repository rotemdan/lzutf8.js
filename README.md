# LZ-UTF8

[![Build Status](https://travis-ci.org/rotemdan/lzutf8.js.svg)](https://travis-ci.org/rotemdan/lzutf8.js)
[![npm version](https://badge.fury.io/js/lzutf8.svg)](http://badge.fury.io/js/lzutf8)

LZ-UTF8 is a string compression library and format. Is an extension to the [UTF-8](https://en.wikipedia.org/wiki/UTF-8) character encoding, augmenting the UTF-8 bytestream with optional compression based the [LZ77](https://en.wikipedia.org/wiki/LZ77_and_LZ78) algorithm. Some of its properties:

* Compresses **strings only**. Doesn't support arbitrary byte sequences.
* Strongly optimized for speed, both in the choice of algorithm and its implementation. Approximate measurements using a low-end desktops and 1MB strings: 3-14MB/s compression , 20-120MB/s decompression (detailed benchmarks and comparison to other Javascript libraries can be found in the [technical paper](https://goo.gl/0g0fzm)). Due to the concentration on time efficiency, the resulting compression ratio can be significantly lower when compared to more size efficient algorithms like LZW + entropy coding.
* **Byte-level superset of UTF-8**. Any valid UTF-8 bytestream is also a valid LZ-UTF8 stream (but not vice versa). This special property allows both compressed and plain UTF-8 streams to be freely concatenated and decompressed as single unit (or with any arbitrary partitioning). Some possible applications:
  * Sending static pre-compressed data followed by dynamically generated uncompressed data from a server (and possibly appending a compressed static "footer", or repeating the process several times).
  * Appending both uncompressed/compressed data to a compressed log file/journal without needing to rewrite it.
  * Joining multiple source files, where some are possibly pre-compressed, and serving them as a single concatenated file without additional processing.
* Patent free (all relevant patents have long expired).

**Javascript implementation:**

* Tested on most popular browsers and platforms: Node.js 4+, Chrome, Firefox, Opera, Edge, IE10+ (IE8 and IE9 may work with a [typed array polyfill](https://github.com/inexorabletash/polyfill/blob/master/typedarray.js)), Android 4+, Safari 5+.
* Allows compressed data to be efficiently packed in plain Javascript UTF-16 strings (see the `"BinaryString"` encoding described later in this document) when binary storage is not available or desired (e.g. when using LocalStorage or older IndexedDB).
* Can operate asynchronously, both in Node.js and in the browser. Uses web workers when available (and takes advantage of [transferable objects](http://www.w3.org/html/wg/drafts/html/master/#transferable-objects) if supported) and falls back to async iterations when not.
* Supports Node.js streams.
* Written in TypeScript.

# Quick start

* Try the [online demo](https://rotemdan.github.io/lzutf8/demo/) to test and benchmark different inputs.
* Download the [latest build](https://unpkg.com/lzutf8) (or the [minified version](https://unpkg.com/lzutf8/production/lzutf8.min.js)).
* Run the [automated tests](https://rotemdan.github.io/lzutf8/tests/).
* Run the [core benchmarks](https://rotemdan.github.io/lzutf8/benchmarks/).
* Read the [technical paper](https://rotemdan.github.io/lzutf8/docs/paper.pdf).

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->


# Table of Contents

- [API Reference](#api-reference)
  - [Getting started](#getting-started)
  - [Type Identifier Strings](#type-identifier-strings)
  - [Core Methods](#core-methods)
    - [LZUTF8.compress(..)](#lzutf8compress)
    - [LZUTF8.decompress(..)](#lzutf8decompress)
  - [Asynchronous Methods](#asynchronous-methods)
    - [LZUTF8.compressAsync(..)](#lzutf8compressasync)
    - [LZUTF8.decompressAsync(..)](#lzutf8decompressasync)
    - [*General notes on async operations*](#general-notes-on-async-operations)
  - [Lower-level Methods](#lower-level-methods)
    - [LZUTF8.Compressor](#lzutf8compressor)
    - [LZUTF8.Compressor.compressBlock(..)](#lzutf8compressorcompressblock)
    - [LZUTF8.Decompressor](#lzutf8decompressor)
    - [LZUTF8.Decompressor.decompressBlock(..)](#lzutf8decompressordecompressblock)
    - [LZUTF8.Decompressor.decompressBlockToString(..)](#lzutf8decompressordecompressblocktostring)
  - [Node.js only methods](#nodejs-only-methods)
    - [LZUTF8.createCompressionStream()](#lzutf8createcompressionstream)
    - [LZUTF8.createDecompressionStream()](#lzutf8createdecompressionstream)
  - [Character encoding methods](#character-encoding-methods)
    - [LZUTF8.encodeUTF8(..)](#lzutf8encodeutf8)
    - [LZUTF8.decodeUTF8(..)](#lzutf8decodeutf8)
    - [LZUTF8.encodeBase64(..)](#lzutf8encodebase64)
    - [LZUTF8.decodeBase64(..)](#lzutf8decodebase64)
    - [LZUTF8.encodeBinaryString(..)](#lzutf8encodebinarystring)
    - [LZUTF8.decodeBinaryString(..)](#lzutf8decodebinarystring)
- [Release history](#release-history)
- [License](#license)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

# API Reference

## Getting started

Node.js:

```
npm install lzutf8
```
```js
var LZUTF8 = require('lzutf8');
```

Browser:
```html
<script id="lzutf8" src="https://cdn.jsdelivr.net/npm/lzutf8/build/production/lzutf8.js"></script>
```
or the minified version:
```html
<script id="lzutf8" src="https://cdn.jsdelivr.net/npm/lzutf8/build/production/lzutf8.min.js"></script>
```
to reference a particular version use the pattern, where `x.x.x` should be replaced with the exact version number (e.g. `0.4.6`):
```html
<script id="lzutf8" src="https://unpkg.com/lzutf8@x.x.x/build/production/lzutf8.min.js"></script>
```

*note: the `id` attribute and its exact value are necessary for the library to make use of web workers.*

## Type Identifier Strings

*`"ByteArray"`* - An array of bytes. As of `0.3.2`, always a `Uint8Array`. In versions up to `0.2.3` the type was determined by the platform (`Array` for browsers that don't support typed arrays, `Uint8Array` for supporting browsers and `Buffer` for Node.js).

IE8/9 and support was dropped at `0.3.0` though these browsers can still be used with a [typed array polyfill](https://github.com/inexorabletash/polyfill/blob/master/typedarray.js).

*`"Buffer"`* - A Node.js `Buffer` object.

*`"BinaryString"`* - A `string` containing binary data encoded to only use the lowest 15 bits of each character (_Note this encoding method has been deprecated. See more details in the reference for `encodeBinaryString` further in this document_).

*`"Base64"`* - A [base 64](https://en.wikipedia.org/wiki/Base64) string.

## Core Methods

### LZUTF8.compress(..)

```js
var output = LZUTF8.compress(input, [options]);
```
Compresses the given input data.

*`input`* can be either a `String` or UTF-8 bytes stored in a `Uint8Array` or `Buffer`

*`options`* (optional): an object that may have any of the properties:

* `outputEncoding`: `"ByteArray"` (default), `"Buffer"`, `"BinaryString"` or `"Base64"`

*returns*: compressed data encoded by `encoding`, or `ByteArray` if not specified.


### LZUTF8.decompress(..)

```js
var output = LZUTF8.decompress(input, [options]);
```
Decompresses the given compressed data.

*`input`*: can be either a `Uint8Array`, `Buffer` or `String` (where encoding scheme is then specified in `inputEncoding`)

*`options`* (optional): an object that may have the properties:

* `inputEncoding`:  `"ByteArray"` (default), `"BinaryString"` or `"Base64"`
* `outputEncoding`: `"String"` (default), `"ByteArray"` or `"Buffer"` to return UTF-8 bytes

*returns*: decompressed bytes encoded as `encoding`, or as `String` if not specified.


## Asynchronous Methods


### LZUTF8.compressAsync(..)

```js
LZUTF8.compressAsync(input, [options], callback);
```
Asynchronously compresses the given input data.

*`input`* can be either a `String`, or UTF-8 bytes stored in an `Uint8Array` or `Buffer`.

*`options`* (optional): an object that may have any of the properties:

* `outputEncoding`: `"ByteArray"` (default), `"Buffer"`, `"BinaryString"` or `"Base64"`
* `useWebWorker`: `true` (default) would use a web worker if available. `false` would use iterated yielding instead.

*`callback`*: a user-defined callback function accepting a first argument containing the resulting compressed data as specified by `outputEncoding` (or `ByteArray` if not specified) and a possible second parameter containing an `Error` object.

*On error*: invokes the callback with a first argument of `undefined` and a second one containing the ```Error``` object.

*Example:*
```js
LZUTF8.compressAsync(input, {outputEncoding: "BinaryString"}, function (result, error) {
    if (error === undefined)
        console.log("Data successfully compressed and encoded to " + result.length + " characters");
    else
        console.log("Compression error: " + error.message);
});
```

### LZUTF8.decompressAsync(..)

```js
LZUTF8.decompressAsync(input, [options], callback);
```
Asynchronously decompresses the given compressed input.

*`input`*: can be either a `Uint8Array`, `Buffer` or `String` (where encoding is set with `inputEncoding`).

*`options`* (optional): an object that may have the properties:

* `inputEncoding`: `"ByteArray"` (default), `"BinaryString"` or `"Base64"`
* `outputEncoding`: `"String"` (default), `"ByteArray"` or `"Buffer"` to return UTF-8 bytes.
* `useWebWorker`: `true` (default) would use a web worker if available. `false` would use incremental yielding instead.

*`callback`*: a user-defined callback function accepting a first argument containing the resulting decompressed data as specified by `outputEncoding` and a possible second parameter containing an ```Error``` object.

*On error*: invokes the callback with a first argument of ```undefined``` and a second one containing the ```Error``` object.

*Example:*
```js
LZUTF8.decompressAsync(input, {inputEncoding: "BinaryString", outputEncoding: "ByteArray"}, function (result, error) {
    if (error === undefined)
        console.log("Data successfully decompressed to " + result.length + " UTF-8 bytes");
    else
        console.log("Decompression error: " + error.message);
});
```

### *General notes on async operations*


Web workers are available if supported by the browser and the library's script source is referenced in the document with a `script` tag having `id` of `"lzutf8"` (its `src` attribute is then used as the source URI for the web worker). In cases where a script tag is not available (such as when the script is dynamically loaded or bundled with other scripts) the value of `LZUTF8.WebWorker.scriptURI` may alternatively be set before the first async method call.

Workers are optimized for various input and output encoding schemes, so only the minimal amount of work is done in the main Javascript thread. Internally, conversion to or from various encodings is performed within the worker itself, reducing delays and allowing greater parallelization. Additionally, if [transferable objects](http://www.w3.org/html/wg/drafts/html/master/#transferable-objects) are supported by the browser, binary arrays will be transferred virtually instantly to and from the worker.

Only one worker instance is spawned per page - multiple operations are processed sequentially.

In case a worker is not available (such as in Node.js, IE8, IE9, Android browser < 4.4) or desired, it will iteratively process 64KB blocks while yielding to the event loop whenever a 20ms interval has elapsed. *Note:* In this execution method, parallel operations are not guaranteed to complete by their initiation order.


## Lower-level Methods


### LZUTF8.Compressor

```js
var compressor = new LZUTF8.Compressor();
```
Creates a compressor object. Can be used to incrementally compress a multi-part stream of data.

*returns*: a new `LZUTF8.Compressor` object

### LZUTF8.Compressor.compressBlock(..)

```js
var compressor = new LZUTF8.Compressor();
var compressedBlock = compressor.compressBlock(input);
```
Compresses the given input UTF-8 block.

*`input`* can be either a `String`, or UTF-8 bytes stored in a `Uint8Array` or `Buffer`

*returns*: compressed bytes as `ByteArray`

This can be used to incrementally create a single compressed stream. For example:

```js
var compressor = new LZUTF8.Compressor();
var compressedBlock1 = compressor.compressBlock(block1);
var compressedBlock2 = compressor.compressBlock(block2);
var compressedBlock3 = compressor.compressBlock(block3);
..
```

### LZUTF8.Decompressor

```js
var decompressor = new LZUTF8.Decompressor();
```
Creates a decompressor object. Can be used to incrementally decompress a multi-part stream of data.

*returns*: a new `LZUTF8.Decompressor` object

### LZUTF8.Decompressor.decompressBlock(..)

```js
var decompressor = new LZUTF8.Decompressor();
var decompressedBlock = decompressor.decompressBlock(input);
```
Decompresses the given block of compressed bytes.

*`input`* can be either a `Uint8Array` or `Buffer`

*returns*: decompressed UTF-8 bytes as `ByteArray`

*Remarks*: will always return the longest valid UTF-8 stream of bytes possible from the given input block. Incomplete input or output byte sequences will be prepended to the next block.

*Note*: This can be used to incrementally decompress a single compressed stream. For example:

```js
var decompressor = new LZUTF8.Decompressor();
var decompressedBlock1 = decompressor.decompressBlock(block1);
var decompressedBlock2 = decompressor.decompressBlock(block2);
var decompressedBlock3 = decompressor.decompressBlock(block3);
..
```

### LZUTF8.Decompressor.decompressBlockToString(..)

```js
var decompressor = new LZUTF8.Decompressor();
var decompressedBlockAsString = decompressor.decompressBlockToString(input);
```
Decompresses the given block of compressed bytes  and converts the result to a `String`.

*`input`* can be either a `Uint8Array` or `Buffer`

*returns*: decompressed `String`

*Remarks*: will always return the longest valid string possible from the given input block. Incomplete input or output byte sequences will be prepended to the next block.


## Node.js only methods


### LZUTF8.createCompressionStream()

```js
var compressionStream = LZUTF8.createCompressionStream();
```

Creates a compression stream. The stream will accept both Buffers and Strings in any encoding supported by Node.js (e.g. `utf8`, `utf16`, `ucs2`, `base64`, `hex`, `binary` etc.) and return Buffers.

*example*:
```js
var sourceReadStream = fs.createReadStream(“content.txt”);
var destWriteStream = fs.createWriteStream(“content.txt.lzutf8”);
var compressionStream = LZUTF8.createCompressionStream();

sourceReadStrem.pipe(compressionStream).pipe(destWriteStream);
```

*On error*: emits an `error` event with the `Error` object as parameter.

### LZUTF8.createDecompressionStream()

```js
var decompressionStream = LZUTF8.createDecompressionStream();
```

Creates a decompression stream. The stream will accept and return Buffers.

*On error*: emits an `error` event with the `Error` object as parameter.

## Character encoding methods


### LZUTF8.encodeUTF8(..)

```js
var output = LZUTF8.encodeUTF8(input);
```
Encodes a string to UTF-8.

*`input`* as `String`

*returns*: encoded bytes as `ByteArray`


### LZUTF8.decodeUTF8(..)

```js
var outputString = LZUTF8.decodeUTF8(input);
```
Decodes UTF-8 bytes to a String.

*`input`* as either a `Uint8Array` or `Buffer`

*returns*: decoded bytes as `String`


### LZUTF8.encodeBase64(..)

```js
var outputString = LZUTF8.encodeBase64(bytes);
```
Encodes bytes to a Base64 string.

*`input`* as either a `Uint8Array` or `Buffer`

*returns*: resulting Base64 string.

*remarks*: Maps every 3 consecutive input bytes to 4 output characters of the set `A-Z`,`a-z`,`0-9`,`+`,`/` (a total of 64 characters). Increases stored byte size to 133.33% of original (when stored as ASCII or UTF-8) or 266% (stored as UTF-16).

### LZUTF8.decodeBase64(..)

```js
var output = LZUTF8.decodeBase64(input);
```
Decodes UTF-8 bytes to a String.

*`input`* as `String`

*returns*: decoded bytes as `ByteArray`

*remarks:* the decoder cannot decode concatenated base64 strings. Although it is possible to add this capability to the JS version, compatibility with other decoders (such as the Node.js decoder) prevents this feature to be added.

### LZUTF8.encodeBinaryString(..)

_Note: the `BinaryString` encoding has been deprecated due to a [compatibility issue with the IE browser's LocalStorage/SessionStorage implementation](https://github.com/rotemdan/lzutf8.js/issues/11). It is recommended to use the `Base64` encoding instead or output the compressed data to binary and then encode it through a third party implementation._

```js
var outputString = LZUTF8.encodeBinaryString(input);
```
Encodes binary bytes to a valid UTF-16 string.

*`input`* as either a `Uint8Array` or `Buffer`

*returns*: `String`

*remarks*: To comply with the UTF-16 standard, it only uses the bottom 15 bits of each character, effectively mapping every 15 input bits to a single 16 bit output character. This Increases the stored byte size to 106.66% of original.

### LZUTF8.decodeBinaryString(..)

_Note: the `BinaryString` encoding has been deprecated due to a [compatibility issue with the IE browser's LocalStorage/SessionStorage implementation](https://github.com/rotemdan/lzutf8.js/issues/11). It is recommended to use the `Base64` encoding instead or encode/decode the data through a third party implementation._

```js
var output = LZUTF8.decodeBinaryString(input);
```
Decodes a binary string.

*`input`* as `String`

*returns*: decoded bytes as `ByteArray`

*remarks:* Multiple binary strings may be freely concatenated and decoded as a single string. This is made possible by ending every sequence with special marker (char code 32768 for an even-length sequence and 32769 for a an odd-length sequence).


# Release history

* ```0.1.x```: Initial release.
* ```0.2.x```: Added async error handling. Added support for `TextEncoder` and `TextDecoder` when available.
* ```0.3.x```: Removed support to IE8/9. Removed support for plain `Array` inputs. All `"ByteArray"` outputs are now `Uint8Array` objects. A separate `"Buffer"` encoding setting can be used to return `Buffer` objects.
* ```0.4.x```: Major code restructuring. Removed support for versions of Node.js prior to `4.0`.

# License

Copyright (c) 2014-2017, Rotem Dan &lt;rotemdan@gmail.com&gt;.

Source code and documentation are available under the [MIT license](http://choosealicense.com/licenses/mit/).
