var Pool = require("./pool").Pool;
var events = require("events");
var util = require("util");

function SocketPool(_DEBUG_) {
    if (!_DEBUG_) _DEBUG_ = false;
    events.EventEmitter.call(this);
    this.Pool = new Pool({
        _DEBUG_: _DEBUG_,
        stages: ["connecting", "ready", "occupied"]
    });
    this.buffers = [];

    this.on("socketpool.socket.ready", function() {
        if (this.buffers.length > 0) {
            this.flush();
        }
    });
    this.on("socket.internal.data", function() {
        if (this.Pool.size("ready") > 0) {
            this.flush();
        }
        // else
            // this.emit("socket.internal.data");
    });
}
util.inherits(SocketPool, events.EventEmitter);

function initSocket(sp, socket) {
    socket.on('data', function(data) {
        // console("get data");
        sp.emit("data", socket, data, socket._stage);
    });
    socket.on('error', function(err) {

        sp.Pool.remove(socket, socket._stage);
        socket.destroy();

        sp.emit("pool.socket.error", err);
    });
    socket.on('end', function() {
        socket.destroy();
        sp.Pool.remove(socket, socket._stage);

        sp.emit("socketpool.socket.end", socket);
        //typically we don't need destroy the socket, but here we
        //want to release the file descriptor as soon as possible
        this.emit("socketpool.socket.destroy", socket);
    });
}
SocketPool.prototype.reset = function() {

    var stages = ["connecting", "ready", "occupied"];
    for (var i = stages.length - 1; i >= 0; i--) {
        sock = this.Pool.popFrom(stages[i]);
        while (sock != null)
        {
            // sock.end();
            this.emit("socketpool.socket.destroy", sock);
            sock.destroy();
            sock = this.Pool.popFrom(stages[i]);
        }
    };
}
        

SocketPool.prototype.add = function(socket) {
    initSocket(this, socket);
    this.Pool.add(socket, "connecting");
    var self = this;
    socket.on("connect", function(){
        self.emit("beforeConnect", socket);
    })
}
SocketPool.prototype.addReady = function(socket) {
    initSocket(this, socket);
    this.Pool.add(socket, "ready");
    this.emit("ready", socket);
    var self = this;
    setImmediate(function() {
        self.emit("socketpool.socket.ready");
    });


}
SocketPool.prototype.moveToReady = function(socket) {
    this.Pool.move(socket, "connecting", "ready");
    this.emit("ready", socket);
    var self = this;
    setImmediate(function() {
        self.emit("socketpool.socket.ready");
    });
    //initSocket(this,socket);
}
SocketPool.prototype.isEmpty = function() {
    return this.Pool.size("ready") + this.Pool.size("occupied") == 0;
}
SocketPool.prototype.flush = function() {
    var self = this;
    var s = getSocket(self);

    if (s) {
        var d = self.buffers.pop();
        s.write(d, function() {
            self.Pool.move(s, "occupied", "ready");
            setImmediate(function() {
                self.emit("socketpool.socket.ready");
            });
        });
    }
}
SocketPool.prototype.send = function(data) {
    this.buffers.unshift(data);
    this.emit("socket.internal.data");
}
var getSocket = function(sp) {
    var p = sp.Pool.popFrom("ready");
    if (p != null)
        sp.Pool.add(p, "occupied");
    return p;
}

exports.SocketPool = SocketPool;
