var net = require('net');
var mtcp = require('./lib/mtcp');
var path = require("path");
var fs = require("fs");

var host = "127.0.0.1";

configContent = fs.readFileSync(path.resolve(__dirname, "config.json"));

config = JSON.parse(configContent);

var port_local = config.host_port;
var port_remote = config.remote_port;
var printhelp = function() {
	console.log("no parameter : port_local=" + port_local + " port_remote=" + port_remote + "host=" + host);
	console.log("or:");
	console.log("port_local:port_remote");
	console.log("port_local:host:port_remote");
	process.exit(0);
}
if (process.argv.length > 2) {
	var arg = process.argv[2];
	arg = arg.split(":");
	if (arg.length < 2) {
		printhelp();
	}
	if (arg.length == 2) {
		port_local = arg[0];
		port_remote = arg[1];
	}
	if (arg.length == 3) {
		port_local = arg[0];
		host = arg[1];
		port_remote = arg[2];

	}
}

console.log("forward locathost mtcp " + port_local + " to Remote tcp" + host + ":" + port_remote);
require('./lib/server')
	.startServer(mtcp, net, port_remote, host, port_local);