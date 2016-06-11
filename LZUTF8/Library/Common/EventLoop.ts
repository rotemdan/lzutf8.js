namespace LZUTF8
{
	export class EventLoop
	{
		static queuedFunctions: Action[] = [];
		static asyncFlushFunc: Action;

		static enqueueImmediate(func: Action)
		{
			if (!this.asyncFlushFunc)
				this.initializeScheduler();

			this.queuedFunctions.push(func);

			if (this.queuedFunctions.length === 1)
				this.asyncFlushFunc();
		}

		static initializeScheduler()
		{
			let flush = () => 
			{
				for (let func of this.queuedFunctions)
				{
					try
					{
						func.call(undefined);
					}
					catch (exception)
					{
						printExceptionAndStackTraceToConsole(exception, "enqueueImmediate exception");
					}
				}

				this.queuedFunctions.length = 0;
			}

			if (runningInNodeJS())
			{
				this.asyncFlushFunc = () => setImmediate(() => flush());
			}
			else if (typeof window === "object" && typeof window.addEventListener === "function" && typeof window.postMessage === "function")
			{
				let token = "enqueueImmediate-" + Math.random().toString();

				window.addEventListener("message", function (event)
				{
					if (event.data === token)
						flush();
				});

				let targetOrigin: string;

				if (runningInNullOrigin())
					targetOrigin = '*';
				else
					targetOrigin = window.location.href;

				this.asyncFlushFunc = () => window.postMessage(token, targetOrigin);
			}
			else if (typeof MessageChannel === "function" && typeof MessagePort === "function")
			{
				let channel = new MessageChannel();
				channel.port1.onmessage = () => flush();
				this.asyncFlushFunc = () => channel.port2.postMessage(0);
			}
			else
			{
				this.asyncFlushFunc = () => setTimeout(() => flush(), 0);
			}
		}
	}

	export var enqueueImmediate = (func: Action) => EventLoop.enqueueImmediate(func);
} 