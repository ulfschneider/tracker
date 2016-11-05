import {Session} from "meteor/session";

Meteor.track = {
    _formatDay: function (day) {
        var now = new Date();
        if (moment(day).isSame(now, "day")) {
            return "Today";
        } else if (moment(day).isBefore(now, "week") && moment(day).isSame(now, "year")) {
            return moment(day).format("dd Mo MMM");
        } else if (moment(day).isBefore(now, "week")) {
            return moment(day).format("dd Mo MMM YY");
        } else if (day) {
            return moment(day).format("dd");
        }
    }
}

Template.track.helpers({
    day: function () {
        //detect if date changed compared to track from before
        var result = null;
        var date = Template.currentData().date;

        var day = Meteor.tracks.getTrackDay();
        if (!day || !moment(day).isSame(date, "day")) {
            result = date;
            Meteor.tracks.setTrackDay(date);
        }

        return Meteor.track._formatDay(result);
    },
    time: function () {
        return moment(Template.currentData().date).format("HH:mm");
    },
    workout: function () {
        var workout = Template.currentData().workout;
        return workout ? "#" + workout : "";
    },
    durationAndResults: function() {
        var results = [];
        if (Template.currentData().duration) {
            results.push(Meteor.tracker.durationPrint(Template.currentData().duration));
        }
        if (Template.currentData().results) {
            results = results.concat(Template.currentData().results);
        }
        return Meteor.tracker.prettyPrint(results, " ");
    },
    comment: function () {
        var comment = Template.currentData().comment;
        return comment ? "//" + Template.currentData().comment : "";
    }
});

