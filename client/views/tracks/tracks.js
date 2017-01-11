import {Session} from "meteor/session";

Meteor.tracks = {
    trackDay: null,
    _day: function (date) {
        //detect if date changed compared to track from before
        var result = null;


        if (!Meteor.tracks.trackDay || !moment(Meteor.tracks.trackDay).isSame(date, "day")) {
            result = date;
            Meteor.tracks.trackDay = date;
        }
        return Meteor.tracker.printDay(result);
    },
    increaseLimit: function () {
        var limit = Meteor.tracks.getLimit();
        limit += Meteor.tracker.COUNT_RELOAD;
        Session.set("limit", limit);
    },
    getLimit: function () {
        var limit = Session.get("limit");
        if (!limit) {
            return Meteor.tracker.COUNT_RELOAD;
        } else {
            return limit;
        }
    },
    resetLimit: function () {
        Session.set("limit", Meteor.tracker.COUNT_RELOAD);
    }
}

Template.tracks.helpers({
    tracks: function () {

        Meteor.tracker.clearCacheTrackBuckets();
        Meteor.tracker.clearCacheResultBuckets();

        Meteor.tracks.trackDay = null; //reset the trackDay whenever tracks are being requested

        var tracks = Template.instance().tracks().fetch();
        //set day
        for (var i = 0; i < tracks.length; i++) {
            tracks[i].day = Meteor.tracks._day(tracks[i].date);
        }

        return tracks;

    },
    hasMoreTracks: function () {
        return !Meteor.queryTracks.hasQuery() && Template.instance().tracks().count() >= Meteor.tracks.getLimit();
    },
    hasTracks: function () {
        return Template.instance().tracks().count() >= 1;
    },
    hasTracksAtAll: function () {
        return Meteor.tracker.hasTracks();
    },
    hasQuery: function () {
        return Meteor.queryTracks.hasQuery();
    },
    queryInput: function () {
        return Meteor.queryTracks.getQueryInput();
    }
});

Template.tracks.events({
    'click .load-more': function (event) {
        event.preventDefault();
        Meteor.tracks.increaseLimit();
    }
});

Template.tracks.onCreated(function () {

    var _self = this;
    _self.loaded = new ReactiveVar(0);

    this.autorun(function () {
        NProgress.start();
        var limit, subscription;
        subscription = _self.subscribe("TrackData");
        limit = Meteor.tracks.getLimit();

        if (subscription.ready()) {
            if (!Meteor.queryTracks.hasQuery()) {
                _self.loaded.set(limit);
            }
            NProgress.done();
        }
    });

    _self.tracks = function () {
        if (Meteor.queryTracks.hasQuery()) {
            return TrackData.find(Meteor.queryTracks.getQuery(), {sort: {date: -1, track: 1}});
        } else {
            return TrackData.find({}, {limit: _self.loaded.get(), sort: {date: -1, track: 1}});
        }
    }


})
;