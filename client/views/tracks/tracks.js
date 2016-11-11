import {Session} from "meteor/session";

Meteor.tracks = {
    trackDay: null,
    _formatDay: function (day) {
        if (day) {
            var momentDay = moment(day);
            var now = new Date();

            if (moment(now).subtract(7, "day").isAfter(day, "day")) {
                if (momentDay.isSame(now, "year")) {
                    return momentDay.format("ddd DD MMM");
                } else {
                    return momentDay.format("ddd DD MMM YY");
                }
            } else if (momentDay.isSame(now, "day")) {
                return "Today";
            } else if (moment(now).subtract(1, "day").isSame(day, "day")) {
                return "Yesterday";
            } else {
                return momentDay.format("dddd");
            }
        } else {
            return null;
        }
    },
    _day: function (date) {
        //detect if date changed compared to track from before
        var result = null;


        if (!Meteor.tracks.trackDay || !moment(Meteor.tracks.trackDay).isSame(date, "day")) {
            result = date;
            Meteor.tracks.trackDay = date;
        }
        return Meteor.tracks._formatDay(result);
    },
    increaseLimit: function() {
        var limit = Meteor.tracks.getLimit();
        limit += 30;
        Session.set("limit", limit);
    },
    getLimit: function() {
        var limit = Session.get("limit");
        if (!limit) {
            return 30;
        } else {
            return limit;
        }
    }
}

Template.tracks.helpers({
    tracks: function () {
        Meteor.tracks.trackDay = null; //reset the trackDay whenever tracks are being requested

        var tracks = Template.instance().tracks().fetch();
        //set day
        for (var i = 0; i < tracks.length; i++) {
            tracks[i].day = Meteor.tracks._day(tracks[i].date);
        }

        return tracks;

    },
    hasMoreTracks: function () {
        return Template.instance().tracks().count() >= Meteor.tracks.getLimit();
    }
});

Template.tracks.events({
    'click .load-more': function (event) {
        event.preventDefault();
        Meteor.tracks.increaseLimit();
    }
});

Template.tracks.onCreated(function () {

    var instance = this;
    instance.loaded = new ReactiveVar(0);

    this.autorun(function () {
        var limit = Meteor.tracks.getLimit();
        var subscription = instance.subscribe('TrackData', limit);
        if (subscription.ready()) {
            instance.loaded.set(limit);
        }
    });

    instance.tracks = function () {
        return TrackData.find({}, {limit: instance.loaded.get(), sort: {date: -1, track: 1} });
    }

})
;