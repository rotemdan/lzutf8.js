module LZUTF8
{
	export class EventLoop
	{
		static instanceToken: string;
		static queuedFunctions: Action[];

		static enqueueImmediate(func: Action)
		{
			if (runningInNodeJS())
			{
				setImmediate(func);
			}
			else if ((typeof window === "object") && (window.postMessage !== undefined))
			{
				if (!EventLoop.instanceToken)
					EventLoop.registerWindowMessageHandler();

				EventLoop.queuedFunctions.push(func);
				window.postMessage(EventLoop.instanceToken, window.location.href);
			}
			else
			{
				window.setTimeout(func, 0);
			}
		}

		static registerWindowMessageHandler()
		{
			EventLoop.instanceToken = "EventLoop.enqueueImmediate-" + Math.random();
			EventLoop.queuedFunctions = [];

			window.addEventListener("message", (event) =>
			{
				if (event.data != EventLoop.instanceToken)
					return;

				var queuedFunction = EventLoop.queuedFunctions.shift();
				if (!queuedFunction)
					return;

				try
				{
					queuedFunction.call(undefined);
				}
				catch (exception)
				{
					if (typeof exception == "object")
						console.log("enqueueImmediate exception: " + JSON.stringify(exception));
					else
						console.log("enqueueImmediate exception: " + exception);
				}
			});
		}
	}

	export var enqueueImmediate = EventLoop.enqueueImmediate;
} 