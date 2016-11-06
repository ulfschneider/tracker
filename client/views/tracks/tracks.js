Meteor.tracks = {
    trackDay: null,
    _formatDay: function (day) {
        var now = new Date();
        if (moment(day).isSame(now, "day")) {
            return "Today";
        } else if (moment(now).subtract(1, "day").isSame(day, "day")) {
            return "Yday.";
        } else if (moment(day).isBefore(now, "week") && moment(day).isSame(now, "year")) {
            return moment(day).format("dd Mo MMM");
        } else if (moment(day).isBefore(now, "week")) {
            return moment(day).format("dd Mo MMM YY");
        } else if (day) {
            return moment(day).format("dd");
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

        //return training data for last 7 days
        //return TrackData.find({date: {$gte: moment().subtract(7, "days").startOf("day").toDate()}}, {sort: {date: -1}}).fetch();

        //return 30 tracks
        var tracks = TrackData.find({}, {sort: {date: -1}, limit:30}).fetch();

        //set day
        for(var i = 0; i < tracks.length; i++) {
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