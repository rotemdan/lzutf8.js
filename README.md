#LZ-UTF8

A high-performance string compression algorithm and library:

  - Very fast, especially decompression (benchmark results are for a single core, Intel Pentium G3220 running Windows 7, processing 1MB files):
    - Javascript: 3-12MB/s compression , 20-60MB/s decompression (detailed benchmarks and comparison to other Javascript libraries can be found [here](https://rotemdan.github.io/lzutf8/Documents/LZ-UTF8 Benchmarks.pdf)).
    - C++ : 30-40MB/s compression, 300-500MB/s decompression (incomplete and unreleased, numbers may improve in the future).
  - Reasonable compression ratio - excellent for shorter strings (&lt;32k), but less efficient for longer ones.
  - Conceived with web and mobile use cases in mind. Algorithm was designed for and implemented in Javascript from the very beginning.
  - Simple and easy-to-use API that's consistent across all platforms, both in the browser and in Node.js.
  - 100% patent-free.

#Quick start

  - Try the [online demo](https://rotemdan.github.io/lzutf8/Demo/) to quickly test and benchmark different inputs.
  - Download the [latest build](https://raw.githubusercontent.com/rotemdan/lzutf8-js/master/ReleaseBuild/lzutf8.js) (or the [minified version](https://raw.githubusercontent.com/rotemdan/lzutf8-js/master/ReleaseBuild/lzutf8.min.js)).
  - Run the [automated tests](https://rotemdan.github.io/lzutf8/Tests/).
  - Run the [core benchmarks](https://rotemdan.github.io/lzutf8/Benchmarks/) (*note: in development, only a handful are currently available*).

#Technical overview

*Design objectives and special properties:*

  - Allows incremental compression and decompression with any arbitrary partitioning of the source material.
  - Individually compressed blocks can be freely concatenated and yield a valid compressed stream that may be decompressed as a single unit.
  - **Bytestream is *backwards compatible* with plain UTF-8** - this unusual property allows both compressed and plain UTF-8 streams to be concatenated and decompressed as single unit (or with any arbitrary partitioning). Some possible applications:
    - Sending "static" pre-compressed data followed by dynamically generated uncompressed data from a server.
    - Appending both uncompressed/compressed data to a compressed log file without needing to rewrite it.
    - Joining multiple source files, where some are possibly pre-compressed, and serving them as a single concatenated file without additional processing.
  - **No flushing** is needed for decompression. The decompressor will always yield the longest valid string possible from the given block.
  - Compression **always** results in a byte length that is smaller or equal to the source length, even for random source strings.
  - One single scheme, as no metadata is stored in the compressed stream.

*Javascript implementation:*

  - Thoroughly tested on all popular browsers  - Chrome, Firefox, IE8+, Android 4+, Safari 6+.
  - Can operate asynchronously, both in Node.js and in the browser. Uses web workers when available (and takes full advantage of [transferable objects](https://developer.mozilla.org/en-US/docs/Web/Guide/Performance/Using_web_workers#Passing_data_by_transferring_ownership_%28transferable_objects%29) if supported) and falls back to async iterations when not.
  - Allows compressed data to be efficiently packed in plain UTF-16 strings when binary storage is not available or desired (e.g. when using LocalStorage).
  - Fully supports Node.js streams.
  - Concise, high quality and well structured code written in TypeScript (compiles to approx. ~1800 JS lines excluding comments, test and benchmark code).

The LZ-UTF8 byte format is a newly designed, backwards-compatible extension for UTF-8 adding byte-aligned LZ77 pointer sequences while maintaining compatibility with plain UTF-8 byte sequences. A complete technical specification will be published when funding goal is reached.

#Funding and proprietary use
This library is currently distributed under the [GNU AGPL v3.0](http://choosealicense.com/licenses/agpl-3.0/) license and thus **cannot** be used in most proprietary, closed-source applications and websites.

If you or your company find it valuable and wish it to be made available under a more permissive license - enabling unrestricted commercial use for yourself and others, consider participating in the *fundraiser*:

<a href='https://pledgie.com/campaigns/27200'><img alt='Click here to lend your support to: LZ-UTF8 string compression library and make a donation at pledgie.com !' src='https://pledgie.com/campaigns/27200.png?skin_name=chrome' border='0' ></a>

As soon as I gather a minimum total of **7,000 USD** I am committed to release:

  - All source code, for existing and future versions, under the [**MIT License**](http://choosealicense.com/licenses/mit/).
  - All documentation under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
  - A detailed technical specification and implementer's guide under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).

As a stretch goal, when **10,000 USD** is reached I will release a highly optimized cross-platform C++ implementation under the same license, both as a library and as a CLI application.

Companies or individuals who pledge **100 USD** or more receive a special *Sponsor's permit* that immediately exempts them from the AGPL's obligation to disclose source code of software using or derived from this library, effectively granting them permission for proprietary use (permit is granted once for unlimited use, regardless of company size, and will be given in a digitally signed form, contact me for more details).

The amounts stated are comparable to about a month or two's paycheck, which I find reasonable for the large amount of full-time unpayed work I've put forth to design, develop, test, benchmark, document and eventually bring this library to the quality and polish it is right now. Very little (if any) profit, is intended.

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
#Table of Contents

- [API Reference](#api-reference)
  - [Getting started](#getting-started)
  - [Core Types](#core-types)
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
    - [LZUTF8.Deompressor.decompressBlock(..)](#lzutf8deompressordecompressblock)
    - [LZUTF8.Deompressor.decompressBlockToString(..)](#lzutf8deompressordecompressblocktostring)
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
- [General / Misc FAQ](#general--misc-faq)
  - [Who are you?](#who-are-you)
  - [Where did this come from?](#where-did-this-come-from)
  - [How can I help?](#how-can-i-help)
  - [What did you learn from doing this?](#what-did-you-learn-from-doing-this)
- [Some interesting facts about the code](#some-interesting-facts-about-the-code)
- [License](#license)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

#API Reference
##Getting started
Browser:
```html
<script id="lzutf8" src="path/to/lzutf8.js"></script>
```
*note: the `id` attribute and its exact value are necessary for the library to make use of web workers.*

Node.js:
```
npm install lzutf8
```
```js
var LZUTF8 = require('lzutf8');
```

**TODO:** *add npm support*

##Core Types
*`ByteArray`* - a platform dependent array of bytes. Based on the platform and availability of the underlying types, would either be a regular `Array` (IE8, IE9), `Uint8Array` (IE10+, all other modern browsers) or `Buffer` (Node.js).
##Core Methods

### LZUTF8.compress(..)
```js
var output = LZUTF8.compress(input, [options]);
```
Compresses the given input data.

*`input`* can be either a ``String`` or UTF-8 bytes stored in an `Array`, `Uint8Array` or `Buffer`

*`options`* (optional): an object that may have any of the properties:

* `outputEncoding`: `"ByteArray"` (default), `"BinaryString"` or `"Base64"`

*returns*: compressed data encoded by `encoding`, or `ByteArray` if not specified.


### LZUTF8.decompress(..)
```js
var output = LZUTF8.decompress(input, [options]);
```
Decompresses the given compressed data.

*`input`*: can be either an `Array`, `Uint8Array`, `Buffer` or `String` (where encoding scheme is then specified in `inputEncoding`)

*`options`* (optional): an object that may have the properties:

* `inputEncoding`:  `"ByteArray"` (default), `"BinaryString"` or `"Base64"`
* `outputEncoding`: `"String"` (default), `"ByteArray"` to return UTF-8 bytes

*returns*: decompressed bytes encoded as `encoding`, or as `String` if not specified.


## Asynchronous Methods


### LZUTF8.compressAsync(..)
```js
LZUTF8.compressAsync(input, [options], callback);
```
Asynchronously compresses the given input data.

*`input`* can be either a ``String``, or UTF-8 bytes stored in an `Array`, `Uint8Array` or `Buffer`.

*`options`* (optional): an object that may have any of the properties:

* `outputEncoding`: `"ByteArray"` (default), `"BinaryString"` or `"Base64"`
* `useWebWorker`: `true` (default) would use a web worker if available. `false` would use iterated yielding instead.

*`callback`*: a user-defined callback function accepting a single parameter containing the resulting compressed data as specified by `outputEncoding` (or `ByteArray` if not specified)

*Example:*
```js
LZUTF8.compressAsync(input, {outputEncoding: "BinaryString"}, function (result) {
	console.log("Data successfully compressed and encoded to " + result.length + " characters");
});
```

### LZUTF8.decompressAsync(..)
```js
LZUTF8.decompressAsync(input, [options], callback);
```
Asynchronously decompresses the given compressed input.

*`input`*: can be either an `Array`, `Uint8Array`, `Buffer` or `String` (where encoding is set with `inputEncoding`).

*`options`* (optional): an object that may have the properties:

* `inputEncoding`: `"ByteArray"` (default), `"BinaryString"` or `"Base64"`
* `outputEncoding`: `"String"` (default), `"ByteArray"` to return UTF-8 bytes.
* `useWebWorker`: `true` (default) would use a web worker if available. `false` would use incremental yielding instead. 
 
*`callback`*: a user-defined callback function accepting a single parameter containing the resulting uncompressed data as a specified by `outputEncoding` or `String` if not specified.


*Example:*
```js
LZUTF8.decompressAsync(input, {inputEncoding: "BinaryString", outputEncoding: "ByteArray"}, function (result) {
	console.log("Data successfully decompressed to " + result.length + " UTF-8 bytes");
});
```

### *General notes on async operations*

Web workers are available only if supported by the browser and the library's script source is referenced in the document with a `<script>` tag having `id` of `"lzutf8"` (its `src` attribute is then used as the source URI for the web worker). 

Workers are optimized for various input and output encoding schemes, so only the minimal amount of work is done in the main Javascript thread. Internally, conversion to or from various encodings is performed within the worker itself, reducing delays and allowing greater parallelization. Additionaly, if [transferable objects](https://developer.mozilla.org/en-US/docs/Web/Guide/Performance/Using_web_workers#Passing_data_by_transferring_ownership_%28transferable_objects%29) are supported by the browser, binary arrays will be transferred virtually instantly to the worker.

Only one worker instance is spawned per page - multiple operations are processed sequentially.

In case a worker is not available (such as in Node.js, IE8, IE9, Android browser < 4.4) or desired, it will iteratively process 64KB blocks while yielding to the event loop whenever a 20ms interval has elapsed . Note: In this execution method, parallel operations are not guaranteed to complete by their initiation order.

## Lower-level Methods

###LZUTF8.Compressor
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

*`input`* can be either a `String`, or UTF-8 bytes stored in an `Array`, `Uint8Array` or `Buffer`

*returns*: compressed bytes as `ByteArray`

This can be used to incrementally create a single compressed stream. For example:

```js
var compressor = new LZUTF8.Compressor();
var compressedBlock1 = compressor.compressBlock(block1);
var compressedBlock2 = compressor.compressBlock(block2);
var compressedBlock3 = compressor.compressBlock(block3);
..
```

###LZUTF8.Decompressor
```js
var decompressor = new LZUTF8.Deompressor();
```
Creates a decompressor object. Can be used to incrementally decompress a multi-part stream of data.

*returns*: a new `LZUTF8.Decompressor` object

### LZUTF8.Deompressor.decompressBlock(..)
```js
var decompressor = new LZUTF8.Decompressor();
var decompressedBlock = compressor.decompressBlock(input);
```
Decompresses the given block of compressed bytes.

*`input`* can be either an `Array`, `Uint8Array` or `Buffer`

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

### LZUTF8.Deompressor.decompressBlockToString(..)
```js
var decompressor = new LZUTF8.Decompressor();
var decompressedBlockAsString = compressor.decompressBlockToString(input);
```
Decompresses the given block of compressed bytes  and converts the result to a `String`.

*`input`* can be either an `Array`, `Uint8Array` or `Buffer`

*returns*: decompressed `String`

*Remarks*: will always return the longest valid string possible from the given input block. Incomplete input or output byte sequences will be prepended to the next block.

## Node.js only methods

###LZUTF8.createCompressionStream()

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

###LZUTF8.createDecompressionStream()

```js
var decompressionStream = LZUTF8.createDecompressionStream();
```

Creates a decompression stream. The stream will accept and return Buffers.

##Character encoding methods

### LZUTF8.encodeUTF8(..)
```js
var output = LZUTF8.encodeUTF8(input);
```
Encodes a string to UTF-8.

*`input`* as `String`

*returns*: encoded bytes as `ByteArray`

### LZUTF8.decodeUTF8(..)
```js
var outputString = LZUTF8.encodeUTF8(input);
```
Decodes UTF-8 bytes to a String.

*`input`* as either an `Array`, `Uint8Array` or `Buffer`

*returns*: decoded bytes as `String`



### LZUTF8.encodeBase64(..)
```js
var outputString = LZUTF8.encodeBase64(bytes);
```
Encodes bytes to a Base64 string. 

*``input``* as either an ``Array``, ``Uint8Array`` or ``Buffer``

*returns*: base64 

*remarks*: Maps every 3 consecutive input bytes to 4 output characters of the set ``A-Z``,``a-z``,``0-9``,``+``,``/`` (a total of 64 characters). Increases stored byte size to 133.33% of original (when stored as ASCII or UTF-8) or 266% (stored as UCS-2/UTF-16).

### LZUTF8.decodeBase64(..)
```js
var output = LZUTF8.decodeBase64(input);
```
Decodes UTF-8 bytes to a String.

*`input`* as ``String``

*returns*: decoded bytes as ``ByteArray``

*remarks:* the decoder cannot decode concatenated base64 strings. Although it is possible to add this capability to the JS version, compatibility with other decoders (such as the Node.js decoder) prevents this feature to be added.

### LZUTF8.encodeBinaryString(..)
```js
var outputString = LZUTF8.encodeBinaryString(bytes);
```
Encodes binary bytes to a valid UTF-16 string.

*``input``* as either an ``Array``, ``Uint8Array`` or ``Buffer``

*returns*: `String`

*remarks*: To comply with the UTF-16 standard, it only uses the bottom 15 bits of each character, effectively mapping every 15 input bits to a single 16 bit output character. This Increases the stored byte size to 106.66% of original.

### LZUTF8.decodeBinaryString(..)
```js
var output = LZUTF8.decodeBinaryString(input);
```
Decodes a binary string.

*`input`* as ``String``

*returns*: decoded bytes as ``ByteArray``

*remarks:* Multiple binary strings may be freely concatenated and decoded as a single string. This is made possible by ending every sequence with single end-of-stream marker. (char code 32768 for an even-length sequence and 32769 for a an odd-length sequence).

#General / Misc FAQ

##Who are you?
I'm an independent software developer dedicated to open source and free software.

##Where did this come from?
It started as a curiosity, some idea I experimented with, originally arose in the context of another open source project I was working on. Eventually ended as hundreds of unpayed (and somewhat painstaking) work hours to design, develop, rewrite, reiterate, and eventually ensure this software is of the highest quality I can provide. 


##How can I help?
*Short answer:*
Sponsor the project.

*Long answer:*
Honestly, I'd prefer this not to be a community effort (also because I'm dedicated to keeping a clean codebase). If you still feel a need to contribute, it might mean there is something to be improved or some feature that is missing. If it is relatively small, just post an issue and I'll gladly try to do my best.

For larger tasks (e.g. "make a C++ implementation"*) consider sponsoring me to do it, either by yourself / your company or by teaming with others using funding platforms such as Pledgie/Bountysource/Gratipay/Flattr etc.

*A C++ implementation actually does exist, but for an earlier draft of the algorithm. Though it works well (and turned out to be 3-10x faster on average than the Javascript version), it'd need some major work to update, port, test and document.*



##What did you learn from doing this?
That implementing production-level software involving close bit manipulation is **hard**. Without extreme carefulness, intensive testing and simplicity of design, you might make something that "appears" to work but may still contain unbelievably subtle bugs which, in the case of a compression algorithm, when fixed may also cause to *break compatibility* with existing data and change the entire bit scheme.

#Some interesting facts about the code
* Everything was written by myself - no outside libraries or "borrowed" code snippets.
* The UTF-8, Base64 and Binary String encoders and decoders are very fast (possibly some of the fastest JS implementations in existence) and were rigorously tested (matched with random input of various lengths against the versions within Node) and benchmarked.
* Differently from Node.js decoder or others available in various libraries, the JS UTF-8 decoder will throw errors if the stream is malformed or truncated, so it can also be used to verify the correctness of arbitrary UTF-8 byte sequences.

#License
Copyright (c) 2014, Rotem Dan  
All rights reserved.

Source code is available under the [GNU Affero GPL v3.0 license](http://choosealicense.com/licenses/agpl-3.0/).
Documentation under [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/)