Array.prototype.remove = function(index) {
    return this.slice(0, index).concat(this.slice(index + 1));
}
var Pool = function(options) {
    this.stages = {};
    for (var i = 0; i < options.stages.length; i++) {
        this.stages[options.stages[i]] = [];
    }
    if (options._DEBUG_ == true)
        this._DEBUG_ = true;
    else this._DEBUG_ = false;
}

Pool.prototype.add = function(obj, stage) {
    if (stage in this.stages) {
        this.stages[stage].unshift(obj);
        if (this._DEBUG_)
            console.log("add into stage:" + stage);
        obj._stage = stage;
        return true;
    }
    return false;
}
Pool.prototype.remove = function(obj, stage) {
    if (stage in this.stages) {
        var s = this.stages[stage];
        for (var i = 0; i < s.length; i++) {
            if (s[i] == obj) {
                this.stages[stage] = s.remove(i);
                if (this._DEBUG_)
                    console.log("removed from stage:" + stage);
                obj._stage = null;
                return true;
            }
        }
    }
    return false;
}
Pool.prototype.move = function(obj, stage1, stage2) {
    if (stage1 in this.stages && stage2 in this.stages) {
        if (this.remove(obj, stage1)) {
            return this.add(obj, stage2);
        }
    }
    return false;
}
Pool.prototype.popFrom = function(stage) {
    if (stage in this.stages) {
        if (this.stages[stage].length > 0) {
            return this.stages[stage].pop();
        }
    }
    return null;
}
Pool.prototype.getFrom = function(stage) {
    if (stage in this.stages) {
        if (this.stages[stage].length > 0) {
            return this.stages[stage][0];
        }
    }
    return null;
}
Pool.prototype.size = function(stage) {
    return this.stages[stage].length;
}
exports.Pool = Pool;