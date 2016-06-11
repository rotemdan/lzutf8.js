declare var chrome;

namespace LZUTF8
{
	export class Timer
	{
		startTime: number;

		constructor()
		{
			this.restart();
		}

		restart()
		{
			this.startTime = Timer.getTimestamp();
		}

		getElapsedTime(): number
		{
			return Timer.getTimestamp() - this.startTime;
		}

		getElapsedTimeAndRestart(): number
		{
			let elapsedTime = this.getElapsedTime();
			this.restart();
			return elapsedTime;
		}

		logAndRestart(title: string, logToDocument = true): number
		{
			let elapsedTime = this.getElapsedTime();

			//
			let message = `${title}: ${elapsedTime.toFixed(3)}ms`;
			log(message, logToDocument);
			//

			this.restart();

			return elapsedTime;
		}

		static getTimestamp(includeFractions = true): number
		{
			if (!this.timestampFunc)
				this.createGlobalTimestampFunction();

			let timestamp = this.timestampFunc();

			if (includeFractions)
				return timestamp;
			else
				return Math.floor(timestamp);
		}

		private static createGlobalTimestampFunction()
		{
			if (typeof chrome === "object" && chrome.Interval)
			{
				let baseTimestamp = Date.now();

				let chromeIntervalObject = new chrome.Interval();
				chromeIntervalObject.start();

				this.timestampFunc = () => baseTimestamp + chromeIntervalObject.microseconds() / 1000;
			}
			else if (typeof window === "object" && window.performance && window.performance.now)
			{
				let baseTimestamp = Date.now() - window.performance.now();

				this.timestampFunc = () => baseTimestamp + window.performance.now();
			}
			else if (typeof process === "object" && process.hrtime)
			{
				let baseTimestamp = 0;

				this.timestampFunc = () =>
				{
					let nodeTimeStamp = process.hrtime();
					let millisecondTime = (nodeTimeStamp[0] * 1000) + (nodeTimeStamp[1] / 1000000)

					return baseTimestamp + millisecondTime;
				}

				baseTimestamp = 0;
				baseTimestamp = Date.now() - this.timestampFunc();
			}
			else if (Date.now)
			{
				this.timestampFunc = () => Date.now();
			}
			else
			{
				this.timestampFunc = () => (new Date()).getTime();
			}
		}

		private static timestampFunc: () => number;
	}
}
