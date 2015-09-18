/*
 LZ-UTF8 v0.3.2

 Copyright (c) 2014-2015, Rotem Dan <rotemdan@gmail.com> 
 Released under the MIT license.

 Build date: 2015-09-18 
*/
var LZUTF8;
(function (LZUTF8) {
    function runningInNodeJS() {
        return ((typeof process === "object") && (typeof process.versions === "object") && (typeof process.versions.node === "string"));
    }
    LZUTF8.runningInNodeJS = runningInNodeJS;
    if (typeof module === "object" && typeof module.exports === "object") {
        module.exports = LZUTF8;
    }
})(LZUTF8 || (LZUTF8 = {}));
var LZUTF8;
(function (LZUTF8) {
    var AsyncCompressor = (function () {
        function AsyncCompressor() {
        }
        AsyncCompressor.compressAsync = function (input, options, callback) {
            var timer = new LZUTF8.Timer();
            var compressor = new LZUTF8.Compressor();
            if (!callback)
                throw new TypeError("compressAsync: No callback argument given");
            if (typeof input === "string") {
                input = LZUTF8.encodeUTF8(input);
            }
            else if (input == null || !(input instanceof Uint8Array)) {
                callback(undefined, new TypeError("compressAsync: Invalid input argument"));
                return;
            }
            var sourceBlocks = LZUTF8.ArrayTools.splitByteArray(input, options.blockSize);
            var compressedBlocks = [];
            var compressBlocksStartingAt = function (index) {
                if (index < sourceBlocks.length) {
                    try {
                        var compressedBlock = compressor.compressBlock(sourceBlocks[index]);
                    }
                    catch (e) {
                        callback(undefined, e);
                        return;
                    }
                    compressedBlocks.push(compressedBlock);
                    if (timer.getElapsedTime() <= 20) {
                        compressBlocksStartingAt(index + 1);
                    }
                    else {
                        LZUTF8.enqueueImmediate(function () { return compressBlocksStartingAt(index + 1); });
                        timer.restart();
                    }
                }
                else {
                    var joinedCompressedBlocks = LZUTF8.ArrayTools.joinByteArrays(compressedBlocks);
                    LZUTF8.enqueueImmediate(function () {
                        try {
                            var result = LZUTF8.CompressionCommon.encodeCompressedBytes(joinedCompressedBlocks, options.outputEncoding);
                        }
                        catch (e) {
                            callback(undefined, e);
                            return;
                        }
                        LZUTF8.enqueueImmediate(function () { return callback(result); });
                    });
                }
            };
            LZUTF8.enqueueImmediate(function () { return compressBlocksStartingAt(0); });
        };
        AsyncCompressor.createCompressionStream = function () {
            var compressor = new LZUTF8.Compressor();
            var NodeStream = require("stream");
            var compressionStream = new NodeStream.Transform({ decodeStrings: true, highWaterMark: 65536 });
            compressionStream._transform = function (data, encoding, done) {
                try {
                    var buffer = new Buffer(compressor.compressBlock(new Uint8Array(data)));
                }
                catch (e) {
                    compressionStream.emit("error", e);
                    return;
                }
                compressionStream.push(buffer);
                done();
            };
            return compressionStream;
        };
        return AsyncCompressor;
    })();
    LZUTF8.AsyncCompressor = AsyncCompressor;
})(LZUTF8 || (LZUTF8 = {}));
var LZUTF8;
(function (LZUTF8) {
    var AsyncDecompressor = (function () {
        function AsyncDecompressor() {
        }
        AsyncDecompressor.decompressAsync = function (input, options, callback) {
            if (!callback)
                throw new TypeError("compressAsync: No callback argument given");
            var timer = new LZUTF8.Timer();
            try {
                input = LZUTF8.CompressionCommon.decodeCompressedData(input, options.inputEncoding);
            }
            catch (e) {
                callback(undefined, e);
                return;
            }
            var decompressor = new LZUTF8.Decompressor();
            var sourceBlocks = LZUTF8.ArrayTools.splitByteArray(input, options.blockSize);
            var decompressedBlocks = [];
            var decompressBlocksStartingAt = function (index) {
                if (index < sourceBlocks.length) {
                    try {
                        var decompressedBlock = decompressor.decompressBlock(sourceBlocks[index]);
                    }
                    catch (e) {
                        callback(undefined, e);
                        return;
                    }
                    decompressedBlocks.push(decompressedBlock);
                    if (timer.getElapsedTime() <= 20) {
                        decompressBlocksStartingAt(index + 1);
                    }
                    else {
                        LZUTF8.enqueueImmediate(function () { return decompressBlocksStartingAt(index + 1); });
                        timer.restart();
                    }
                }
                else {
                    var joinedDecompressedBlocks = LZUTF8.ArrayTools.joinByteArrays(decompressedBlocks);
                    LZUTF8.enqueueImmediate(function () {
                        try {
                            var result = LZUTF8.CompressionCommon.encodeDecompressedBytes(joinedDecompressedBlocks, options.outputEncoding);
                        }
                        catch (e) {
                            callback(undefined, e);
                            return;
                        }
                        LZUTF8.enqueueImmediate(function () { return callback(result); });
                    });
                }
            };
            LZUTF8.enqueueImmediate(function () { return decompressBlocksStartingAt(0); });
        };
        AsyncDecompressor.createDecompressionStream = function () {
            var decompressor = new LZUTF8.Decompressor();
            var NodeStream = require("stream");
            var decompressionStream = new NodeStream.Transform({ decodeStrings: true, highWaterMark: 65536 });
            decompressionStream._transform = function (data, encoding, done) {
                try {
                    var buffer = new Buffer(decompressor.decompressBlock(new Uint8Array(data)));
                }
                catch (e) {
                    decompressionStream.emit("error", e);
                    return;
                }
                decompressionStream.push(buffer);
                done();
            };
            return decompressionStream;
        };
        return AsyncDecompressor;
    })();
    LZUTF8.AsyncDecompressor = AsyncDecompressor;
})(LZUTF8 || (LZUTF8 = {}));
var LZUTF8;
(function (LZUTF8) {
    var WebWorker = (function () {
        function WebWorker() {
        }
        WebWorker.compressAsync = function (input, options, callback) {
            var requestInputEncoding = options.inputEncoding;
            var requestOutputEncoding = options.outputEncoding;
            if (!WebWorker.supportsTransferableObjects) {
                if (options.inputEncoding == "ByteArray") {
                    try {
                        input = LZUTF8.decodeUTF8(input);
                    }
                    catch (e) {
                        callback(undefined, e);
                        return;
                    }
                    requestInputEncoding = "String";
                }
                if (options.outputEncoding == "ByteArray") {
                    requestOutputEncoding = "BinaryString";
                }
            }
            else {
                if (options.inputEncoding == "ByteArray") {
                    if (!(input instanceof Uint8Array)) {
                        callback(undefined, new TypeError("compressAsync: input is not a Uint8Array"));
                        return;
                    }
                }
            }
            var request = {
                token: Math.random().toString(),
                type: "compress",
                data: input,
                inputEncoding: requestInputEncoding,
                outputEncoding: requestOutputEncoding
            };
            if (request.inputEncoding == "ByteArray")
                WebWorker.globalWorker.postMessage(request, [(new Uint8Array(request.data)).buffer]);
            else
                WebWorker.globalWorker.postMessage(request, []);
            var responseListener = function (e) {
                var response = e.data;
                if (!response || response.token != request.token)
                    return;
                WebWorker.globalWorker.removeEventListener("message", responseListener);
                if (options.outputEncoding == "ByteArray" && response.inputEncoding == "BinaryString")
                    response.data = LZUTF8.decodeBinaryString(response.data);
                LZUTF8.enqueueImmediate(function () { return callback(response.data); });
            };
            WebWorker.globalWorker.addEventListener("message", responseListener);
            WebWorker.globalWorker.addEventListener("error", function (e) { callback(undefined, e); });
        };
        WebWorker.decompressAsync = function (input, options, callback) {
            var requestInputEncoding = options.inputEncoding;
            var requestOutputEncoding = options.outputEncoding;
            if (!WebWorker.supportsTransferableObjects) {
                if (options.inputEncoding == "ByteArray") {
                    try {
                        input = LZUTF8.encodeBinaryString(input);
                    }
                    catch (e) {
                        callback(undefined, e);
                        return;
                    }
                    requestInputEncoding = "BinaryString";
                }
                if (options.outputEncoding == "ByteArray") {
                    requestOutputEncoding = "String";
                }
            }
            var request = {
                token: Math.random().toString(),
                type: "decompress",
                data: input,
                inputEncoding: requestInputEncoding,
                outputEncoding: requestOutputEncoding
            };
            if (request.inputEncoding == "ByteArray")
                WebWorker.globalWorker.postMessage(request, [(new Uint8Array(request.data)).buffer]);
            else
                WebWorker.globalWorker.postMessage(request, []);
            var responseListener = function (e) {
                var response = e.data;
                if (!response || response.token != request.token)
                    return;
                WebWorker.globalWorker.removeEventListener("message", responseListener);
                if (options.outputEncoding == "ByteArray" && response.inputEncoding == "String")
                    response.data = LZUTF8.encodeUTF8(response.data);
                LZUTF8.enqueueImmediate(function () { return callback(response.data); });
            };
            WebWorker.globalWorker.addEventListener("message", responseListener);
            WebWorker.globalWorker.addEventListener("error", function (e) { callback(undefined, e); });
        };
        WebWorker.workerMessageHandler = function (e) {
            var request = e.data;
            if (request.type == "compress") {
                var compressedData = LZUTF8.compress(request.data, { outputEncoding: request.outputEncoding });
                var response = {
                    token: request.token,
                    type: "compressionResult",
                    data: compressedData,
                    inputEncoding: request.outputEncoding
                };
                if (response.inputEncoding == "ByteArray")
                    self.postMessage(response, [compressedData.buffer]);
                else
                    self.postMessage(response, []);
            }
            else if (request.type == "decompress") {
                var decompressedData = LZUTF8.decompress(request.data, { inputEncoding: request.inputEncoding, outputEncoding: request.outputEncoding });
                var response = {
                    token: request.token,
                    type: "decompressionResult",
                    data: decompressedData,
                    inputEncoding: request.outputEncoding
                };
                if (response.inputEncoding == "ByteArray")
                    self.postMessage(response, [decompressedData.buffer]);
                else
                    self.postMessage(response, []);
            }
        };
        WebWorker.registerListenerIfRunningInWebWorker = function () {
            if (typeof self == "object" && self.document === undefined && self.addEventListener != undefined) {
                self.addEventListener("message", WebWorker.workerMessageHandler);
                self.addEventListener("error", function (e) {
                    console.log("LZUTF8 WebWorker exception: " + e.message);
                });
            }
        };
        WebWorker.createGlobalWorkerIfItDoesntExist = function () {
            if (WebWorker.globalWorker)
                return;
            if (!WebWorker.isSupported())
                throw new Error("createGlobalWorkerIfItDoesntExist: Web workers are not supported or script source is not available");
            if (!WebWorker.scriptURI)
                WebWorker.scriptURI = document.getElementById("lzutf8").getAttribute("src");
            WebWorker.globalWorker = new Worker(WebWorker.scriptURI);
            WebWorker.supportsTransferableObjects = WebWorker.testSupportForTransferableObjects();
        };
        WebWorker.isSupported = function () {
            if (WebWorker.globalWorker)
                return true;
            if (typeof window != "object" || typeof window["Worker"] != "function")
                return false;
            if (WebWorker.scriptURI)
                return true;
            var scriptElement = document.getElementById("lzutf8");
            if (!scriptElement || scriptElement.tagName != "SCRIPT") {
                console.log("Cannot use a web worker as no script element with id 'lzutf8' was found in the page");
                return false;
            }
            return true;
        };
        WebWorker.testSupportForTransferableObjects = function () {
            if (typeof Uint8Array == "undefined")
                return false;
            if (!WebWorker.globalWorker)
                throw new Error("testSupportForTransferableObjects: No global worker created");
            var testArrayBuffer = new ArrayBuffer(1);
            var result;
            try {
                WebWorker.globalWorker.postMessage(testArrayBuffer, [testArrayBuffer]);
            }
            catch (e) {
                return false;
            }
            return (testArrayBuffer.byteLength === 0);
        };
        WebWorker.terminate = function () {
            if (WebWorker.globalWorker) {
                WebWorker.globalWorker.terminate();
                WebWorker.globalWorker = undefined;
            }
        };
        return WebWorker;
    })();
    LZUTF8.WebWorker = WebWorker;
    WebWorker.registerListenerIfRunningInWebWorker();
})(LZUTF8 || (LZUTF8 = {}));
var LZUTF8;
(function (LZUTF8) {
    var ArraySegment = (function () {
        function ArraySegment() {
        }
        ArraySegment.prototype.get = function (index) {
            return this.container[this.startPosition + index];
        };
        ArraySegment.prototype.getInReversedOrder = function (reverseIndex) {
            return this.container[this.startPosition + this.length - 1 - reverseIndex];
        };
        ArraySegment.prototype.set = function (index, value) {
            this.container[this.startPosition + index] = value;
        };
        return ArraySegment;
    })();
    LZUTF8.ArraySegment = ArraySegment;
})(LZUTF8 || (LZUTF8 = {}));
var LZUTF8;
(function (LZUTF8) {
    var ArrayTools = (function () {
        function ArrayTools() {
        }
        ArrayTools.copyElements = function (source, sourceIndex, destination, destinationIndex, count) {
            while (count--)
                destination[destinationIndex++] = source[sourceIndex++];
        };
        ArrayTools.zeroElements = function (collection, index, count) {
            while (count--)
                collection[index++] = 0;
        };
        ArrayTools.find = function (collection, itemToFind) {
            for (var i = 0; i < collection.length; i++)
                if (collection[i] === itemToFind)
                    return i;
            return -1;
        };
        ArrayTools.compareSequences = function (sequence1, sequence2) {
            var lengthMatched = true;
            var elementsMatched = true;
            if (sequence1.length !== sequence2.length) {
                console.log("Sequence length did not match: sequence 1 length is " + sequence1.length + ", sequence 2 length is " + sequence2.length);
                lengthMatched = false;
            }
            for (var i = 0; i < Math.min(sequence1.length, sequence2.length); i++)
                if (sequence1[i] !== sequence2[i]) {
                    console.log("Sequence elements did not match: sequence1[" + i + "] === " + sequence1[i] + ", sequence2[" + i + "] === " + sequence2[i]);
                    elementsMatched = false;
                    break;
                }
            return lengthMatched && elementsMatched;
        };
        ArrayTools.countNonzeroValuesInArray = function (array) {
            var result = 0;
            for (var i = 0; i < array.length; i++)
                if (array[i])
                    result++;
            return result;
        };
        ArrayTools.truncateStartingElements = function (array, truncatedLength) {
            if (array.length <= truncatedLength)
                throw new RangeError("truncateStartingElements: Requested length should be smaller than array length");
            var sourcePosition = array.length - truncatedLength;
            for (var i = 0; i < truncatedLength; i++)
                array[i] = array[sourcePosition + i];
            array.length = truncatedLength;
        };
        ArrayTools.doubleByteArrayCapacity = function (array) {
            var newArray = new Uint8Array(array.length * 2);
            newArray.set(array);
            return newArray;
        };
        ArrayTools.joinByteArrays = function (byteArrays) {
            var totalLength = 0;
            for (var i = 0; i < byteArrays.length; i++) {
                totalLength += byteArrays[i].length;
            }
            var result = new Uint8Array(totalLength);
            var currentOffset = 0;
            for (var i = 0; i < byteArrays.length; i++) {
                result.set(byteArrays[i], currentOffset);
                currentOffset += byteArrays[i].length;
            }
            return result;
        };
        ArrayTools.splitByteArray = function (byteArray, maxPartLength) {
            var result = [];
            for (var offset = 0; offset < byteArray.length;) {
                var blockLength = Math.min(maxPartLength, byteArray.length - offset);
                result.push(byteArray.subarray(offset, offset + blockLength));
                offset += blockLength;
            }
            return result;
        };
        ArrayTools.convertToUint8ArrayIfNeeded = function (input) {
            if (typeof Buffer === "function" && input instanceof Buffer)
                return new Uint8Array(input);
            else
                return input;
        };
        return ArrayTools;
    })();
    LZUTF8.ArrayTools = ArrayTools;
})(LZUTF8 || (LZUTF8 = {}));
var LZUTF8;
(function (LZUTF8) {
    var CompressionCommon = (function () {
        function CompressionCommon() {
        }
        CompressionCommon.getCroppedBuffer = function (buffer, cropStartOffset, cropLength, additionalCapacity) {
            if (additionalCapacity === void 0) { additionalCapacity = 0; }
            var croppedBuffer = new Uint8Array(cropLength + additionalCapacity);
            croppedBuffer.set(buffer.subarray(cropStartOffset, cropStartOffset + cropLength));
            return croppedBuffer;
        };
        CompressionCommon.getCroppedAndAppendedBuffer = function (buffer, cropStartOffset, cropLength, bufferToAppend) {
            return LZUTF8.ArrayTools.joinByteArrays([buffer.subarray(cropStartOffset, cropStartOffset + cropLength), bufferToAppend]);
        };
        CompressionCommon.detectCompressionSourceEncoding = function (input) {
            if (typeof input == "string")
                return "String";
            else
                return "ByteArray";
        };
        CompressionCommon.encodeCompressedBytes = function (compressedBytes, outputEncoding) {
            switch (outputEncoding) {
                case "ByteArray":
                    return compressedBytes;
                case "Buffer":
                    return new Buffer(compressedBytes);
                case "BinaryString":
                    return LZUTF8.encodeBinaryString(compressedBytes);
                case "Base64":
                    return LZUTF8.encodeBase64(compressedBytes);
                default:
                    throw new TypeError("encodeCompressedBytes: invalid output encoding requested");
            }
        };
        CompressionCommon.decodeCompressedData = function (compressedData, inputEncoding) {
            if (inputEncoding == "ByteArray" && typeof compressedData == "string")
                throw new TypeError("decodeCompressedData: receieved input was string when encoding was set to a ByteArray");
            switch (inputEncoding) {
                case "ByteArray":
                    return compressedData;
                case "BinaryString":
                    return LZUTF8.decodeBinaryString(compressedData);
                case "Base64":
                    return LZUTF8.decodeBase64(compressedData);
                default:
                    throw new TypeError("decodeCompressedData: invalid input encoding requested");
            }
        };
        CompressionCommon.encodeDecompressedBytes = function (decompressedBytes, outputEncoding) {
            switch (outputEncoding) {
                case "ByteArray":
                    return decompressedBytes;
                case "Buffer":
                    return new Buffer(decompressedBytes);
                case "String":
                    return LZUTF8.decodeUTF8(decompressedBytes);
                default:
                    throw new TypeError("encodeDecompressedBytes: invalid output encoding requested");
            }
        };
        return CompressionCommon;
    })();
    LZUTF8.CompressionCommon = CompressionCommon;
})(LZUTF8 || (LZUTF8 = {}));
var LZUTF8;
(function (LZUTF8) {
    var EventLoop = (function () {
        function EventLoop() {
        }
        EventLoop.enqueueImmediate = function (func) {
            if (LZUTF8.runningInNodeJS()) {
                setImmediate(func);
            }
            else if ((typeof window === "object") && (window.postMessage !== undefined)) {
                if (!EventLoop.instanceToken)
                    EventLoop.registerWindowMessageHandler();
                EventLoop.queuedFunctions.push(func);
                window.postMessage(EventLoop.instanceToken, window.location.href);
            }
            else {
                setTimeout(func, 0);
            }
        };
        EventLoop.registerWindowMessageHandler = function () {
            var _this = this;
            EventLoop.instanceToken = "EventLoop.enqueueImmediate-" + Math.random();
            EventLoop.queuedFunctions = [];
            window.addEventListener("message", function (event) {
                if (event.data != EventLoop.instanceToken || _this.queuedFunctions.length === 0)
                    return;
                var queuedFunction = EventLoop.queuedFunctions.shift();
                try {
                    queuedFunction.call(undefined);
                }
                catch (exception) {
                    if (typeof exception == "object")
                        console.log("enqueueImmediate exception: " + JSON.stringify(exception));
                    else
                        console.log("enqueueImmediate exception: " + exception);
                }
            });
        };
        return EventLoop;
    })();
    LZUTF8.EventLoop = EventLoop;
    LZUTF8.enqueueImmediate = EventLoop.enqueueImmediate;
})(LZUTF8 || (LZUTF8 = {}));
var LZUTF8;
(function (LZUTF8) {
    var ObjectTools = (function () {
        function ObjectTools() {
        }
        ObjectTools.extendObject = function (obj, newProperties) {
            if (newProperties != null) {
                for (var property in newProperties)
                    obj[property] = newProperties[property];
            }
            return obj;
        };
        ObjectTools.findPropertyInObject = function (propertyToFind, object) {
            for (var property in object)
                if (object[property] === propertyToFind)
                    return property;
            return null;
        };
        return ObjectTools;
    })();
    LZUTF8.ObjectTools = ObjectTools;
})(LZUTF8 || (LZUTF8 = {}));
var LZUTF8;
(function (LZUTF8) {
    var StringBuilder = (function () {
        function StringBuilder() {
            this.outputBuffer = new Array(1024);
            this.outputPosition = 0;
            this.outputString = "";
        }
        StringBuilder.prototype.append = function (charCode) {
            this.outputBuffer[this.outputPosition++] = charCode;
            if (this.outputPosition === 1024)
                this.flushBufferToOutputString();
        };
        StringBuilder.prototype.appendCodePoint = function (codePoint) {
            if (codePoint <= 0xFFFF) {
                this.append(codePoint);
            }
            else if (codePoint <= 0x10FFFF) {
                this.append(0xD800 + ((codePoint - 0x10000) >>> 10));
                this.append(0xDC00 + ((codePoint - 0x10000) & 1023));
            }
            else
                throw new RangeError("StringBuilder.appendCodePoint: A code point of " + codePoint + " cannot be encoded in UTF-16");
        };
        StringBuilder.prototype.toString = function () {
            this.flushBufferToOutputString();
            return this.outputString;
        };
        StringBuilder.prototype.flushBufferToOutputString = function () {
            if (this.outputPosition === 1024)
                this.outputString += String.fromCharCode.apply(null, this.outputBuffer);
            else
                this.outputString += String.fromCharCode.apply(null, this.outputBuffer.slice(0, this.outputPosition));
            this.outputPosition = 0;
        };
        return StringBuilder;
    })();
    LZUTF8.StringBuilder = StringBuilder;
})(LZUTF8 || (LZUTF8 = {}));
var LZUTF8;
(function (LZUTF8) {
    var Timer = (function () {
        function Timer(timestampFunc) {
            if (timestampFunc)
                this.getTimestamp = timestampFunc;
            else
                this.getTimestamp = Timer.getHighResolutionTimestampFunction();
            this.restart();
        }
        Timer.prototype.restart = function () {
            this.startTime = this.getTimestamp();
        };
        Timer.prototype.getElapsedTime = function () {
            return this.getTimestamp() - this.startTime;
        };
        Timer.prototype.getElapsedTimeAndRestart = function () {
            var elapsedTime = this.getElapsedTime();
            this.restart();
            return elapsedTime;
        };
        Timer.prototype.logAndRestart = function (title, logToDocument) {
            if (logToDocument === void 0) { logToDocument = false; }
            var message = title + ": " + this.getElapsedTime().toFixed(3);
            console.log(message);
            if (logToDocument && typeof document == "object")
                document.body.innerHTML += message + "<br/>";
            this.restart();
        };
        Timer.prototype.getTimestamp = function () {
            return undefined;
        };
        Timer.getHighResolutionTimestampFunction = function () {
            if (typeof chrome == "object" && chrome.Interval) {
                var chromeIntervalObject = new chrome.Interval();
                chromeIntervalObject.start();
                return function () { return chromeIntervalObject.microseconds() / 1000; };
            }
            else if (typeof window == "object" && window.performance && window.performance.now) {
                return function () { return window.performance.now(); };
            }
            else if (typeof process == "object" && process.hrtime) {
                return function () {
                    var timeStamp = process.hrtime();
                    return (timeStamp[0] * 1000) + (timeStamp[1] / 1000000);
                };
            }
            else if (Date.now) {
                return function () { return Date.now(); };
            }
            else {
                return function () { return (new Date()).getTime(); };
            }
        };
        return Timer;
    })();
    LZUTF8.Timer = Timer;
})(LZUTF8 || (LZUTF8 = {}));
var LZUTF8;
(function (LZUTF8) {
    var Compressor = (function () {
        function Compressor(useCustomHashTable) {
            if (useCustomHashTable === void 0) { useCustomHashTable = true; }
            this.MinimumSequenceLength = 4;
            this.MaximumSequenceLength = 31;
            this.MaximumMatchDistance = 32767;
            this.PrefixHashTableSize = 65537;
            this.inputBufferStreamOffset = 1;
            this.reusableArraySegmentObject = new LZUTF8.ArraySegment();
            if (useCustomHashTable && typeof Uint32Array == "function")
                this.prefixHashTable = new LZUTF8.CompressorCustomHashTable(this.PrefixHashTableSize);
            else
                this.prefixHashTable = new LZUTF8.CompressorSimpleHashTable(this.PrefixHashTableSize);
        }
        Compressor.prototype.compressBlock = function (input) {
            if (input === undefined || input === null)
                throw new TypeError("compressBlock: undefined or null input received");
            if (typeof input == "string")
                input = LZUTF8.encodeUTF8(input);
            input = LZUTF8.ArrayTools.convertToUint8ArrayIfNeeded(input);
            return this.compressByteArrayBlock(input);
        };
        Compressor.prototype.compressByteArrayBlock = function (utf8Bytes) {
            if (!utf8Bytes || utf8Bytes.length == 0)
                return new Uint8Array(0);
            var bufferStartingReadOffset = this.cropAndAddNewBytesToInputBuffer(utf8Bytes);
            var inputBuffer = this.inputBuffer;
            var inputBufferLength = this.inputBuffer.length;
            this.outputBuffer = new Uint8Array(utf8Bytes.length);
            this.outputBufferPosition = 0;
            var latestMatchEndPosition = 0;
            for (var readPosition = bufferStartingReadOffset; readPosition < inputBufferLength; readPosition++) {
                var inputValue = inputBuffer[readPosition];
                var withinAMatchedRange = readPosition < latestMatchEndPosition;
                if (readPosition > inputBufferLength - this.MinimumSequenceLength) {
                    if (!withinAMatchedRange)
                        this.outputRawByte(inputValue);
                    continue;
                }
                var targetBucketIndex = this.getBucketIndexForPrefix(readPosition);
                if (!withinAMatchedRange) {
                    var matchLocator = this.findLongestMatch(readPosition, targetBucketIndex);
                    if (matchLocator !== null) {
                        this.outputPointerBytes(matchLocator.length, matchLocator.distance);
                        latestMatchEndPosition = readPosition + matchLocator.length;
                        withinAMatchedRange = true;
                    }
                }
                if (!withinAMatchedRange)
                    this.outputRawByte(inputValue);
                var inputStreamPosition = this.inputBufferStreamOffset + readPosition;
                this.prefixHashTable.addValueToBucket(targetBucketIndex, inputStreamPosition);
            }
            return this.outputBuffer.subarray(0, this.outputBufferPosition);
        };
        Compressor.prototype.findLongestMatch = function (matchedSequencePosition, bucketIndex) {
            var bucket = this.prefixHashTable.getArraySegmentForBucketIndex(bucketIndex, this.reusableArraySegmentObject);
            if (bucket == null)
                return null;
            var input = this.inputBuffer;
            var longestMatchDistance;
            var longestMatchLength;
            for (var i = 0; i < bucket.length; i++) {
                var testedSequencePosition = bucket.getInReversedOrder(i) - this.inputBufferStreamOffset;
                var testedSequenceDistance = matchedSequencePosition - testedSequencePosition;
                if (longestMatchDistance === undefined)
                    var lengthToSurpass = this.MinimumSequenceLength - 1;
                else if (longestMatchDistance < 128 && testedSequenceDistance >= 128)
                    var lengthToSurpass = longestMatchLength + (longestMatchLength >>> 1);
                else
                    var lengthToSurpass = longestMatchLength;
                if (testedSequenceDistance > this.MaximumMatchDistance ||
                    lengthToSurpass >= this.MaximumSequenceLength ||
                    matchedSequencePosition + lengthToSurpass >= input.length)
                    break;
                if (input[testedSequencePosition + lengthToSurpass] !== input[matchedSequencePosition + lengthToSurpass])
                    continue;
                for (var offset = 0;; offset++) {
                    if (matchedSequencePosition + offset === input.length ||
                        input[testedSequencePosition + offset] !== input[matchedSequencePosition + offset]) {
                        if (offset > lengthToSurpass) {
                            longestMatchDistance = testedSequenceDistance;
                            longestMatchLength = offset;
                        }
                        break;
                    }
                    else if (offset === this.MaximumSequenceLength)
                        return { distance: testedSequenceDistance, length: this.MaximumSequenceLength };
                }
            }
            if (longestMatchDistance !== undefined)
                return { distance: longestMatchDistance, length: longestMatchLength };
            else
                return null;
        };
        Compressor.prototype.getBucketIndexForPrefix = function (startPosition) {
            return (this.inputBuffer[startPosition] * 7880599 +
                this.inputBuffer[startPosition + 1] * 39601 +
                this.inputBuffer[startPosition + 2] * 199 +
                this.inputBuffer[startPosition + 3]) % this.PrefixHashTableSize;
        };
        Compressor.prototype.outputPointerBytes = function (length, distance) {
            if (distance < 128) {
                this.outputRawByte(192 | length);
                this.outputRawByte(distance);
            }
            else {
                this.outputRawByte(224 | length);
                this.outputRawByte(distance >>> 8);
                this.outputRawByte(distance & 255);
            }
        };
        Compressor.prototype.outputRawByte = function (value) {
            this.outputBuffer[this.outputBufferPosition++] = value;
        };
        Compressor.prototype.cropAndAddNewBytesToInputBuffer = function (newInput) {
            if (this.inputBuffer === undefined) {
                this.inputBuffer = newInput;
                return 0;
            }
            else {
                var cropLength = Math.min(this.inputBuffer.length, this.MaximumMatchDistance);
                var cropStartOffset = this.inputBuffer.length - cropLength;
                this.inputBuffer = LZUTF8.CompressionCommon.getCroppedAndAppendedBuffer(this.inputBuffer, cropStartOffset, cropLength, newInput);
                this.inputBufferStreamOffset += cropStartOffset;
                return cropLength;
            }
        };
        Compressor.prototype.logStatisticsToConsole = function (bytesRead) {
            var usedBucketCount = this.prefixHashTable.getUsedBucketCount();
            var totalHashtableElementCount = this.prefixHashTable.getTotalElementCount();
            console.log("Compressed size: " + this.outputBufferPosition + "/" + bytesRead + " (" + (this.outputBufferPosition / bytesRead * 100).toFixed(2) + "%)");
            console.log("Occupied bucket count: " + usedBucketCount + "/" + this.PrefixHashTableSize);
            console.log("Total hashtable element count: " + totalHashtableElementCount + " (" + (totalHashtableElementCount / usedBucketCount).toFixed(2) + " elements per occupied bucket on average)");
            console.log("");
        };
        return Compressor;
    })();
    LZUTF8.Compressor = Compressor;
})(LZUTF8 || (LZUTF8 = {}));
var LZUTF8;
(function (LZUTF8) {
    var CompressorCustomHashTable = (function () {
        function CompressorCustomHashTable(bucketCount) {
            this.minimumBucketCapacity = 4;
            this.maximumBucketCapacity = 64;
            this.bucketLocators = new Uint32Array(bucketCount * 2);
            this.storage = new Uint32Array(bucketCount * 2);
            this.storageIndex = 1;
        }
        CompressorCustomHashTable.prototype.addValueToBucket = function (bucketIndex, valueToAdd) {
            bucketIndex <<= 1;
            if (this.storageIndex >= (this.storage.length >>> 1))
                this.compact();
            var startPosition = this.bucketLocators[bucketIndex];
            if (startPosition === 0) {
                startPosition = this.storageIndex;
                var length = 1;
                this.storage[this.storageIndex] = valueToAdd;
                this.storageIndex += this.minimumBucketCapacity;
            }
            else {
                var length = this.bucketLocators[bucketIndex + 1];
                if (length === this.maximumBucketCapacity - 1)
                    length = this.truncateBucketToNewerElements(startPosition, length, this.maximumBucketCapacity / 2);
                var endPosition = startPosition + length;
                if (this.storage[endPosition] === 0) {
                    this.storage[endPosition] = valueToAdd;
                    if (endPosition === this.storageIndex)
                        this.storageIndex += length;
                }
                else {
                    LZUTF8.ArrayTools.copyElements(this.storage, startPosition, this.storage, this.storageIndex, length);
                    startPosition = this.storageIndex;
                    this.storageIndex += length;
                    this.storage[this.storageIndex++] = valueToAdd;
                    this.storageIndex += length;
                }
                length++;
            }
            this.bucketLocators[bucketIndex] = startPosition;
            this.bucketLocators[bucketIndex + 1] = length;
        };
        CompressorCustomHashTable.prototype.truncateBucketToNewerElements = function (startPosition, bucketLength, truncatedBucketLength) {
            var sourcePosition = startPosition + bucketLength - truncatedBucketLength;
            LZUTF8.ArrayTools.copyElements(this.storage, sourcePosition, this.storage, startPosition, truncatedBucketLength);
            LZUTF8.ArrayTools.zeroElements(this.storage, startPosition + truncatedBucketLength, bucketLength - truncatedBucketLength);
            return truncatedBucketLength;
        };
        CompressorCustomHashTable.prototype.compact = function () {
            var oldBucketLocators = this.bucketLocators;
            var oldStorage = this.storage;
            this.bucketLocators = new Uint32Array(this.bucketLocators.length);
            this.storageIndex = 1;
            for (var bucketIndex = 0; bucketIndex < oldBucketLocators.length; bucketIndex += 2) {
                var length = oldBucketLocators[bucketIndex + 1];
                if (length === 0)
                    continue;
                this.bucketLocators[bucketIndex] = this.storageIndex;
                this.bucketLocators[bucketIndex + 1] = length;
                this.storageIndex += Math.max(Math.min(length * 2, this.maximumBucketCapacity), this.minimumBucketCapacity);
            }
            this.storage = new Uint32Array(this.storageIndex * 8);
            for (var bucketIndex = 0; bucketIndex < oldBucketLocators.length; bucketIndex += 2) {
                var sourcePosition = oldBucketLocators[bucketIndex];
                if (sourcePosition === 0)
                    continue;
                var destPosition = this.bucketLocators[bucketIndex];
                var length = this.bucketLocators[bucketIndex + 1];
                LZUTF8.ArrayTools.copyElements(oldStorage, sourcePosition, this.storage, destPosition, length);
            }
        };
        CompressorCustomHashTable.prototype.getArraySegmentForBucketIndex = function (bucketIndex, outputObject) {
            bucketIndex <<= 1;
            var startPosition = this.bucketLocators[bucketIndex];
            if (startPosition === 0)
                return null;
            if (outputObject === undefined)
                outputObject = new LZUTF8.ArraySegment();
            outputObject.container = this.storage;
            outputObject.startPosition = startPosition;
            outputObject.length = this.bucketLocators[bucketIndex + 1];
            return outputObject;
        };
        CompressorCustomHashTable.prototype.getUsedBucketCount = function () {
            return Math.floor(LZUTF8.ArrayTools.countNonzeroValuesInArray(this.bucketLocators) / 2);
        };
        CompressorCustomHashTable.prototype.getTotalElementCount = function () {
            var result = 0;
            for (var i = 0; i < this.bucketLocators.length; i += 2)
                result += this.bucketLocators[i + 1];
            return result;
        };
        return CompressorCustomHashTable;
    })();
    LZUTF8.CompressorCustomHashTable = CompressorCustomHashTable;
})(LZUTF8 || (LZUTF8 = {}));
var LZUTF8;
(function (LZUTF8) {
    var CompressorSimpleHashTable = (function () {
        function CompressorSimpleHashTable(size) {
            this.maximumBucketCapacity = 64;
            this.buckets = new Array(size);
        }
        CompressorSimpleHashTable.prototype.addValueToBucket = function (bucketIndex, valueToAdd) {
            var bucket = this.buckets[bucketIndex];
            if (bucket === undefined) {
                this.buckets[bucketIndex] = [valueToAdd];
            }
            else {
                if (bucket.length === this.maximumBucketCapacity - 1)
                    LZUTF8.ArrayTools.truncateStartingElements(bucket, this.maximumBucketCapacity / 2);
                bucket.push(valueToAdd);
            }
        };
        CompressorSimpleHashTable.prototype.getArraySegmentForBucketIndex = function (bucketIndex, outputObject) {
            var bucket = this.buckets[bucketIndex];
            if (bucket === undefined)
                return null;
            if (outputObject === undefined)
                outputObject = new LZUTF8.ArraySegment();
            outputObject.container = bucket;
            outputObject.startPosition = 0;
            outputObject.length = bucket.length;
            return outputObject;
        };
        CompressorSimpleHashTable.prototype.getUsedBucketCount = function () {
            return LZUTF8.ArrayTools.countNonzeroValuesInArray(this.buckets);
        };
        CompressorSimpleHashTable.prototype.getTotalElementCount = function () {
            var currentSum = 0;
            for (var i = 0; i < this.buckets.length; i++) {
                if (this.buckets[i] !== undefined)
                    currentSum += this.buckets[i].length;
            }
            return currentSum;
        };
        return CompressorSimpleHashTable;
    })();
    LZUTF8.CompressorSimpleHashTable = CompressorSimpleHashTable;
})(LZUTF8 || (LZUTF8 = {}));
var LZUTF8;
(function (LZUTF8) {
    var Decompressor = (function () {
        function Decompressor() {
            this.MaximumMatchDistance = 32767;
            this.outputPosition = 0;
        }
        Decompressor.prototype.decompressBlockToString = function (input) {
            input = LZUTF8.ArrayTools.convertToUint8ArrayIfNeeded(input);
            return LZUTF8.decodeUTF8(this.decompressBlock(input));
        };
        Decompressor.prototype.decompressBlock = function (input) {
            if (input === undefined || input === null)
                throw new TypeError("decompressBlock: undefined or null input received");
            input = LZUTF8.ArrayTools.convertToUint8ArrayIfNeeded(input);
            if (this.inputBufferRemainder) {
                input = LZUTF8.ArrayTools.joinByteArrays([this.inputBufferRemainder, input]);
                this.inputBufferRemainder = undefined;
            }
            var outputStartPosition = this.cropOutputBufferToWindowAndInitialize(Math.max(input.length * 4, 1024));
            for (var readPosition = 0, inputLength = input.length; readPosition < inputLength; readPosition++) {
                var inputValue = input[readPosition];
                if (inputValue >>> 6 != 3) {
                    this.outputByte(inputValue);
                    continue;
                }
                var sequenceLengthIdentifier = inputValue >>> 5;
                if (readPosition == inputLength - 1 ||
                    (readPosition == inputLength - 2 && sequenceLengthIdentifier == 7)) {
                    this.inputBufferRemainder = input.subarray(readPosition);
                    break;
                }
                if (input[readPosition + 1] >>> 7 === 1) {
                    this.outputByte(inputValue);
                }
                else {
                    var matchLength = inputValue & 31;
                    var matchDistance;
                    if (sequenceLengthIdentifier == 6) {
                        matchDistance = input[readPosition + 1];
                        readPosition += 1;
                    }
                    else {
                        matchDistance = (input[readPosition + 1] << 8) | (input[readPosition + 2]);
                        readPosition += 2;
                    }
                    var matchPosition = this.outputPosition - matchDistance;
                    for (var offset = 0; offset < matchLength; offset++)
                        this.outputByte(this.outputBuffer[matchPosition + offset]);
                }
            }
            this.rollBackIfOutputBufferEndsWithATruncatedMultibyteSequence();
            return LZUTF8.CompressionCommon.getCroppedBuffer(this.outputBuffer, outputStartPosition, this.outputPosition - outputStartPosition);
        };
        Decompressor.prototype.outputByte = function (value) {
            if (this.outputPosition === this.outputBuffer.length)
                this.outputBuffer = LZUTF8.ArrayTools.doubleByteArrayCapacity(this.outputBuffer);
            this.outputBuffer[this.outputPosition++] = value;
        };
        Decompressor.prototype.cropOutputBufferToWindowAndInitialize = function (initialCapacity) {
            if (!this.outputBuffer) {
                this.outputBuffer = new Uint8Array(initialCapacity);
                return 0;
            }
            var cropLength = Math.min(this.outputPosition, this.MaximumMatchDistance);
            this.outputBuffer = LZUTF8.CompressionCommon.getCroppedBuffer(this.outputBuffer, this.outputPosition - cropLength, cropLength, initialCapacity);
            this.outputPosition = cropLength;
            if (this.outputBufferRemainder) {
                for (var i = 0; i < this.outputBufferRemainder.length; i++)
                    this.outputByte(this.outputBufferRemainder[i]);
                this.outputBufferRemainder = undefined;
            }
            return cropLength;
        };
        Decompressor.prototype.rollBackIfOutputBufferEndsWithATruncatedMultibyteSequence = function () {
            for (var offset = 1; offset <= 4 && this.outputPosition - offset >= 0; offset++) {
                var value = this.outputBuffer[this.outputPosition - offset];
                if ((offset < 4 && (value >>> 3) === 30) ||
                    (offset < 3 && (value >>> 4) === 14) ||
                    (offset < 2 && (value >>> 5) === 6)) {
                    this.outputBufferRemainder = this.outputBuffer.subarray(this.outputPosition - offset, this.outputPosition);
                    this.outputPosition -= offset;
                    return;
                }
            }
        };
        return Decompressor;
    })();
    LZUTF8.Decompressor = Decompressor;
})(LZUTF8 || (LZUTF8 = {}));
var LZUTF8;
(function (LZUTF8) {
    var Encoding;
    (function (Encoding) {
        var Base64 = (function () {
            function Base64() {
            }
            Base64.encode = function (inputArray, addPadding) {
                if (addPadding === void 0) { addPadding = true; }
                if (inputArray == null)
                    throw new TypeError("Base64.encode: invalid input type");
                if (inputArray.length == 0)
                    return "";
                var map = Encoding.Base64.charCodeMap;
                var output = new LZUTF8.StringBuilder();
                var uint24;
                for (var readPosition = 0, length = inputArray.length; readPosition < length; readPosition += 3) {
                    if (readPosition <= length - 3) {
                        uint24 = inputArray[readPosition] << 16 | inputArray[readPosition + 1] << 8 | inputArray[readPosition + 2];
                        output.append(map[(uint24 >>> 18) & 63]);
                        output.append(map[(uint24 >>> 12) & 63]);
                        output.append(map[(uint24 >>> 6) & 63]);
                        output.append(map[(uint24) & 63]);
                        uint24 = 0;
                    }
                    else if (readPosition === length - 2) {
                        uint24 = inputArray[readPosition] << 16 | inputArray[readPosition + 1] << 8;
                        output.append(map[(uint24 >>> 18) & 63]);
                        output.append(map[(uint24 >>> 12) & 63]);
                        output.append(map[(uint24 >>> 6) & 63]);
                        if (addPadding)
                            output.append(Encoding.Base64.paddingCharCode);
                    }
                    else if (readPosition === length - 1) {
                        uint24 = inputArray[readPosition] << 16;
                        output.append(map[(uint24 >>> 18) & 63]);
                        output.append(map[(uint24 >>> 12) & 63]);
                        if (addPadding) {
                            output.append(Encoding.Base64.paddingCharCode);
                            output.append(Encoding.Base64.paddingCharCode);
                        }
                    }
                }
                return output.toString();
            };
            Base64.decode = function (base64String, outputBuffer) {
                if (typeof base64String !== "string")
                    throw new TypeError("Base64.decode: invalid input type");
                if (base64String.length === 0)
                    return new Uint8Array(0);
                var lengthModulo4 = base64String.length % 4;
                if (lengthModulo4 === 1)
                    throw new Error("Invalid Base64 string: length % 4 == 1");
                else if (lengthModulo4 === 2)
                    base64String += Encoding.Base64.paddingCharacter + Encoding.Base64.paddingCharacter;
                else if (lengthModulo4 === 3)
                    base64String += Encoding.Base64.paddingCharacter;
                var reverseCharCodeMap = Encoding.Base64.reverseCharCodeMap;
                if (!outputBuffer)
                    outputBuffer = new Uint8Array(base64String.length);
                var outputPosition = 0;
                for (var i = 0, length = base64String.length; i < length; i += 4) {
                    var uint24 = (reverseCharCodeMap[base64String.charCodeAt(i)] << 18) |
                        (reverseCharCodeMap[base64String.charCodeAt(i + 1)] << 12) |
                        (reverseCharCodeMap[base64String.charCodeAt(i + 2)] << 6) |
                        (reverseCharCodeMap[base64String.charCodeAt(i + 3)]);
                    outputBuffer[outputPosition++] = (uint24 >>> 16) & 255;
                    outputBuffer[outputPosition++] = (uint24 >>> 8) & 255;
                    outputBuffer[outputPosition++] = (uint24) & 255;
                }
                if (base64String.charAt(length - 1) == Encoding.Base64.paddingCharacter)
                    outputPosition--;
                if (base64String.charAt(length - 2) == Encoding.Base64.paddingCharacter)
                    outputPosition--;
                return outputBuffer.subarray(0, outputPosition);
            };
            Base64.paddingCharacter = '=';
            Base64.charCodeMap = new Uint8Array([65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 43, 47]);
            Base64.paddingCharCode = 61;
            Base64.reverseCharCodeMap = new Uint8Array([255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 62, 255, 255, 255, 63, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 255, 255, 255, 0, 255, 255, 255, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 255, 255, 255, 255, 255, 255, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 255, 255, 255, 255]);
            return Base64;
        })();
        Encoding.Base64 = Base64;
    })(Encoding = LZUTF8.Encoding || (LZUTF8.Encoding = {}));
})(LZUTF8 || (LZUTF8 = {}));
var LZUTF8;
(function (LZUTF8) {
    var Encoding;
    (function (Encoding) {
        var BinaryString = (function () {
            function BinaryString() {
            }
            BinaryString.encode = function (input) {
                if (input == null)
                    throw new TypeError("BinaryString.encode: undefined or null input received");
                if (input.length === 0)
                    return "";
                var inputLength = input.length;
                var outputStringBuilder = new LZUTF8.StringBuilder();
                var remainder = 0;
                var state = 1;
                for (var i = 0; i < inputLength; i += 2) {
                    if (i == inputLength - 1)
                        var value = (input[i] << 8);
                    else
                        var value = (input[i] << 8) | input[i + 1];
                    outputStringBuilder.append((remainder << (16 - state)) | value >>> state);
                    remainder = value & ((1 << state) - 1);
                    if (state === 15) {
                        outputStringBuilder.append(remainder);
                        remainder = 0;
                        state = 1;
                    }
                    else {
                        state += 1;
                    }
                    if (i >= inputLength - 2)
                        outputStringBuilder.append(remainder << (16 - state));
                }
                outputStringBuilder.append(32768 | (inputLength % 2));
                return outputStringBuilder.toString();
            };
            BinaryString.decode = function (input) {
                if (typeof input !== "string")
                    throw new TypeError("BinaryString.decode: invalid input type");
                if (input == "")
                    return new Uint8Array(0);
                var output = new Uint8Array(input.length * 3);
                var outputPosition = 0;
                var appendToOutput = function (value) {
                    output[outputPosition++] = value >>> 8;
                    output[outputPosition++] = value & 255;
                };
                var remainder;
                var state = 0;
                for (var i = 0; i < input.length; i++) {
                    var value = input.charCodeAt(i);
                    if (value >= 32768) {
                        if (value == (32768 | 1))
                            outputPosition--;
                        state = 0;
                        continue;
                    }
                    if (state == 0) {
                        remainder = value;
                    }
                    else {
                        appendToOutput((remainder << state) | (value >>> (15 - state)));
                        remainder = value & ((1 << (15 - state)) - 1);
                    }
                    if (state == 15)
                        state = 0;
                    else
                        state += 1;
                }
                return output.subarray(0, outputPosition);
            };
            return BinaryString;
        })();
        Encoding.BinaryString = BinaryString;
    })(Encoding = LZUTF8.Encoding || (LZUTF8.Encoding = {}));
})(LZUTF8 || (LZUTF8 = {}));
var LZUTF8;
(function (LZUTF8) {
    var Encoding;
    (function (Encoding) {
        var Misc = (function () {
            function Misc() {
            }
            Misc.binaryBytesToDecimalString = function (binaryBytes) {
                var resultArray = [];
                for (var i = 0; i < binaryBytes.length; i++)
                    resultArray.push(Encoding.Misc.binaryBytesToDecimalStringLookupTable[binaryBytes[i]]);
                return resultArray.join(" ");
            };
            Misc.binaryBytesToDecimalStringLookupTable = ["000", "001", "002", "003", "004", "005", "006", "007", "008", "009", "010", "011", "012", "013", "014", "015", "016", "017", "018", "019", "020", "021", "022", "023", "024", "025", "026", "027", "028", "029", "030", "031", "032", "033", "034", "035", "036", "037", "038", "039", "040", "041", "042", "043", "044", "045", "046", "047", "048", "049", "050", "051", "052", "053", "054", "055", "056", "057", "058", "059", "060", "061", "062", "063", "064", "065", "066", "067", "068", "069", "070", "071", "072", "073", "074", "075", "076", "077", "078", "079", "080", "081", "082", "083", "084", "085", "086", "087", "088", "089", "090", "091", "092", "093", "094", "095", "096", "097", "098", "099", "100", "101", "102", "103", "104", "105", "106", "107", "108", "109", "110", "111", "112", "113", "114", "115", "116", "117", "118", "119", "120", "121", "122", "123", "124", "125", "126", "127", "128", "129", "130", "131", "132", "133", "134", "135", "136", "137", "138", "139", "140", "141", "142", "143", "144", "145", "146", "147", "148", "149", "150", "151", "152", "153", "154", "155", "156", "157", "158", "159", "160", "161", "162", "163", "164", "165", "166", "167", "168", "169", "170", "171", "172", "173", "174", "175", "176", "177", "178", "179", "180", "181", "182", "183", "184", "185", "186", "187", "188", "189", "190", "191", "192", "193", "194", "195", "196", "197", "198", "199", "200", "201", "202", "203", "204", "205", "206", "207", "208", "209", "210", "211", "212", "213", "214", "215", "216", "217", "218", "219", "220", "221", "222", "223", "224", "225", "226", "227", "228", "229", "230", "231", "232", "233", "234", "235", "236", "237", "238", "239", "240", "241", "242", "243", "244", "245", "246", "247", "248", "249", "250", "251", "252", "253", "254", "255"];
            return Misc;
        })();
        Encoding.Misc = Misc;
    })(Encoding = LZUTF8.Encoding || (LZUTF8.Encoding = {}));
})(LZUTF8 || (LZUTF8 = {}));
var LZUTF8;
(function (LZUTF8) {
    var Encoding;
    (function (Encoding) {
        var UTF8 = (function () {
            function UTF8() {
            }
            UTF8.encode = function (str, outputArray) {
                if (typeof str !== "string")
                    throw new TypeError("UTF8.encode: null, undefined or invalid input type");
                if (str.length == 0)
                    return new Uint8Array(0);
                if (!outputArray)
                    outputArray = new Uint8Array(str.length * 4);
                var writeIndex = 0;
                for (var readIndex = 0; readIndex < str.length; readIndex++) {
                    var charCode = Encoding.UTF8.getUnicodeCodePoint(str, readIndex);
                    if (charCode < 128) {
                        outputArray[writeIndex++] = charCode;
                    }
                    else if (charCode < 2048) {
                        outputArray[writeIndex++] = 192 | (charCode >>> 6);
                        outputArray[writeIndex++] = 128 | (charCode & 63);
                    }
                    else if (charCode < 65536) {
                        outputArray[writeIndex++] = 224 | (charCode >>> 12);
                        outputArray[writeIndex++] = 128 | ((charCode >>> 6) & 63);
                        outputArray[writeIndex++] = 128 | (charCode & 63);
                    }
                    else if (charCode < 1114112) {
                        outputArray[writeIndex++] = 240 | (charCode >>> 18);
                        outputArray[writeIndex++] = 128 | ((charCode >>> 12) & 63);
                        outputArray[writeIndex++] = 128 | ((charCode >>> 6) & 63);
                        outputArray[writeIndex++] = 128 | (charCode & 63);
                        readIndex++;
                    }
                    else
                        throw new Error("UTF8.encode: Invalid UTF-16 string: Encountered a character unsupported by UTF-8/16 (RFC 3629)");
                }
                return outputArray.subarray(0, writeIndex);
            };
            UTF8.decode = function (utf8Bytes) {
                if (utf8Bytes == null)
                    throw new TypeError("UTF8.decode: null or undefined input type recieved");
                if (utf8Bytes.length == 0)
                    return "";
                var output = new LZUTF8.StringBuilder();
                var outputCodePoint, leadByte;
                for (var readIndex = 0, length = utf8Bytes.length; readIndex < length;) {
                    leadByte = utf8Bytes[readIndex];
                    if ((leadByte >>> 7) === 0) {
                        outputCodePoint = leadByte;
                        readIndex += 1;
                    }
                    else if ((leadByte >>> 5) === 6) {
                        if (readIndex + 1 >= length)
                            throw new Error("UTF8.decode: Invalid UTF-8 stream: Truncated codepoint sequence encountered at position " + readIndex);
                        outputCodePoint = ((leadByte & 31) << 6) | (utf8Bytes[readIndex + 1] & 63);
                        readIndex += 2;
                    }
                    else if ((leadByte >>> 4) === 14) {
                        if (readIndex + 2 >= length)
                            throw new Error("UTF8.decode: Invalid UTF-8 stream: Truncated codepoint sequence encountered at position " + readIndex);
                        outputCodePoint = ((leadByte & 15) << 12) | ((utf8Bytes[readIndex + 1] & 63) << 6) | (utf8Bytes[readIndex + 2] & 63);
                        readIndex += 3;
                    }
                    else if ((leadByte >>> 3) === 30) {
                        if (readIndex + 3 >= length)
                            throw new Error("UTF8.decode: Invalid UTF-8 stream: Truncated codepoint sequence encountered at position " + readIndex);
                        outputCodePoint = ((leadByte & 7) << 18) | ((utf8Bytes[readIndex + 1] & 63) << 12) | ((utf8Bytes[readIndex + 2] & 63) << 6) | (utf8Bytes[readIndex + 3] & 63);
                        readIndex += 4;
                    }
                    else
                        throw new Error("UTF8.decode: Invalid UTF-8 stream: An invalid lead byte value encountered at position " + readIndex);
                    output.appendCodePoint(outputCodePoint);
                }
                return output.toString();
            };
            UTF8.getUnicodeCodePoint = function (str, position) {
                var charCode = str.charCodeAt(position);
                if (charCode < 0xD800 || charCode > 0xDBFF)
                    return charCode;
                else {
                    var nextCharCode = str.charCodeAt(position + 1);
                    if (nextCharCode >= 0xDC00 && nextCharCode <= 0xDFFF)
                        return 0x10000 + (((charCode - 0xD800) << 10) + (nextCharCode - 0xDC00));
                    else
                        throw new Error("getUnicodeCodePoint: Received a lead surrogate character not followed by a trailing one");
                }
            };
            UTF8.getStringFromUnicodeCodePoint = function (codePoint) {
                if (codePoint <= 0xFFFF)
                    return String.fromCharCode(codePoint);
                else if (codePoint <= 0x10FFFF)
                    return String.fromCharCode(0xD800 + ((codePoint - 0x10000) >>> 10), 0xDC00 + ((codePoint - 0x10000) & 1023));
                else
                    throw new Error("getStringFromUnicodeCodePoint: A code point of " + codePoint + " cannot be encoded in UTF-16");
            };
            return UTF8;
        })();
        Encoding.UTF8 = UTF8;
    })(Encoding = LZUTF8.Encoding || (LZUTF8.Encoding = {}));
})(LZUTF8 || (LZUTF8 = {}));
var LZUTF8;
(function (LZUTF8) {
    function compress(input, options) {
        if (input === undefined || input === null)
            throw new TypeError("compress: undefined or null input received");
        input = LZUTF8.ArrayTools.convertToUint8ArrayIfNeeded(input);
        options = LZUTF8.ObjectTools.extendObject({ outputEncoding: "ByteArray" }, options);
        var compressor = new LZUTF8.Compressor();
        var compressedBytes = compressor.compressBlock(input);
        return LZUTF8.CompressionCommon.encodeCompressedBytes(compressedBytes, options.outputEncoding);
    }
    LZUTF8.compress = compress;
    function decompress(input, options) {
        if (input === undefined || input === null)
            throw new TypeError("decompress: undefined or null input received");
        input = LZUTF8.ArrayTools.convertToUint8ArrayIfNeeded(input);
        options = LZUTF8.ObjectTools.extendObject({ inputEncoding: "ByteArray", outputEncoding: "String" }, options);
        input = LZUTF8.CompressionCommon.decodeCompressedData(input, options.inputEncoding);
        var decompressor = new LZUTF8.Decompressor();
        var decompressedBytes = decompressor.decompressBlock(input);
        return LZUTF8.CompressionCommon.encodeDecompressedBytes(decompressedBytes, options.outputEncoding);
    }
    LZUTF8.decompress = decompress;
    function compressAsync(input, options, callback) {
        if (callback == null)
            callback = function () { };
        if (input === undefined || input === null) {
            callback(undefined, new TypeError("compressAsync: undefined or null input received"));
            return;
        }
        input = LZUTF8.ArrayTools.convertToUint8ArrayIfNeeded(input);
        var defaultOptions = {
            inputEncoding: LZUTF8.CompressionCommon.detectCompressionSourceEncoding(input),
            outputEncoding: "ByteArray",
            useWebWorker: true,
            blockSize: 65536
        };
        options = LZUTF8.ObjectTools.extendObject(defaultOptions, options);
        LZUTF8.EventLoop.enqueueImmediate(function () {
            if (options.useWebWorker === true && LZUTF8.WebWorker.isSupported()) {
                LZUTF8.WebWorker.createGlobalWorkerIfItDoesntExist();
                LZUTF8.WebWorker.compressAsync(input, options, callback);
            }
            else {
                LZUTF8.AsyncCompressor.compressAsync(input, options, callback);
            }
        });
    }
    LZUTF8.compressAsync = compressAsync;
    function decompressAsync(input, options, callback) {
        if (callback == null)
            callback = function () { };
        if (input === undefined || input === null) {
            callback(undefined, new TypeError("decompressAsync: undefined or null input received"));
            return;
        }
        input = LZUTF8.ArrayTools.convertToUint8ArrayIfNeeded(input);
        var defaultOptions = {
            inputEncoding: "ByteArray",
            outputEncoding: "String",
            useWebWorker: true,
            blockSize: 65536
        };
        options = LZUTF8.ObjectTools.extendObject(defaultOptions, options);
        LZUTF8.EventLoop.enqueueImmediate(function () {
            if (options.useWebWorker === true && LZUTF8.WebWorker.isSupported()) {
                LZUTF8.WebWorker.createGlobalWorkerIfItDoesntExist();
                LZUTF8.WebWorker.decompressAsync(input, options, callback);
            }
            else {
                LZUTF8.AsyncDecompressor.decompressAsync(input, options, callback);
            }
        });
    }
    LZUTF8.decompressAsync = decompressAsync;
    function createCompressionStream() {
        return LZUTF8.AsyncCompressor.createCompressionStream();
    }
    LZUTF8.createCompressionStream = createCompressionStream;
    function createDecompressionStream() {
        return LZUTF8.AsyncDecompressor.createDecompressionStream();
    }
    LZUTF8.createDecompressionStream = createDecompressionStream;
    var globalUTF8TextEncoder;
    var globalUTF8TextDecoder;
    function encodeUTF8(str) {
        if (typeof str !== "string")
            throw new TypeError("encodeUTF8: null, undefined or invalid input type received");
        if (LZUTF8.runningInNodeJS()) {
            return new Uint8Array(new Buffer(str, "utf8"));
        }
        else if (typeof TextEncoder === "function") {
            if (globalUTF8TextEncoder === undefined)
                globalUTF8TextEncoder = new TextEncoder("utf-8");
            return globalUTF8TextEncoder.encode(str);
        }
        else
            return LZUTF8.Encoding.UTF8.encode(str);
    }
    LZUTF8.encodeUTF8 = encodeUTF8;
    function decodeUTF8(input) {
        if (input == null)
            throw new TypeError("decodeUTF8: undefined or null input received");
        if (LZUTF8.runningInNodeJS()) {
            var buf;
            if (input instanceof Uint8Array)
                buf = new Buffer(input);
            else if (input instanceof Buffer)
                buf = input;
            else
                throw new TypeError("decodeUTF8: invalid input type");
            return buf.toString("utf8");
        }
        else if (typeof TextDecoder === "function") {
            if (globalUTF8TextDecoder === undefined)
                globalUTF8TextDecoder = new TextDecoder("utf-8");
            return globalUTF8TextDecoder.decode(input);
        }
        else
            return LZUTF8.Encoding.UTF8.decode(input);
    }
    LZUTF8.decodeUTF8 = decodeUTF8;
    function encodeBase64(input) {
        if (input == null)
            throw new TypeError("encodeBase64: undefined or null input received");
        if (LZUTF8.runningInNodeJS()) {
            var buf;
            if (input instanceof Uint8Array)
                buf = new Buffer(input);
            else if (input instanceof Buffer)
                buf = input;
            else
                throw new TypeError("encodeBase64: invalid input type");
            var result = buf.toString("base64");
            if (result == null)
                throw new Error("encodeBase64: failed encdoing Base64");
            return result;
        }
        else
            return LZUTF8.Encoding.Base64.encode(input);
    }
    LZUTF8.encodeBase64 = encodeBase64;
    function decodeBase64(str) {
        if (typeof str !== "string")
            throw new TypeError("decodeBase64: invalid input type received");
        if (LZUTF8.runningInNodeJS()) {
            var result = new Uint8Array(new Buffer(str, "base64"));
            if (result === null)
                throw new Error("decodeBase64: failed decoding Base64");
            return result;
        }
        else
            return LZUTF8.Encoding.Base64.decode(str);
    }
    LZUTF8.decodeBase64 = decodeBase64;
    function encodeBinaryString(input) {
        input = LZUTF8.ArrayTools.convertToUint8ArrayIfNeeded(input);
        return LZUTF8.Encoding.BinaryString.encode(input);
    }
    LZUTF8.encodeBinaryString = encodeBinaryString;
    function decodeBinaryString(str) {
        return LZUTF8.Encoding.BinaryString.decode(str);
    }
    LZUTF8.decodeBinaryString = decodeBinaryString;
})(LZUTF8 || (LZUTF8 = {}));
/// <reference path="./LZUTF8/Library/Dependencies/node-internal.d.ts"/>
/// <reference path="./LZUTF8/Library/Common/Globals.ext.ts"/>
/// <reference path="./LZUTF8/Library/Async/AsyncCompressor.ts"/>
/// <reference path="./LZUTF8/Library/Async/AsyncDecompressor.ts"/>
/// <reference path="./LZUTF8/Library/Async/WebWorker.ts"/>
/// <reference path="./LZUTF8/Library/Common/ArraySegment.ts"/>
/// <reference path="./LZUTF8/Library/Common/ArrayTools.ts"/>
/// <reference path="./LZUTF8/Library/Common/CompressionCommon.ts"/>
/// <reference path="./LZUTF8/Library/Common/EventLoop.ts"/>
/// <reference path="./LZUTF8/Library/Common/GlobalInterfaces.ts"/>
/// <reference path="./LZUTF8/Library/Common/ObjectTools.ts"/>
/// <reference path="./LZUTF8/Library/Common/StringBuilder.ts"/>
/// <reference path="./LZUTF8/Library/Common/Timer.ts"/>
/// <reference path="./LZUTF8/Library/Compression/Compressor.ts"/>
/// <reference path="./LZUTF8/Library/Compression/CompressorCustomHashTable.ts"/>
/// <reference path="./LZUTF8/Library/Compression/CompressorSimpleHashTable.ts"/>
/// <reference path="./LZUTF8/Library/Decompression/Decompressor.ts"/>
/// <reference path="./LZUTF8/Library/Encoding/Base64.ts"/>
/// <reference path="./LZUTF8/Library/Encoding/BinaryString.ts"/>
/// <reference path="./LZUTF8/Library/Encoding/Misc.ts"/>
/// <reference path="./LZUTF8/Library/Encoding/UTF8.ts"/>
/// <reference path="./LZUTF8/Library/Exports/Exports.ts"/>
