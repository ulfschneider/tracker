Meteor.createTrack = {
    _initTrackData: function (track) {
        return {
            date: new Date(),
            input: track
        };

    },
    _analyzeComment: function (track) {
        var regex = /\/\/.*/;
        return track.match(regex);
    },
    _analyzeWorkout: function (track) {
        var regex = /#[^\s]+/g;
        return track.match(regex);
    },
    _analyzeDuration: function (track) {
        var regex = /([0-9]+(h|m|s|i)[\s]*)+/gi;
        return track.match(regex);
    },
    _sumMillis: function (duration) {
        var split = [];

        if (duration) {
            var regex = /[0-9]+(h|m|s|i)/gi;
            _.each(duration, function (match) {
                split = split.concat(match.match(regex));
            });
        }

        var sum = 0; //milliseconds
        _.each(split, function (match) {
            var multiplier = 0;
            if (match.indexOf("h") > 0) {
                //hours
                multiplier = 1000 * 60 * 60;
            } else if (match.indexOf("m") > 0) {
                //minutes
                multiplier = 1000 * 60;
            } else if (match.indexOf("s") > 0) {
                //seconds
                multiplier = 1000;
            } else if (match.indexOf("i") > 0) {
                multiplier = 1;
            }
            sum += (parseInt(match) * multiplier);
        });

        return sum;
    },
    _analyzeDate: function (track) {
        var regex = /[0-9]{4}-(0?[1-9]|1[0-2])-(0?[1-9]|[1-2][0-9]|3[0-1])/g;
        return track.match(regex);
    },
    _analyzeTime: function (track) {
        var regex = /([0-1]?[1-9]|2[0-3]):([0-5][0-9])/g;
        return track.match(regex);
    },
    _analyzeResults: function (track) {
        var regex = /[0-9]+[^\s]*/g;
        return track.match(regex);
    },
    analyzeTrack: function (track) {
        if (track) {
            var trackData = Meteor.createTrack._initTrackData(track);

            //comment
            var comment = Meteor.createTrack._analyzeComment(track);
            if (comment) {
                trackData.comment = comment[0].substring(2);
                track = track.replace(comment[0], "");
            }

            //date
            var workoutDate = {
                year: trackData.date.getFullYear(),
                month: trackData.date.getMonth(),
                day: trackData.date.getDate(),
                hour: trackData.date.getHours(),
                minute: trackData.date.getMinutes(),
                second: 0
            };

            var date = Meteor.createTrack._analyzeDate(track);
            if (date) {
                var parsedDate = moment(date[0], "YYYY-M-D", true).toDate();
                workoutDate.year = parsedDate.getFullYear();
                workoutDate.month = parsedDate.getMonth();
                workoutDate.day = parsedDate.getDate();

                trackData.date = moment(workoutDate).toDate();
                track = track.replace(date[0], "");
            }

            //time
            var time = Meteor.createTrack._analyzeTime(track);
            if (time) {
                var parsedTime = moment(time[0], "HH:mm").toDate();
                workoutDate.hour = parsedTime.getHours();
                workoutDate.minute = parsedTime.getMinutes();

                trackData.date = moment(workoutDate).toDate();
                track = track.replace(time[0], "");
            }

            //workout
            var workout = Meteor.createTrack._analyzeWorkout(track);
            if (workout) {
                trackData.workout = workout[0].substring(1);
                track = track.replace(workout[0]);
            }

            //duration
            var duration = Meteor.createTrack._analyzeDuration(track);
            if (duration) {
                trackData.duration = Meteor.createTrack._sumMillis(duration);
                _.each(duration, function (match) {
                    track = track.replace(match, "");
                });
            }

            //results
            var results = Meteor.createTrack._analyzeResults(track);
            if (results) {
                trackData.results = results;
                _.each(results, function (match) {
                    track = track.replace(match, "");
                });

            }

            return trackData;
        } else {
            return null;
        }
    }
};

Template.createTrack.events = {
    "keypress #newTrack": function (event) {
        if (event.which === 13) {
            event.preventDefault();
            event.stopPropagation();
            var trackData = Meteor.createTrack.analyzeTrack($("#newTrack").val());
            Meteor.call("upsert", trackData, function (error, result) {
                if (!error) {
                    $("#newTrack").val("");
                }
            });
        }
    }
};

Template.createTrack.rendered = function () {
    $("#newTrack").autosize();
}