declare var chrome: any;

namespace LZUTF8 {
	export class Timer {
		startTime: number;

		constructor() {
			this.restart();
		}

		restart() {
			this.startTime = Timer.getTimestamp();
		}

		getElapsedTime(): number {
			return Timer.getTimestamp() - this.startTime;
		}

		getElapsedTimeAndRestart(): number {
			const elapsedTime = this.getElapsedTime();
			this.restart();
			return elapsedTime;
		}

		logAndRestart(title: string, logToDocument = true): number {
			const elapsedTime = this.getElapsedTime();

			//
			const message = `${title}: ${elapsedTime.toFixed(3)}ms`;
			log(message, logToDocument);
			//

			this.restart();

			return elapsedTime;
		}

		static getTimestamp(): number {
			if (!this.timestampFunc)
				this.createGlobalTimestampFunction();

			return this.timestampFunc();
		}

		static getMicrosecondTimestamp(): number {
			return Math.floor(Timer.getTimestamp() * 1000);
		}

		private static createGlobalTimestampFunction() {
			if (typeof process === "object" && typeof process.hrtime === "function") {
				let baseTimestamp = 0;

				this.timestampFunc = () => {
					const nodeTimeStamp = process.hrtime();
					const millisecondTime = (nodeTimeStamp[0] * 1000) + (nodeTimeStamp[1] / 1000000)

					return baseTimestamp + millisecondTime;
				}

				baseTimestamp = Date.now() - this.timestampFunc();
			}
			else if (typeof chrome === "object" && chrome.Interval) {
				const baseTimestamp = Date.now();

				const chromeIntervalObject = new chrome.Interval();
				chromeIntervalObject.start();

				this.timestampFunc = () => baseTimestamp + chromeIntervalObject.microseconds() / 1000;
			}
			else if (typeof performance === "object" && performance.now) {
				const baseTimestamp = Date.now() - performance.now();

				this.timestampFunc = () => baseTimestamp + performance.now();
			}
			else if (Date.now) {
				this.timestampFunc = () => Date.now();
			}
			else {
				this.timestampFunc = () => (new Date()).getTime();
			}
		}

		private static timestampFunc: () => number;
	}
}
