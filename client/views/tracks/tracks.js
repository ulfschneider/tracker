Template.tracks.helpers({
    tracks: function () {
        return TrackData.find();
    }
});

Template.tracks.onCreated(function() {
    this.autorun(function() {
        Meteor.subscribe('TrackData');
    });
});