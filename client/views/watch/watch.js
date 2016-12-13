import {Session} from "meteor/session";

Meteor.watch = {
    startTime: null,
    millis: 0,
    pausedMillis: 0,
    interval: null,
    stayAwakeInterval:null,

    _setTime: function (time) {
        if (_.isUndefined(time)) {
            var now = new Date();
            Meteor.watch.millis = (now.getTime() - Meteor.watch.startTime.getTime()) + Meteor.watch.pausedMillis;
            Meteor.watch.millis = Math.floor(Meteor.watch.millis / 1000) * 1000;
            var duration = Meteor.tracker.printDuration(Meteor.watch.millis);
            $("#time").html(duration ? duration : "0");
        } else {
            $("#time").html(time);
        }
    },
    _isIos: function() {
        return /AppleWebKit/.test(navigator.userAgent) && /Mobile\/\w+/.test(navigator.userAgent);
    },
    _awakeLock: function() {
        /*
         The idea of the hack is the following:
         If a new page is requested in safari, the ios device will reset the sleep timeout.

         There will be a request each 15 seconds to a page, so the ios device will not be put to sleep,
         and the request will be cancelled, so you don't navigate away from the page.
         http://stackoverflow.com/questions/18905413/how-can-i-prevent-iphone-including-ios-7-from-going-to-sleep-in-html-or-js
         */
        if (this._isIos()) {
            this._clearAwakeLock();
            this.stayAwakeInterval = Meteor.setInterval(function () {
                window.location.href = "/";
                Meteor.setTimeout(window.stop, 0);
            }, 15000);
        }
    },
    _clearAwakeLock: function() {
        if (this._isIos()) {
            if (this.stayAwakeInterval) {
                Meteor.clearInterval(this.stayAwakeInterval);
                this.stayAwakeInterval = null;
            }
        }
    },
    start: function () {
        this.startTime = new Date();
        this._setTime();
        this.interval = Meteor.setInterval(this._setTime, 100);
        Session.set("watch", "running");
        this._awakeLock();
    },
    stop: function () {
        this._clearAwakeLock();
        Meteor.clearInterval(this.interval);
        Session.set("watch", "stopped");
        this._setTime();
        this.pausedMillis = this.millis;
    },
    toggle: function() {
        if (this.isRunning()) {
            this.stop();
        } else {
            this.start();
        }
    },
    setTime: function () {
        this._clearAwakeLock();
        Session.set("watchTime", this.millis);
        this.setWatchModeOff();
    },
    clear: function () {
        this._clearAwakeLock();
        Session.set("watch", "cleared");
        Session.set("watchTime", 0);
        this.millis = 0;
        this.pausedMillis = 0;
        this._setTime("0");
    },
    setWatchModeOn: function () {
        Session.set("watchMode", true);
    },
    setWatchModeOff: function () {
        Session.set("watchMode", false);
    },
    isRunning: function () {
        return Session.get("watch") == "running" ? true : false;
    },
    isStopped: function () {
        return !this.isRunning();
    },
    isWatchMode: function () {
        return Session.get("watchMode") ? true : false;
    },
    getTime: function() {
        var time = Session.get("watchTime");
        return time ? time : 0;
    }
}


Template.watch.helpers({
    running: function () {
        return Meteor.watch.isRunning() ? "running" : "";
    },
    stopped: function () {
        return Meteor.watch.isStopped() ? "stopped" : "";
    },
    hasTime: function () {
        return Meteor.watch.isStopped() && Meteor.watch.millis ? "has-time" : "";
    }
});


Template.watch.events({
    "click .start": function (event) {
        event.preventDefault();
        event.stopPropagation();

        Meteor.watch.start();
    },
    "click .stop": function (event) {
        event.preventDefault();
        event.stopPropagation();

        Meteor.watch.stop();
    },
    "click .clear": function (event) {
        event.preventDefault();
        event.stopPropagation();

        Meteor.watch.clear();
    },
    "click .return": function (event) {
        event.preventDefault();
        event.stopPropagation();

        Meteor.watch.setTime();
    }
});

Template.watch.onRendered(function () {
    $("#time").fitText(1, {minFontSize: '1.62em'});
    Meteor.watch.clear();
})


