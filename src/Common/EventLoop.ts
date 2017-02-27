namespace LZUTF8 {
	export namespace EventLoop {
		const queuedFunctions: Action[] = [];
		let asyncFlushFunc: Action;

		export const enqueueImmediate = function (func: Action) {
			queuedFunctions.push(func);

			if (queuedFunctions.length === 1)
				asyncFlushFunc();
		}

		export const initializeScheduler = function () {
			const flush = () => {
				for (const func of queuedFunctions) {
					try {
						func.call(undefined);
					}
					catch (exception) {
						printExceptionAndStackTraceToConsole(exception, "enqueueImmediate exception");
					}
				}

				queuedFunctions.length = 0;
			}

			if (runningInNodeJS()) {
				asyncFlushFunc = () => setImmediate(() => flush());
			}

			if (typeof window === "object" && typeof window.addEventListener === "function" && typeof window.postMessage === "function") {
				const token = "enqueueImmediate-" + Math.random().toString();

				window.addEventListener("message", (event) => {
					if (event.data === token)
						flush();
				});

				let targetOrigin: string;

				if (runningInNullOrigin())
					targetOrigin = '*';
				else
					targetOrigin = window.location.href;

				asyncFlushFunc = () => window.postMessage(token, targetOrigin);
			}
			else if (typeof MessageChannel === "function" && typeof MessagePort === "function") {
				const channel = new MessageChannel();
				channel.port1.onmessage = () => flush();
				asyncFlushFunc = () => channel.port2.postMessage(0);
			}
			else {
				asyncFlushFunc = () => setTimeout(() => flush(), 0);
			}
		}

		initializeScheduler();
	}

	export var enqueueImmediate = (func: Action) => EventLoop.enqueueImmediate(func);
}
