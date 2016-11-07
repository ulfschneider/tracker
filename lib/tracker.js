Meteor.tracker = {
    ERR_MULTIPLE_DATE: 1,
    ERR_MULTIPLE_TIME: 2,
    ERR_FUTURE_DATE: 3,
    ERR_MULTIPLE_WORKOUT: 4,
    ERR_NO_WORKOUT: 5,
    ERR_UNRECOGNIZED: 6,

    arrayPrint: function (value, delimiter, from, to) {
        var pretty = "";

        if (value && value.length) {
            from = _.isUndefined(from) ? 0 : from;
            to = _.isUndefined(to) ? value.length : to;

            for (var i = 0; i < value.length && i < to; i++) {
                if (i >= from) {
                    pretty += value[i].toString();
                    if (i < value.length - 1 && i < to - 1 && delimiter) {
                        pretty += delimiter;
                    }
                }
            }
        }
        else if (value) {
            pretty = value.toString();
        }
        return pretty;
    }
    ,
    durationPrint: function (milliseconds) {
        var pretty = "";
        var days = 0;
        var hours = 0;
        var minutes = 0;
        var seconds = 0;
        var millis = 0;

        if (milliseconds && milliseconds > 1000 * 60 * 60 * 24) {
            //days
            days = Math.floor(milliseconds / (1000 * 60 * 60 * 24));
            milliseconds -= (days * 1000 * 60 * 60 * 24);
        }

        if (milliseconds && milliseconds > 1000 * 60 * 60) {
            //hours
            hours = Math.floor(milliseconds / (1000 * 60 * 60));
            milliseconds -= (hours * 1000 * 60 * 60);
        }

        if (milliseconds && milliseconds > 1000 * 60) {
            //minutes
            minutes = Math.floor(milliseconds / (1000 * 60));
            milliseconds -= (minutes * 1000 * 60);
        }

        if (milliseconds && milliseconds > 1000) {
            //seconds
            seconds = Math.floor(milliseconds / 1000);
            milliseconds -= (seconds * 1000);
        }

        if (milliseconds) {
            millis = milliseconds;
        }

        if (days) {
            pretty += (days + "d");
        }

        if (hours || pretty && (minutes || seconds || millis)) {
            pretty += pretty ? " " : "";
            pretty += (hours + "h");
        }

        if (minutes || pretty && (seconds || millis)) {
            pretty += pretty ? " " : "";
            pretty += (minutes + "m");
        }

        if (seconds || pretty && millis) {
            pretty += pretty ? " " : "";
            pretty += (seconds + "s");
        }

        if (millis) {
            pretty += pretty ? " " : "";
            pretty += (millis + "i");
        }

        return pretty;
    }
    ,
    errorPrintHtml: function(errors) {
        var html = "";
        if (errors) {
            html = "<ul>";
            _.each(errors, function(error) {
                html += "<li>";
                html += "_";
                html += error.description;
                html += "</li>";
            });
            html += "</ul>"
        }
        return html;
    },
    _initTrackData: function () {
        return {
            date: new Date()
        };

    }
    ,
    _analyzeComment: function (track) {
        var regex = /\/\/.*/;
        return track.match(regex);
    }
    ,
    _analyzeWorkout: function (track) {
        var regex = /#[^\s]+\b/g;
        return track.match(regex);
    }
    ,
    _analyzeDuration: function (track) {
        var regex = /\b([0-9]+(d|h|m|s|i)[\s]*)+\b/gi;
        return track.match(regex);
    }
    ,
    _sumMillis: function (duration) {
        var split = [];

        if (duration) {
            var regex = /[0-9]+(d|h|m|s|i)/gi;
            _.each(duration, function (match) {
                split = split.concat(match.match(regex));
            });
        }

        var sum = 0; //milliseconds
        _.each(split, function (match) {
            var multiplier = 0;
            if (match.indexOf("d") > 0) {
                //hours
                multiplier = 1000 * 60 * 60 * 24;
            } else if (match.indexOf("h") > 0) {
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
    }
    ,
    _analyzeDate: function (track) {
        var dates = [];
        var match;

        //today
        var regex = /\btoday\b/gi
        match = track.match(regex);
        if (match) {
            dates.push(moment().format("YYYY-MM-DD"));
        }

        //yesterday,yday,yest
        regex = /\byesterday\b|\byday\b|\byest\b/gi
        match = track.match(regex);
        if (match) {
            dates.push(moment().subtract(1, "day").format("YYYY-MM-DD"));
        }

        //mon,tue,wed,thu,fri,sat,son
        regex = /\bmon\b|\btue\b|\bwed\b|\bthu\b|\bfri\b|\bsat\b|\bsun\b/gi
        match = track.match(regex);
        if (match) {
            var destination = match[0].toLowerCase();
            var dayPointer = moment();
            while (dayPointer.format("ddd").toLowerCase() != destination) {
                dayPointer.subtract(1, "day");
            }
            dates.push(dayPointer.format("YYYY-MM-DD"));
        }

        //2016-11-25
        regex = /\b([0-9][0-9])?[0-9]{2}-(0?[1-9]|1[0-2])-(0?[1-9]|[1-2][0-9]|3[0-1])\b/g;
        match = track.match(regex);
        if (match) {
            dates = dates.concat(match);
        }

        if (dates.length > 0) {
            return dates;
        }

        return null;
    }
    ,
    _analyzeTime: function (track) {
        var regex = /\b([0-1]?[1-9]|2[0-3]):([0-5][0-9])\b/g;
        return track.match(regex);
    }
    ,
    _analyzeResults: function (track) {
        var regex = /\b[0-9]+[^\s]*\b/g;
        return track.match(regex);
    }
    ,
    analyzeTrack: function (track) {
        track = track ? track : "";
        var input = track;
        var errors = [];
        var trackData = Meteor.tracker._initTrackData();

        //comment
        var comment = Meteor.tracker._analyzeComment(track);
        if (comment) {
            trackData.comment = comment[0].substring(2);
            track = track.replace(comment[0], "");
        }

        //date
        var workoutDate = {
            year: trackData.date.getFullYear(),
            month: trackData.date.getMonth(),
            date: trackData.date.getDate(),
            hour: trackData.date.getHours(),
            minute: trackData.date.getMinutes(),
            second: 0
        };

        var date = Meteor.tracker._analyzeDate(track);
        if (date) {
            var parsedDate = moment(date[0], ["YYYY-M-D", "YY-M-D"], true).toDate();

            workoutDate.year = parsedDate.getFullYear();
            workoutDate.month = parsedDate.getMonth();
            workoutDate.day = parsedDate.getDate();

            trackData.date = moment(workoutDate).toDate();

            _.each(date, function (match) {
                track = track.replace(match, "");
            });

            if (date.length > 1) {
                errors.push({
                    code: Meteor.tracker.ERR_MULTIPLE_DATE,
                    description: "Multiple date entries are not allowed: " + Meteor.tracker.arrayPrint(date, " ", 1)
                });
            }
        }

        //time
        var time = Meteor.tracker._analyzeTime(track);
        if (time) {
            var parsedTime = moment(time[0], "HH:mm").toDate();
            workoutDate.hour = parsedTime.getHours();
            workoutDate.minute = parsedTime.getMinutes();

            trackData.date = moment(workoutDate).toDate();
            track = track.replace(time[0], "");

            _.each(time, function (match) {
                track = track.replace(match, "");
            });

            if (time.length > 1) {
                errors.push({
                    code: Meteor.tracker.ERR_MULTIPLE_TIME,
                    description: "Multiple time entries are not allowed: " + Meteor.tracker.arrayPrint(time, " ", 1)
                });
            }
        }


        //no date in the future
        if (moment(trackData.date).isAfter(new Date())) {
            errors.push({
                code: Meteor.tracker.ERR_FUTURE_DATE,
                description: "Track date in the future is not allowed: " + moment(trackData.date).format("YYYY-MM-DD HH:mm")
            });
        }


        //workout
        var workout = Meteor.tracker._analyzeWorkout(track);
        if (workout) {
            trackData.workout = workout[0].substring(1);
            _.each(workout, function (match) {
                track = track.replace(match, "");
            });

            if (workout.length > 1) {
                errors.push({
                    code: Meteor.tracker.ERR_MULTIPLE_WORKOUT,
                    description: "Multiple workouts are not allowed: " + Meteor.tracker.arrayPrint(workout, " ", 1)
                });
            }
        } else {
            errors.push({
                code: Meteor.tracker.ERR_NO_WORKOUT,
                description: "No workout specified - you can do this by typing #your_workout_name"
            });
        }

        //duration
        var duration = Meteor.tracker._analyzeDuration(track);
        if (duration) {
            trackData.duration = Meteor.tracker._sumMillis(duration);
            _.each(duration, function (match) {
                track = track.replace(match, "");
            });
        }

        //results
        var results = Meteor.tracker._analyzeResults(track);
        if (results) {
            trackData.results = results;
            _.each(results, function (match) {
                track = track.replace(match, "");
            });

        }

        if (track.trim().length > 0) {
            errors.push({
                code: Meteor.tracker.ERR_UNRECOGNIZED,
                description: "Unrecognized tokens: " + track.trim()
            });
        }

        if (errors.length) {
            return {
                input: input,
                errors: errors,
                recognized: trackData
            };
        }

        return trackData;
    }

}