export function Map() {
    this.data = [];
}

Map.prototype._index= function(key) {
    for(var i = 0; i < this.data.length; i++) {
        if (this.data[i].key == key) {
            return i;
        }
    }
    return -1;
}

Map.prototype.has = function(key) {
    return this._index(key) >= 0;
}

Map.prototype.set = function(key, value) {
    var index = this._index(key);
    if (index >= 0) {
        this.data[index] = {key:key, value:value};
    } else {
        this.data.push({key:key, value:value});
    }
}

Map.prototype.get = function(key) {
    var index = this._index(key);
    if (index >= 0) {
        return this.data[index].value;
    } else {
        return null;
    }
}

Map.prototype.entries = function() {
    return this.data.slice(0);
}


Map.prototype.size = function() {
    return this.data.length;
}
