export function Filter() {
    this.data = [];
    this.toggles = new Set();
}

Filter.prototype.indexOf = function (entry) {
    return _.indexOf(this.data, entry);
}

Filter.prototype.has = function (entry) {
    return this.indexOf(entry) >= 0;
}

Filter.prototype.add = function (entry) {
    if (!this.has(entry)) {
        this.data.push(entry);
    }
    return this;
}

Filter.prototype.delete = function (entry) {
    var idx = this.indexOf(entry);
    if (idx >= 0) {
        this.data.splice(idx, 1);
    }
    return this;
}

Filter.prototype.getAll = function () {
    return this.data.sort();
}

Filter.prototype.clear = function () {
    this.data = [];
}

Filter.prototype.size = function () {
    return this.data.length;
}

Filter.prototype.isEmpty = function () {
    return this.size() == 0;
}


Filter.prototype.toggle = function (entry) {
    if (this.isOn(entry)) {
        this.off(entry);
    } else {
        this.on(entry);
    }

    return this;
}

Filter.prototype.on = function (entry) {
    this.toggles.add(entry);
    this.add(entry);

    return this;
}

Filter.prototype.off = function (entry) {
    this.toggles.delete(entry);
    return this;
}

Filter.prototype.isOn = function (entry) {
    if (this.has(entry) && this.toggles.has(entry)) {
        return true;
    } else {
        return false;
    }
}

Filter.prototype.isOff = function (entry) {
    return !this.isOn(entry);
}

Filter.prototype.isAllOff = function () {
    return !this.hasOneOn();
}

Filter.prototype.hasOneOn = function () {
    for (var i = 0; i < this.data.length; i++) {
        if (this.isOn(this.data[i])) {
            return true;
        }
    }
    return false;
}

Filter.prototype.setAllOn = function() {
    var _self = this;
    _.each(this.data, function(t) {
        _self.on(t);
    });
}

Filter.prototype.getAllOn = function () {
    var _self = this;
    var allOn = [];
    _.each(this.data, function (t) {
        if (_self.isOn(t)) {
            allOn.push(t);
        }
    });

    return allOn;
}

Filter.prototype.clearToggles = function () {
    this.toggles.clear();
    return this;
}

Filter.prototype.retainOn = function (entries) {
    var _self = this;
    var allOn = this.getAllOn();
    _.each(allOn, function (t) {
        var contains = false;
        for (var i = 0; i < entries.length; i++) {
            if (t == entries[i]) {
                contains = true;
                break;
            }
        }

        if (!contains) {
            _self.off(t);
        }
    });
}

