exports.startServer = function(net, mtcp, back_port, back_address, listen_port) {
	net.createServer(function(conn) {

		conn.alive = false;
		conn.buffer = [];

		var client = mtcp.connect({
			port: back_port,
			host: back_address
		}, function() {
			conn.alive = true;
			conn.flush();
		});

		conn.flush = function() {
			while (conn.buffer.length > 0) {
				var data = conn.buffer.pop();
				client.write(data);
			}
		}
		
		// conn.client = client;
		client.on('data', function(data) {
			conn.write(data);
		});
		conn.on('data', function(data) {

			if (conn.alive) {
				conn.flush();
				client.write(data);
			} else {
				conn.buffer.unshift(data);
			}
		});
		client.on('end', function() {
			// console.log("remote end" + conn.localPort)
			conn.end();
			conn.destroy();
			conn.buffer = []

		});
		client.on('error', function(err) {
			console.log("remote error" + conn.localPort + err)
			conn.end();
			conn.destroy();
			conn.buffer = []
		});

		conn.on('end', function() {
			// console.log("local end" + conn.localPort)

			client.end();
			conn.buffer = []
			conn.destroy();

		});
		conn.on('error', function(err) {
			conn.destroy()
			conn.buffer = []
			// console.log("local conn error:" + err);
		});
		conn.setTimeout(10000, function(){
			client.end();
			conn.destroy();
		});
	}).listen(listen_port);
}