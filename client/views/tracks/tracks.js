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
                return momentDay.format("ddd");
            }
        } else {
            return null;
        }
    },
    day: function (date) {
        //detect if date changed compared to track from before
        var result = null;


        if (!Meteor.tracks.trackDay || !moment(Meteor.tracks.trackDay).isSame(date, "day")) {
            result = date;
            Meteor.tracks.trackDay = date;
        }
        return Meteor.tracks._formatDay(result);
    }
}

Template.tracks.helpers({
    tracks: function () {
        Meteor.tracks.trackDay = null; //reset the trackDay whenever tracks are being requested

        var tracks = Template.instance().tracks().fetch();
        //set day
        for (var i = 0; i < tracks.length; i++) {
            tracks[i].day = Meteor.tracks.day(tracks[i].date);
        }

        return tracks;

    },
    hasMoreTracks: function () {
        return Template.instance().tracks().count() >= Template.instance().limit.get();
    }
});

Template.tracks.events({
    'click .load-more': function (event) {
        event.preventDefault();
        var limit = Template.instance().limit.get();
        limit += 30;
        Template.instance().limit.set(limit);
    }
});

Template.tracks.onCreated(function () {

    var instance = this;
    instance.loaded = new ReactiveVar(0);
    instance.limit = new ReactiveVar(30);

    this.autorun(function () {
        var limit = instance.limit.get();
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