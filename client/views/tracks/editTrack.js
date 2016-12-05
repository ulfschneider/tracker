import {Session} from "meteor/session";

Meteor.editTrack = {
    edit: null,
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
        var id = Session.get("recentEditId");
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
    escapeEdit: function (id) {
        id = id ? Meteor.editTrack.getEditId() : id;

        $("#edit" + id).blur(); //hide keyboard on devices
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
            errors = Meteor.tracker.printErrorHtml(track.errors);
            $("#errors" + id).html(errors);
            $("#edit" + id).addClass("error");
        } else {
            $("#errors" + id).html("");

            if (id) {
                track.data._id = id;
            }

            NProgress.start();

            this.resultBuckets = null;
            this.trackBuckets = null;

            Meteor.call("upsert", track.data, function (error, result) {
                if (!error) {
                    Meteor.editTrack.escapeEdit();
                    Meteor.editTrack.setRecentEditId(result);
                    NProgress.done();
                } else {
                    errors = Meteor.tracker.printErrorHtml([{description: "Your track could not be stored on the server. " + error}]);
                    $("#errors" + id).html(errors);
                    NProgress.done();
                }
            });
        }
    },
    _removeTrack: function(id) {
        var id = id ? id : "";

        Meteor.editTrack.escapeEdit(id);

        NProgress.start();
        Meteor.call("remove", Template.currentData(), function(error, result) {
            NProgress.done();
        });
    }
}

Template.editTrack.events({
    "click a.submit": function (event) {
        event.preventDefault();
        event.stopPropagation();
        var id = this._id ? this._id : "";
        Meteor.editTrack._submitTrack(id);
    },
    "click a.cancel": function (event) {
        event.preventDefault();
        event.stopPropagation();
        var id = this._id ? this._id : "";
        Meteor.editTrack.escapeEdit(id);
    },
    "click a.remove": function (event) {
        event.preventDefault();
        event.stopPropagation();
        var id = this._id ? this._id : "";
        Meteor.editTrack._removeTrack(id);
    },
    "keyup textarea": function (event) {
        var id = this._id ? this._id : "";
        if (event.which !== 13) {
            $("#edit" + id).removeClass("error");
        }
        if (event.which === 27) {
            Meteor.editTrack.escapeEdit();
        }
        if($("#edit" + id).val()) {
            $(".cancel").show();
        } else {
            $(".cancel").hide();
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
    isHidden: function () {
        return !Meteor.editTrack.isVisible();
    }
});

Template.editTrack.rendered = function () {

    Meteor.subscribe("TrackData");
    var id = Template.currentData() && Template.currentData()._id ? Template.currentData()._id : "";
    $("#edit" + id).autosize();

    if (id) {
        $("#edit" + id).focus();
    }


    $("#edit" + id).textcomplete([
        {
            match: /(^|[\s]+)#([^\s]*)$/,
            search: function (term, callback) {
                callback($.map(Meteor.tracker.getTrackBuckets(), function (element) {
                    return element.indexOf(term) === 0 ? element : null;
                }));
            },
            index: 2,
            replace: function (element) {
                return "$1#" + element + " ";
            }
        },
        {
            match: /(^|[\s]+)@([^\s]*)$/,  //alternate for mobile phones, the @ is easier to reach than #
            search: function (term, callback) {
                callback($.map(Meteor.tracker.getTrackBuckets(), function (element) {
                    return element.indexOf(term) === 0 ? element : null;
                }));
            },
            index: 2,
            replace: function (element) {
                return "$1#" + element + " ";
            }
        },

        {
            match: /(^|[\s]+)(\d+(\.\d+)?)([^\s]*)$/,
            search: function (term, callback) {
                var query = Meteor.tracker.extractResultBucket(term);
                var result = Meteor.tracker.extractResult(term);

                callback($.map(Meteor.tracker.getResultBuckets(), function (element) {
                    return element.indexOf(term) === 0 ? element : null;
                }));
            },
            index: 4,
            replace: function (element) {
                return "$1$2" + element + " ";
            }
        }

    ]);

}
