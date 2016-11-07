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
    }
});

Template.track.events({
    "click a.remove": function () {
        Meteor.call("remove", Template.currentData());
    }
});

