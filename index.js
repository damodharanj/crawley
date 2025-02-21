// Create a new isolate limited to 128MB
const ivm = require('isolated-vm');
const isolate = new ivm.Isolate({ memoryLimit: 128 });
const cheerio = require('cheerio')

// Create a new context within this isolate. Each context has its own copy of all the builtin
// Objects. So for instance if one context does Object.prototype.foo = 1 this would not affect any
// other contexts.
const context = isolate.createContextSync();

// Get a Reference{} to the global object within the context.
const jail = context.global;

// This makes the global object available in the context as `global`. We use `derefInto()` here
// because otherwise `global` would actually be a Reference{} object in the new isolate.
jail.setSync('global', jail.derefInto());

// We will create a basic `log` function for the new isolate to use.
jail.setSync('log', function(...args) {
	console.log(...args);
});

jail.setSync("cheerio", function (...args) {
	const $ = cheerio.load(args[0]);
	return $("body").text(); // Expose only necessary functionality
});

// And let's test it out:
context.evalSync('log("hello world")');
// > hello world

// Let's see what happens when we try to blow the isolate's memory
const hostile = isolate.compileScriptSync(`
	log('dei')
	log(cheerio('<body>Poda venna!</body>'))
`);

hostile.run(context).catch(err => console.error(err));