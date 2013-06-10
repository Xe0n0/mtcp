exports.startServer = function(mtcp, net, back_port, back_address, listen_port) {
	mtcp.createServer(function(conn) {

		conn.alive = false;
		conn.buffer = [];

		var client = net.connect({
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
			conn.end();
		});
		client.on('error', function(err) {
			conn.end();
		});

		conn.on('end', function() {
			client.end();
			client.destroy();
		});
		conn.on('error', function(err) {
			client.end();
			client.destroy();
		});

	}).listen(listen_port);
}