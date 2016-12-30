Template.track.helpers({
    time: function () {
        return Meteor.tracker.printTime(Template.currentData().date);
    },
    track: function () {
        var track = Template.currentData().track;
        return track ? Meteor.tracker.TOKEN_TRACK + track : "";
    },
    durationAndResults: function () {
        var results = [];
        if (Template.currentData().duration) {
            results.push(Meteor.tracker.printDuration(Template.currentData().duration));
        }
        if (Template.currentData().results) {
            results = results.concat(Template.currentData().results);
        }

        return Meteor.tracker.printArray(results, " ");
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


        input += Meteor.tracker.printDay(Template.currentData().date) + " " + Meteor.tracker.printTime(Template.currentData().date);
        input += " #" + Template.currentData().track;
        if (Template.currentData().duration) {
            input += " " + Meteor.tracker.printDuration(Template.currentData().duration);
        }
        if (Template.currentData().results) {
            input += " " + Meteor.tracker.printArray(Template.currentData().results, " ");
        }
        if (Template.currentData().comment) {
            input += " //" + Template.currentData().comment;
        }

        return input;
    }
});

Template.track.events({
    "click tr.track a": function(event) {
        //for links in comments
        event.stopPropagation();
    },
    "click tr.track": function (event) {
        if (!Meteor.editTrack.getEditId()) {
            event.preventDefault();
            event.stopPropagation();

            Meteor.editTrack.setEditId(Template.currentData()._id);
        }
    }
});

