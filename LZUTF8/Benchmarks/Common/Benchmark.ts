module LZUTF8
{
	export class Benchmark
	{
		benchmarkContext: BenchmarkContext;
		sampleResults: number[];
		defaultOptions: BenchmarkOptions;

		constructor(benchmarkContext: BenchmarkContext, options?: BenchmarkOptions)
		{
			this.getTimestamp = Timer.getHighResolutionTimestampFunction();
			this.benchmarkContext = benchmarkContext;

			if (options)
				this.defaultOptions = options;
			else
				options = { maximumSamples: 20, maximumTime: 100 };

			this.sampleResults = [];
		}

		run(benchmarkedFunction: Action, options?: BenchmarkOptions): number
		{
			this.sampleResults.length = 0;

			if (!options)
				options = this.defaultOptions;

			var sampleCount = 0;

			var testStartTime = this.getTimestamp();
			do
			{
				// setup
				if (this.benchmarkContext.beforeEach)
					this.benchmarkContext.beforeEach();

				// actual run
				var sampleStartTime = this.getTimestamp();
				benchmarkedFunction.call(this.benchmarkContext);
				var sampleEndTime = this.getTimestamp();
				//

				// teardown
				if (this.benchmarkContext.afterEach)
					this.benchmarkContext.afterEach();

				// calcs
				var sampleElapsedTime = sampleEndTime - sampleStartTime;
				this.sampleResults.push(sampleElapsedTime);

				//console.log("Iteration " + iterationCount + ": " + iterationElapsedTime.toFixed(3));

				sampleCount++;

			} while (sampleCount < options.maximumSamples && this.getTimestamp() - testStartTime < options.maximumTime);

			// find function name
			var testName = ObjectTools.findPropertyInObject(benchmarkedFunction, this.benchmarkContext);
			if (!testName)
				testName = "Unknown";

			// calculate result time
			var result = this.getResult();

			var message = testName + ": " + result.toFixed(3) + "ms (" + (1000 / result).toFixed(0) + " runs/s, " + sampleCount + " sampled)";
			console.log(message);

			if (options.logToDocument && typeof document == "object")
				document.write(message + "<br/>");

			return result;
		}

		runAll(excludeList?: any[])
		{
			var excludedFunctions = ["beforeEach", "afterEach", "constructor"];
			excludedFunctions = excludedFunctions.concat(excludeList);

			for (var property in this.benchmarkContext)
				if ((typeof this.benchmarkContext[property] === "function") &&
					ArrayTools.find(excludedFunctions, property) === -1 &&
					ArrayTools.find(excludedFunctions, this.benchmarkContext[property]) === -1)
				{
					this.run(this.benchmarkContext[property]);
				}
		}

		getResult(): number
		{
			this.sampleResults.sort((num1: number, num2: number) => num1 - num2);
			return this.sampleResults[Math.floor(this.sampleResults.length / 2)];
		}

		getTimestamp(): number
		{
			return undefined;
		}

		static run(testFunction: Action, context: BenchmarkContext = {}, options?: BenchmarkOptions): number
		{
			var benchmark = new Benchmark(context);
			return benchmark.run(testFunction, options);
		}
	}

	export interface BenchmarkContext
	{
		beforeEach?: Action;
		afterEach?: Action;
	}

	export interface BenchmarkOptions
	{
		maximumTime: number;
		maximumSamples: number;
		logToDocument?: boolean;
	}
} 