Meteor.tracks = {
    trackDay: null,
    setTrackDay: function (day) {
        Meteor.tracks.trackDay = day;
    },
    getTrackDay: function () {
        return Meteor.tracks.trackDay;
    }
}

Template.tracks.helpers({
    tracks: function () {
        Meteor.tracks.setTrackDay(null); //reset the trackDay whenever tracks are being reloaded

        //return training data for last 7 days
        //return TrackData.find({date: {$gte: moment().subtract(7, "days").startOf("day").toDate()}}, {sort: {date: -1}}).fetch();

        //return 30 tracks
        return TrackData.find({}, {sort: {date: -1}, limit:30}).fetch();
    }
});

Template.tracks.onCreated(function () {
    this.autorun(function () {
        Meteor.subscribe('TrackData');
    });
});