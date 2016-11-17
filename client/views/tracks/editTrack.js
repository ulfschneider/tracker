import {Session} from "meteor/session";
var touchmove;

Meteor.editTrack = {
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
                track.chartData._id = id;
            }

            Meteor.call("upsert", track.chartData, function (error, result) {
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
    var id = Template.currentData() && Template.currentData()._id ? Template.currentData()._id : "";
    $("#edit" + id).autosize();
    $("#edit" + id).focus();
}