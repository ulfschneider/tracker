import {Session} from "meteor/session";

Meteor.editTrack = {
    setEditId: function (editId) {
        Session.set("editId", editId);
        Session.set("recentEditId", editId);
    },
    clearEditId: function () {
        Session.set("editId", null);
    },
    getEditId: function () {
        return Session.get("editId");
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
    }
}

Template.editTrack.events({
    "keyup textarea": function (event) {
        var id = this._id ? this._id : "";
        if (event.which !== 13) {
            $("#edit" + id).removeClass("error");
        }
    },
    "keypress textarea": function (event) {
        var id = this._id ? this._id : "";
        if (event.which === 13) {
            event.preventDefault();
            event.stopPropagation();

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

                Meteor.call("upsert", track.data, function (error, result) {
                    if (!error) {
                        $("#edit" + id).val("");
                        Meteor.editTrack.clearEditId();
                    } else {
                        errors = Meteor.tracker.errorPrintHtml([{description: "Your track could not be stored on the server. " + error}]);
                        $("#errors" + id).html(errors);
                    }
                });
            }
        }
    },
    "click a.remove": function () {
        Meteor.call("remove", Template.currentData());
    },
});

Template.editTrack.helpers({
    isVisible: function () {
        var id = this._id ? this._id : "";
        return !id && !Meteor.editTrack.isEditing() || id && id == Meteor.editTrack.getEditId();
    }
});

Template.editTrack.rendered = function () {
    $("textarea").autosize();
}