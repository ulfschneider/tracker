var touchmove;

Template.track.helpers({
    time: function () {
        return moment(Template.currentData().date).format("HH:mm");
    },
    track: function () {
        var track = Template.currentData().track;
        return track ? "#" + track : "";
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
        return comment ? "//" + Template.currentData().comment : "";
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
    "mousedown tr.track, touchend tr.track": function (event) {
        event.stopPropagation();
        event.preventDefault();
        if (!touchmove) {
            Meteor.editTrack.setEditId(Template.currentData()._id);
        }
        touchmove = false;
    },
    "touchstart tr": function () {
        touchmove = false;
    },
    "touchmove tr": function () {
        touchmove = true;
    }
});

