var Pool = require("stagepool").Pool;
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

    this.on("_new_socket_ready_", function() {
        if (this.buffers.length > 0) {
            this.flush();
        }
    });
    this.on("_new_data_", function() {
        if (this.Pool.size("ready") > 0) {
            this.flush();
        }
    });
}
util.inherits(SocketPool, events.EventEmitter);

function initSocket(sp, socket) {
    socket.on('data', function(data) {

        sp.emit("data", socket, data, socket._stage);
    });
    socket.on('error', function(err) {

        sp.Pool.remove(socket, socket._stage);
        // sp.emit("error", socket, err);
        sp.emit("pool.socket.error", socket);
        socket.destroy();
    });
    socket.on('end', function() {
        sp.emit("partlyend", socket);
        socket.end();

    });
}
SocketPool.prototype.reset = function() {
    for (var i = this.Pool.length - 1; i >= 0; i--) {
        this.Pool[i].end();
        this.Pool[i].destroy();
    };
    this.Pool = new Pool({
        _DEBUG_: false,
        stages: ["connecting", "ready", "occupied"]
    });
}

SocketPool.prototype.add = function(socket) {
    initSocket(this, socket);
    this.Pool.add(socket, "connecting");
    this.emit("beforeConnect", socket);


}
SocketPool.prototype.addReady = function(socket) {
    initSocket(this, socket);
    this.Pool.add(socket, "ready");
    this.emit("ready", socket);
    var self = this;
    setImmediate(function() {
        self.emit("_new_socket_ready_");
    });


}
SocketPool.prototype.moveToReady = function(socket) {
    this.Pool.move(socket, "connecting", "ready");
    this.emit("ready", socket);
    var self = this;
    setImmediate(function() {
        self.emit("_new_socket_ready_");
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
                self.emit("_new_socket_ready_");
            });
        });
    }
}
SocketPool.prototype.send = function(data) {
    this.buffers.unshift(data);
    this.emit("_new_data_");
}
var getSocket = function(sp) {
    var p = sp.Pool.popFrom("ready");
    if (p != null)
        sp.Pool.add(p, "occupied");
    return p;
}

exports.SocketPool = SocketPool;