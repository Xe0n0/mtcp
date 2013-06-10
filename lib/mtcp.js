var util = require("util");
var events = require("events");
var net = require("net");
var pool = require("./socketpool");
var session = require("../lib/tcpsession");
var header = require('../lib/mytcpheader').WsmTCPHeader;

// var memwatch = require('memwatch');
// memwatch.on('leak', function(info) {
//     console.log(info);
// });

function Server(cb) {
    events.EventEmitter.call(this);
    this.on("connection", cb);
    this.socks = {};
    var self = this;
    var getSocket = function(sid) { // mtcpSocket
        if (!(sid in self.socks)) {
            var socket = new Socket();
            self.socks[sid] = socket;
            self.emit("connection", socket);
        }
        return self.socks[sid];
    }
    this._server = net.createServer(function(conn) { //socket
        conn.once('data', function(data) {
            data = header.getPackage(data);
            var s = getSocket(data.sid);
            if (data.flag == 1) {
                conn.write(s.session.responsehello());
                conn._id = s.__id++;
                s.pool.addReady(conn);
            } else {
                conn.end();
            }

        });
    });
}
util.inherits(Server, events.EventEmitter);
Server.prototype.listen = function(port, host) {
    if (!host)
        host = "::";
    this._server.listen(port, host);
}

function Socket() {
    this._total = 0;
    events.EventEmitter.call(this);
    var self = this;
    self.__id = 0;
    this.session = new session.TCPSession(function(data) {
        self.emit("data", data);
    }, function() {
        self.emit("end");
    });

    self.alive = false;
    self._total = 0;
    //pool to manage socks
    self.pool = new pool.SocketPool(false);
    self.pool.on('data', function(socket, data, stage) {
        var sp = this;

        if (stage == "connecting") {
            data = header.getPackage(data);
            if (data.flag == 2) {
                sp.moveToReady(socket);
            } else {
                self.emit('error', "hello not responsed");
            }
        } else {
            self._total += data.length;
            socket.buffer.feed(data);

        }

    });

    self.pool.on("beforeConnect", function(socket) {
        // socket.on("error",function(err){console.log("Error")});
        socket.write(self.session.hello());
    });

    self.pool.on("ready", function(socket) {
        socket.buffer = new header.DataBuffer(function(data) {

            //console.log("[GET]Socket#"+socket._id+"len:"+data.len+" pid:"+data.pid+" sid:"+data.sid+" flag:"+data.flag);
            self.session.addPackage(data);
        });
        if (!self.alive) {
            self.alive = true;
            self.emit("connect");


        }

    });
    // self.pool.on("partlyend",function(socket){
    // console.log("partlyend #"+socket._id+"Total:"+self._total);
    // });  
    // self.pool.on("error",function(socket,err){
    //  self.emit("error",err);
    // });
    /*setInterval(function(){
        console.log("POOLLEN:"+self.pool.buffers.length);
    },100);*/
}

util.inherits(Socket, events.EventEmitter);

Socket.prototype.connect = function(port, host, count, cb) {
    if (!host) host = "127.0.0.1";
    if (!count) count = 20;
    var retry = 0;
    var self = this;
    self.alive = false;

    var createClient = function() {
        var client = net.Socket();
        // client.setNoDelay(true);
        client._id = self.__id++;
        client.on('connect', function() {
            console.log("create new socket", client.localPort);
            if (self.pool) {
                self.pool.add(client);
            };
        });
        client.on("error", function(){
            client.destroy();
            client.buffer = null;
        });
        client.setTimeout(60*1000, function(){
            client.destroy();
            client.buffer = null;
        });
        client.connect(port, host);
    }
    self.pool.on("socketpool.socket.end", function() {
        createClient();
    });

    self.pool.on("pool.socket.error", function(err) {
        if (retry < 50) {
            retry++;
            setTimeout(createClient, 1000);
        } else
            self.emit("error", err)
            // console.log("remove socket");

    });
    self.pool.on("socketpool.socket.destroy", function(sock){
        console.log("destroy socket", sock.localPort);
    });
    self.on("connect", cb);
    for (var i = 0; i < count; i++) {
        createClient();
    }

};
var size_p = 32768;
Socket.prototype.write = function(data) {
    while (data.length > size_p) {
        var d = this.session.packData(data.slice(0, size_p));
        this._total += size_p;
        this.pool.send(d);
        data = data.slice(size_p);
    }
    var d = this.session.packData(data);
    this._total += data.length
    this.pool.send(d);
}
Socket.prototype.end = function() {
    this.pool.send(this.session.end());
    this.pool.removeAllListeners("socketpool.socket.end");
    this.pool.reset();
    this.pool=null; 
    this.removeAllListeners("socketpool.socket.end");

    this.emit("end");
};
exports.connect = function(obj, cb) {
    var s = new Socket();
    s.connect(obj.port, obj.host, obj.count, cb);
    return s;
}
exports.createConnection = exports.connect;
exports.createServer = function(cb) {
    var s = new Server(cb);
    return s;
}