export function ChartFilter() {
    this.data = [];
    this.toggles = new Set();
}

ChartFilter.prototype.indexOf = function (entry) {
    var lowerEntry = entry.toLowerCase();
    for (var i = 0; i < this.data.length; i++) {
        if (this.data[i].toLowerCase() == lowerEntry) {
            return i;
        }
    }
    return -1;
}

ChartFilter.prototype.has = function (entry) {
    return this.indexOf(entry) >= 0;
}

ChartFilter.prototype.add = function (entry) {
    if (!this.has(entry)) {
        this.data.push(entry);
    }
    return this;
}

ChartFilter.prototype.delete = function (entry) {
    var idx = this.indexOf(entry);
    if (idx >= 0) {
        this.data.splice(idx, 1);
        this.off(entry);
    }
    return this;
}

ChartFilter.prototype.getAll = function () {
    this.data.sort(function (a, b) {
        return a.toLowerCase().localeCompare(b.toLowerCase());
    });
    return this.data;
}

ChartFilter.prototype.clear = function () {
    this.data = [];
}

ChartFilter.prototype.size = function () {
    return this.data.length;
}

ChartFilter.prototype.isEmpty = function () {
    return this.size() == 0;
}


ChartFilter.prototype.toggle = function (entry) {
    if (this.isOn(entry)) {
        this.off(entry);
    } else {
        this.on(entry);
    }

    return this;
}

ChartFilter.prototype.on = function (entry) {
    this.toggles.add(entry.toLowerCase());
    this.add(entry);
    return this;
}

ChartFilter.prototype.off = function (entry) {
    this.toggles.delete(entry.toLowerCase());
    return this;
}

ChartFilter.prototype.isOn = function (entry) {
    if (this.has(entry) && this.toggles.has(entry.toLowerCase())) {
        return true;
    } else {
        this.toggles.delete(entry.toLowerCase());
        return false;
    }
}

ChartFilter.prototype.retainOn = function (entries) {
    var _self = this;
    _.each(this.getAllOn(), function (t) {
        var contains = false;
        for (var i = 0; i++; i < entries.length) {
            if (t == entries[i].toLowerCase()) {
                contains = true;
                break;
            }
        }
        if (!contains) {
            _self.off(t);
        }
    });
}

ChartFilter.prototype.isOff = function (entry) {
    return !this.isOn(entry);
}

ChartFilter.prototype.isAllOff = function () {
    return !this.hasOneOn();
}

ChartFilter.prototype.hasOneOn = function () {
    for (var i = 0; i < this.data.length; i++) {
        if (this.isOn(this.data[i])) {
            return true;
        }
    }
    return false;
}

ChartFilter.prototype.getAllOn = function () {
    var _self = this;
    _.each(this.toggles, function (t) {
        if (!_self.has(t)) {
            _self.off(t);
        }
    });

    return Array.from(this.toggles);
}

ChartFilter.prototype.clearToggles = function () {
    this.toggles.clear();
    return this;
}

