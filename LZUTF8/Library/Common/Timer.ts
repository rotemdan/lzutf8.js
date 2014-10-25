declare var chrome;

module LZUTF8
{
	export class Timer
	{
		startTime: number;

		constructor(timestampFunc?: () => number)
		{
			if (timestampFunc)
				this.getTimestamp = timestampFunc;
			else
				this.getTimestamp = Timer.getHighResolutionTimestampFunction();

			this.restart();
		}

		restart()
		{
			this.startTime = this.getTimestamp();
		}

		getElapsedTime(): number
		{
			return this.getTimestamp() - this.startTime;
		}

		getElapsedTimeAndRestart(): number
		{
			var elapsedTime = this.getElapsedTime();
			this.restart();
			return elapsedTime;
		}

		logAndRestart(title: string, logToDocument = false)
		{
			var message = title + ": " + this.getElapsedTime().toFixed(3);
			console.log(message);

			if (logToDocument && typeof document == "object")
				document.body.innerHTML += message + "<br/>";

			this.restart();
		}

		private getTimestamp(): number
		{
			return undefined;
		}

		static getHighResolutionTimestampFunction(): () => number
		{
			if (typeof chrome == "object" && chrome.Interval)
			{
				var chromeIntervalObject = new chrome.Interval();
				chromeIntervalObject.start();

				return () => chromeIntervalObject.microseconds() / 1000;
			}
			else if (typeof window == "object" && window.performance && window.performance.now)
			{
				return () => window.performance.now();
			}
			else if (typeof process == "object" && process.hrtime)
			{
				return () =>
				{
					var timeStamp = process.hrtime();
					return (timeStamp[0] * 1000) + (timeStamp[1] / 1000000);
				}
			}
			else if (Date.now)
			{
				return () => Date.now();
			}
			else
			{
				return () => (new Date()).getTime();
			}
		}
	}
}