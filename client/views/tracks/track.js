Template.track.helpers({
    time: function () {
        return moment(Template.currentData().date).format("HH:mm");
    },
    track: function () {
        var track = Template.currentData().track;
        return track ? Meteor.tracker.TOKEN_TRACK + track : "";
    },
    durationAndResults: function () {
        var results = [];
        if (Template.currentData().duration) {
            results.push(Meteor.tracker.durationPrint(Template.currentData().duration));
        }
        if (Template.currentData().results) {
            results = results.concat(Template.currentData().results);
        }

        return Meteor.tracker.arrayPrint(results, " ");
    },
    comment: function () {
        var comment = Template.currentData().comment;
        return comment ? Meteor.tracker.TOKEN_COMMENT + Template.currentData().comment : "";
    },
    isEditing: function () {
        return Meteor.editTrack.isEditing(Template.currentData()._id);
    },
    isRecentEditing: function () {
        return Meteor.editTrack.isRecentEditing(Template.currentData()._id);
    },
    inputValue: function () {
        var input = "";
        input += moment(Template.currentData().date).format("YY-MM-DD HH:mm");
        input += " #" + Template.currentData().track;
        if (Template.currentData().duration) {
            input += " " + Meteor.tracker.durationPrint(Template.currentData().duration);
        }
        if (Template.currentData().results) {
            input += " " + Meteor.tracker.arrayPrint(Template.currentData().results, " ");
        }
        if (Template.currentData().comment) {
            input += " //" + Template.currentData().comment;
        }

        return input;
    }
});

Template.track.events({
    "click tr.track": function (event) {
        if (!Meteor.editTrack.getEditId()) {
            event.preventDefault();
            event.stopPropagation();

            Meteor.editTrack.setEditId(Template.currentData()._id);
        }
    }
});

