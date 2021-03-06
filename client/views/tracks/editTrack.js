import {Session} from "meteor/session";

Meteor.editTrack = {
    edit: null,
    content: null,
    idContent: null,

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
        id = id ? id : Meteor.editTrack.getEditId();

        $("#edit" + id).val("");
        $("#edit" + id).removeClass("error");
        $("#edit" + id).css("height", "");
        $("#errors" + id).html("");
        $("#control" + id + " .submit").hide();
        $("#control" + id + " .cancel").hide();
        $("#edit" + id).blur(); //hide keyboard on touch devices
        if (id) {
            Meteor.editTrack.setRecentEditId(id);
        }
        Meteor.editTrack.clearEditId();
        Meteor.editTrack.content = null;
        Meteor.editTrack.idContent = null;
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
                    Meteor.editTrack.escapeEdit(id);
                    NProgress.done();
                } else {
                    errors = Meteor.tracker.printErrorHtml([{description: "Your track could not be stored on the server. " + error}]);
                    $("#errors" + id).html(errors);
                    NProgress.done();
                }
            });
        }
    },
    _removeTrack: function (id) {
        var id = id ? id : "";

        Meteor.editTrack.escapeEdit(id);

        NProgress.start();
        Meteor.call("remove", Template.currentData(), function (error, result) {
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
    "click a.watch": function (event) {
        event.preventDefault();
        event.stopPropagation();
        var id = this._id ? this._id : "";
        Meteor.stopWatch.setWatchModeOn();

    },
    "keyup textarea": function (event) {
        var id = this._id ? this._id : "";
        if (event.which !== 13) {
            $("#edit" + id).removeClass("error");
        }
        if (!id) {
            Meteor.editTrack.content = $("#edit").val();
        } else {
            Meteor.editTrack.idContent = $("#edit" + id).val();
        }

        if (event.which === 27) {
            Meteor.editTrack.escapeEdit(id);
        }
        if ($("#edit" + id).val()) {
            $("#control" + id + " .submit").show();
            $("#control" + id + " .cancel").show();
        } else {
            $("#control" + id + " .submit").hide();
            $("#control" + id + " .cancel").hide();
        }
    },
    "keypress textarea": function (event) {
        if (event.which === 13) {
            var id = this._id ? this._id : "";
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
        //list content
        $("#edit" + id).focus();
        if (Meteor.editTrack.idContent) {
            $("#edit" + id).val(Meteor.editTrack.idContent);
        }
    } else if (Meteor.stopWatch.getTime() || Meteor.editTrack.content) {
        //non-list content
        var newContent,
            time = Meteor.stopWatch.getTime();
        if (Meteor.editTrack.content && time) {
            if (Meteor.editTrack.content.slice(-1) == " ") {
                newContent = Meteor.editTrack.content + Meteor.tracker.printDuration(time)
            } else {
                newContent = Meteor.editTrack.content + " " + Meteor.tracker.printDuration(time)
            }
        } else if (time) {
            newContent = Meteor.tracker.printDuration(time);
        } else {
            newContent = Meteor.editTrack.content;
        }

        $("#edit").val(newContent);
        Meteor.stopWatch.clear();
    }

    if ($("#edit" + id).val()) {
        $("#control" + id + " .submit").show();
        $("#control" + id + " .cancel").show();
    } else {
        $("#control" + id + " .submit").hide();
        $("#control" + id + " .cancel").hide();
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
