Meteor.createTrack = {
    _initTrackData: function (track) {
        return {
            date: new Date(),
            input: track
        };

    },
    _analyzeComment: function (track) {
        var regExp = /\/\/.*/;
        return track.match(regExp);
    },
    _analyzeWorkout: function (track) {
        var regExp = /(^|[\s])#[^\s]+/g;
        return track.match(regExp);
    },
    _analyzeDuration: function (track) {
        var regExp = /(^|[\s])([0-9]+(h|m|s|i)[\s]*)+($|[\s])/gi;
        return track.match(regExp);
    },
    _sumMillis: function(duration){
        var split = [];

        if (duration) {
            var regExp = /[0-9]+(h|m|s|i)/gi;
            _.each(duration, function(match) {
                split = split.concat(match.match(regExp));
            });
        }

        var sum = 0; //milliseconds
        _.each(split, function(match) {
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
    _analyzeResults: function (track) {
        var regExp = /(^|[\s])[0-9][0-9]*(\.|,)*[0-9]*[^\s]*/g;
        return track.match(regExp);
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

            //workout
            var workout = Meteor.createTrack._analyzeWorkout(track);
            if (workout) {
                trackData.workout = workout[0].substring(1);
                _.each(workout, function(match) {
                    track = track.replace(match, "");
                });
            }

            //duration
            var duration = Meteor.createTrack._analyzeDuration(track);
            if (duration) {
                trackData.duration = Meteor.createTrack._sumMillis(duration);
                _.each(duration, function(match) {
                    track = track.replace(match, "");
                });
            }

            //date



            //results
            var results = Meteor.createTrack._analyzeResults(track);
            if (results) {
                console.log(JSON.stringify(results));
                trackData.results = results;
                _.each(results, function(match) {
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