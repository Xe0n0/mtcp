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
			console.log('back: end');
			conn.end();
			conn.destroy();
		});
		client.on('error', function(err) {
			console.log("CLIENT:" + err);
		});

		conn.on('end', function() {
			//console.log('conn: end');
			client.end();
		});
		conn.on('error', function(err) {
			console.log("CONN:" + err);
			client.end();
		});
		conn.setTimeout(600*1000, function(){
			client.end();
			conn.destroy();
		});
	}).listen(listen_port);
}