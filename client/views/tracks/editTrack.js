import {Session} from "meteor/session";
import {Filter} from "/client/views/chart/filter.js";

Meteor.editTrack = {
    trackBuckets: null,
    resultBuckets: null,

    getTrackBuckets: function () {
        if (this.trackBuckets) {
            return this.trackBuckets;
        }

        this.trackBuckets = [];
        var track = "";
        var cursor = TrackData.find({}, {fields: {track: 1}, sort: {track: 1}});
        var _self = this;
        cursor.forEach(function (t) {
            if (t.track.toLowerCase() != track) {
                _self.trackBuckets.push(t.track);
                track = t.track.toLowerCase();
            }
        });
        return this.trackBuckets;
    },
    getResultBuckets: function () {
        if (this.resultBuckets) {
            return this.resultBuckets;
        }
        var buckets = new Filter();
        var cursor = TrackData.find({}, {fields: {results: 1}});
        cursor.forEach(function (t) {
            if (t["results"]) {
                _.each(t.results, function (r) {
                    var bucket = Meteor.tracker.extractResultBucket(r);
                    if (bucket) {
                        buckets.add(bucket);
                    }
                });
            }
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
        return Session.get("editId");
    },
    setRecentEditId: function (editId) {
        Session.set("recentEditId", editId);
    },
    getRecentEditId: function () {
        return Session.get("recentEditId");
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

            //TODO cache this somewhere with reactivity
            this.resultBuckets = null;
            this.trackBuckets = null;

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
    "mousedown a.submit, touchend a.submit": function () {
        var id = this._id ? this._id : "";

        event.stopPropagation();
        event.preventDefault();

        Meteor.editTrack._submitTrack(id);
    },
    "mousedown a.cancel, touchend a.cancel": function () {
        event.stopPropagation();
        event.preventDefault();

        Meteor.editTrack.escapeEdit();
    },
    "mousedown a.remove, touchend a.remove": function () {
        event.preventDefault();
        Meteor.call("remove", Template.currentData());
    },
    "focusin textarea": function (event) {
        var id = this._id ? this._id : "";
        $("#control" + id + " div").show(0);
    },
    "mousedown textarea, touchend textarea": function (event) {
        event.stopPropagation();
    },
    "blur textarea": function (event) {
        var id = this._id ? this._id : "";
        $("#control" + id + " div").hide(0);
        if (!id) {
            $("#edit").removeClass("error");
            $("#errors").html("");
        } else {
            Meteor.editTrack.escapeEdit();
        }
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
        var id = this._id ? this._id : "";
        return !id || id == Meteor.editTrack.getEditId();
    }
});

Template.editTrack.rendered = function () {

    Meteor.subscribe("TrackData");
    var id = Template.currentData() && Template.currentData()._id ? Template.currentData()._id : "";
    $("#edit" + id).autosize();
    $("#edit" + id).focus();

    /*
    $("#edit" + id).textcomplete([
        {//|(\d+(\.\d+)?)
            match: /(^|\s)(#)[^\s]*$/,
            search: function (term, callback) {
                var query, result;
                if (term.indexOf("#") == 0) {
                    query = term.substring(1);
                    callback($.map(Meteor.editTrack.getTrackBuckets(), function (element) {
                        return element.indexOf(query) === 0 ? "#" + element : null;
                    }));
                } else {
                    query = Meteor.tracker.extractResultBucket(term);
                    result = Meteor.tracker.extractResult(term);
                    callback($.map(Meteor.editTrack.getResultBuckets(), function (element) {
                        return element.indexOf(query) === 0 ? (result + element) : null;
                    }));
                }
            },
            index: 2,
            replace: function (element) {
                return "$1" + element + " ";
            }
        }
    ]);
*/

}
