import {Session} from "meteor/session";
import {Filter} from "/client/views/chart/filter.js";

Meteor.editTrack = {
    trackBuckets: null,
    resultBuckets: null,
    edit: null,

    getTrackBuckets: function () {
        if (this.trackBuckets) {
            return this.trackBuckets;
        }

        this.trackBuckets = [];
        var track = "";
        var cursor = TrackData.find({}, {fields: {track: 1}, sort: {track: 1}}).map(function (t) {
            return t.track;
        });
        var _self = this;
        cursor.forEach(function (t) {
            if (t.toLowerCase() != track) {
                _self.trackBuckets.push(t);
                track = t.toLowerCase();
            }
        });

        return this.trackBuckets;
    },
    getResultBuckets: function () {
        if (this.resultBuckets) {
            return this.resultBuckets;
        }
        var buckets = new Filter();
        var cursor = TrackData.find({}, {fields: {results: 1}}).map(function (t) {
            return t.results;
        });
        cursor.forEach(function (results) {
            _.each(results, function (r) {
                var bucket = Meteor.tracker.extractResultBucket(r);
                if (bucket) {
                    buckets.add(bucket);
                }
            });
        });

        this.resultBuckets = buckets.getAll();
        return this.resultBuckets;
    },
    setEditId: function (editId) {
        Session.set("editId", editId);
        Meteor.editTrack.setRecentEditId(editId);
    },
    clearEditId: function () {
        Session.set("editId", "");
    },
    getEditId: function () {
        var id = Session.get("editId");
        return id ? id : "";
    },
    setRecentEditId: function (editId) {
        Session.set("recentEditId", editId);
    },
    getRecentEditId: function () {
        var id =  Session.get("recentEditId");
        return id ? id : "";
    },
    isEditing: function (editId) {
        if (editId) {
            return Meteor.editTrack.getEditId() == editId;
        } else {
            return Meteor.editTrack.getEditId() ? true : false;
        }
    },
    isRecentEditing: function (editId) {
        if (editId) {
            return Meteor.editTrack.getRecentEditId() == editId;
        } else {
            return Meteor.editTrack.getRecentEditId() ? true : false;
        }
    },
    escapeEdit: function () {
        var id = Meteor.editTrack.getEditId();
        $("#edit" + id).val("");
        $("#edit" + id).removeClass("error");
        $("#errors" + id).html("");
        Meteor.editTrack.clearEditId();
    },
    isVisible: function () {
        var id = this._id ? this._id : "";
        return !id || id == Meteor.editTrack.getEditId();
    },
    _submitTrack: function (id) {
        var id = id ? id : "";
        var track = Meteor.tracker.analyzeTrack($("#edit" + id).val());
        var errors;
        if (track.errors.length) {
            errors = Meteor.tracker.errorPrintHtml(track.errors);
            $("#errors" + id).html(errors);
            $("#edit" + id).addClass("error");
        } else {
            $("#errors" + id).html("");

            if (id) {
                track.data._id = id;
            }

            this.resultBuckets = null;
            this.trackBuckets = null;

            Meteor.editTrack.escapeEdit();
            Meteor.call("upsert", track.data, function (error, result) {
                if (!error) {
                    Meteor.editTrack.escapeEdit();
                    Meteor.editTrack.setRecentEditId(result);
                } else {
                    errors = Meteor.tracker.errorPrintHtml([{description: "Your track could not be stored on the server. " + error}]);
                    $("#errors" + id).html(errors);
                }
            });
        }
    }

}

Template.editTrack.events({
    "click a.submit": function (event) {
        var id = this._id ? this._id : "";
        event.preventDefault();
        event.stopPropagation();

        Meteor.editTrack._submitTrack(id);
    },
    "click a.cancel": function (event) {
        event.preventDefault();
        event.stopPropagation();

        Meteor.editTrack.escapeEdit();
    },
    "click a.remove": function (event) {
        event.preventDefault();
        event.stopPropagation();

        Meteor.call("remove", Template.currentData());
    },
    "focusin textarea": function (event) {
        var id = this._id ? this._id : "";
        $("#control" + id + " div").show(0);
    },
    "keyup textarea": function (event) {
        var id = this._id ? this._id : "";
        if (event.which !== 13) {
            $("#edit" + id).removeClass("error");
        }
        if (event.which === 27) {
            Meteor.editTrack.escapeEdit();
        }
    },
    "keypress textarea": function (event) {
        var id = this._id ? this._id : "";
        if (event.which === 13) {
            event.preventDefault();
            event.stopPropagation();
            Meteor.editTrack._submitTrack(id);
        }
    }

});

Template.editTrack.helpers({
    isVisible: function () {
        return Meteor.editTrack.isVisible();
    },
    isHidden: function() {
        return !Meteor.editTrack.isVisible();
    }
});

Template.editTrack.rendered = function () {

    Meteor.subscribe("TrackData");
    var id = Template.currentData() && Template.currentData()._id ? Template.currentData()._id : "";
    $("#edit" + id).autosize();
    $("#edit" + id).focus();


    $("#edit" + id).textcomplete([
        {
            match: /#([^\s]*)$/,
            search: function (term, callback) {
                callback($.map(Meteor.editTrack.getTrackBuckets(), function (element) {
                    return element.indexOf(term) === 0 ? element : null;
                }));
            },
            index: 1,
            replace: function (element) {
                return "#" + element + " ";
            }
        },
        {
            match: /(\d+(\.\d+)?)([^\s]*)$/,
            search: function (term, callback) {
                var query = Meteor.tracker.extractResultBucket(term);
                var result = Meteor.tracker.extractResult(term);

                callback($.map(Meteor.editTrack.getResultBuckets(), function (element) {
                    return element.indexOf(term) === 0 ? element : null;
                }));
            },
            index: 3,
            replace: function (element) {
                return "$1" + element + " ";
            }
        }

    ]);

}
