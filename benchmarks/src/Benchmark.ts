namespace LZUTF8 {
	export class Benchmark {
		benchmarkContext: BenchmarkContext;
		sampleResults: number[];
		defaultOptions: BenchmarkOptions;

		constructor(benchmarkContext: BenchmarkContext, options?: BenchmarkOptions) {
			this.benchmarkContext = benchmarkContext;

			if (options)
				this.defaultOptions = options;
			else
				options = { maximumSamples: 20, maximumTime: 100 };

			this.sampleResults = [];
		}

		run(benchmarkedFunction: Action, testTitle: string, options?: BenchmarkOptions): number {
			this.sampleResults.length = 0;

			if (!options)
				options = this.defaultOptions;

			let sampleCount = 0;

			const testStartTime = Timer.getTimestamp();
			do {
				// Setup
				if (this.benchmarkContext.beforeEach)
					this.benchmarkContext.beforeEach();

				// Actual run
				const sampleStartTime = Timer.getTimestamp();
				benchmarkedFunction.call(this.benchmarkContext);
				const sampleEndTime = Timer.getTimestamp();
				//

				// Teardown
				if (this.benchmarkContext.afterEach)
					this.benchmarkContext.afterEach();

				// Calcs
				const sampleElapsedTime = sampleEndTime - sampleStartTime;
				this.sampleResults.push(sampleElapsedTime);

				//console.log("Iteration " + iterationCount + ": " + iterationElapsedTime.toFixed(3));

				sampleCount++;

			} while (sampleCount < options.maximumSamples && Timer.getTimestamp() - testStartTime < options.maximumTime);

			// calculate result time
			const result = this.getResult();

			const message = `${testTitle}: ${result.toFixed(3)}ms (${(1000 / result).toFixed(0)} runs/s, ${sampleCount} sampled)`;
			log(message, true);


			return result;
		}

		runAll(excludeList: any[]) {
			let excludedFunctions = ["beforeEach", "afterEach", "constructor"];
			excludedFunctions = excludedFunctions.concat(excludeList);

			const propertyList = Object.getOwnPropertyNames(Object.getPrototypeOf(this.benchmarkContext));

			for (const propertyName of propertyList)
				if ((typeof this.benchmarkContext[propertyName] === "function") && excludedFunctions.indexOf(propertyName) === -1 && excludedFunctions.indexOf(this.benchmarkContext[propertyName]) === -1)
					this.run(this.benchmarkContext[propertyName], propertyName);
		}

		getResult(): number {
			this.sampleResults.sort((a: number, b: number): number => a - b);
			return this.sampleResults[Math.floor(this.sampleResults.length / 2)];
		}

		static run(testFunction: Action, testTitle: string, context: BenchmarkContext = {}, options?: BenchmarkOptions): number {
			const benchmark = new Benchmark(context);
			return benchmark.run(testFunction, testTitle, options);
		}
	}

	export interface BenchmarkContext {
		beforeEach?: Action;
		afterEach?: Action;
		[memberName: string]: any;
	}

	export interface BenchmarkOptions {
		maximumTime: number;
		maximumSamples: number;
		logToDocument?: boolean;
	}
}
