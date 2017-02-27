(() => {
	let globalObject;

	if (typeof window === "object")
		globalObject = window;
	else if (typeof global === "object")
		globalObject = global;
	else if (typeof self === "object")
		globalObject = self;
	else
		globalObject = {};

	if (typeof globalObject["describe"] !== "function")
		globalObject["describe"] = () => { };
})();
