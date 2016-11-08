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
        Meteor.tracks.trackDay = null; //reset the trackDay whenever tracks are being reloaded

        //return 30 tracks
        var tracks = TrackData.find({}, {sort: {date: -1, track: 1}, limit: 30}).fetch();

        //set day
        for (var i = 0; i < tracks.length; i++) {
            tracks[i].day = Meteor.tracks.day(tracks[i].date);
        }

        return tracks;
    }
});

Template.tracks.onCreated(function () {
    this.autorun(function () {
        Meteor.subscribe('TrackData');
    });
});