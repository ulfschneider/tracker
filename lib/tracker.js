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
    errorPrintHtml: function (errors) {
        var html = "";
        if (errors) {
            html = "<ul>";
            _.each(errors, function (error) {
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
    _analyzeComment: function (trackParse) {
        var regex = /\/\/.*/;
        var comment = trackParse.track.match(regex);
        if (comment) {
            trackParse.trackData.comment = comment[0].substring(2);
            trackParse.track = trackParse.track.replace(comment[0], "");
        }
    }
    ,
    _analyzeWorkout: function (trackParse) {
        var regex = /#[^\s]+\b/g;
        var workout = trackParse.track.match(regex);

        if (workout) {
            trackParse.trackData.workout = workout[0].substring(1);
            _.each(workout, function (match) {
                trackParse.track = trackParse.track.replace(match, "");
            });

            if (workout.length > 1) {
                trackParse.errors.push({
                    code: Meteor.tracker.ERR_MULTIPLE_WORKOUT,
                    description: "Multiple workouts are not allowed: " + Meteor.tracker.arrayPrint(workout, " ", 1)
                });
            }
        } else {
            trackParse.errors.push({
                code: Meteor.tracker.ERR_NO_WORKOUT,
                description: "No workout specified - you can specify a workout by typing #your_workout_name"
            });
        }

    }
    ,
    _analyzeDuration: function (trackParse) {
        var regex = /\b([0-9]+(d|h|m|s|i)[\s]*)+\b/gi;
        var duration = trackParse.track.match(regex);

        if (duration) {
            trackParse.trackData.duration = Meteor.tracker._sumMillis(duration);
            _.each(duration, function (match) {
                trackParse.track = trackParse.track.replace(match, "");
            });
        }
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
    _analyzeDate: function (trackParse) {
        var dates = [];
        var date;

        //today
        var regex = /\btoday\b/gi
        date = trackParse.track.match(regex);
        if (date) {
            dates.push(moment().format("YYYY-MM-DD"));
            _.each(date, function (match) {
                trackParse.track = trackParse.track.replace(match, "");
            });
        }

        //yesterday,yday,yest
        regex = /\byesterday\b|\byday\b|\byest\b/gi
        date = trackParse.track.match(regex);
        if (date) {
            dates.push(moment().subtract(1, "day").format("YYYY-MM-DD"));
            _.each(date, function (match) {
                trackParse.track = trackParse.track.replace(match, "");
            });

        }

        //mon,tue,wed,thu,fri,sat,son
        regex = /\bmon\b|\btue\b|\bwed\b|\bthu\b|\bfri\b|\bsat\b|\bsun\b/gi
        date = trackParse.track.match(regex);
        if (date) {
            var destination = date[0].toLowerCase();
            var dayPointer = moment();
            while (dayPointer.format("ddd").toLowerCase() != destination) {
                dayPointer.subtract(1, "day");
            }
            dates.push(dayPointer.format("YYYY-MM-DD"));
            _.each(date, function (match) {
                trackParse.track = trackParse.track.replace(match, "");
            });

        }

        //2016-11-25
        regex = /\b([0-9][0-9])?[0-9]{2}-(0?[1-9]|1[0-2])-(0?[1-9]|[1-2][0-9]|3[0-1])\b/g;
        date = trackParse.track.match(regex);
        if (date) {
            dates = dates.concat(date);
            _.each(date, function (match) {
                trackParse.track = trackParse.track.replace(match, "");
            });
        }

        var workoutDate = {
            year: trackParse.trackData.date.getFullYear(),
            month: trackParse.trackData.date.getMonth(),
            date: trackParse.trackData.date.getDate(),
            hour: trackParse.trackData.date.getHours(),
            minute: trackParse.trackData.date.getMinutes(),
            second: 0
        };

        if (dates.length) {
            var parsedDate = moment(dates[0], ["YYYY-M-D", "YY-M-D"], true).toDate();

            workoutDate.year = parsedDate.getFullYear();
            workoutDate.month = parsedDate.getMonth();
            workoutDate.day = parsedDate.getDate();

            trackParse.trackData.date = moment(workoutDate).toDate();

            if (dates.length > 1) {
                trackParse.errors.push({
                    code: Meteor.tracker.ERR_MULTIPLE_DATE,
                    description: "Multiple date entries are not allowed: " + Meteor.tracker.arrayPrint(dates, " ", 1)
                });
            }
        }

    }
    ,
    _analyzeTime: function (trackParse) {
        var regex = /\b([0-1]?[1-9]|2[0-3]):([0-5][0-9])\b/g;
        var time = trackParse.track.match(regex);

        if (time) {
            var parsedTime = moment(time[0], "HH:mm");

            var workoutDate = {
                year: trackParse.trackData.date.getFullYear(),
                month: trackParse.trackData.date.getMonth(),
                date: trackParse.trackData.date.getDate(),
                hour: parsedTime.hours(),
                minute: parsedTime.minutes(),
                second: 0
            };

            trackParse.trackData.date = moment(workoutDate).toDate();

            _.each(time, function (match) {
                trackParse.tack = trackParse.track.replace(match, "");
            });

            if (time.length > 1) {
                trackParse.errors.push({
                    code: Meteor.tracker.ERR_MULTIPLE_TIME,
                    description: "Multiple time entries are not allowed: " + Meteor.tracker.arrayPrint(time, " ", 1)
                });
            }
        }
    }
    ,
    _analyzeResults: function (trackParse) {
        var regex = /\b[0-9]+[^\s]*\b/g;
        var results = trackParse.track.match(regex);

        if (results) {
            trackParse.trackData.results = results;
            _.each(results, function (match) {
                trackParse.track = trackParse.track.replace(match, "");
            });
        }
    }
    ,
    analyzeTrack: function (track) {
        var input = track ? track : "";
        var trackData = Meteor.tracker._initTrackData(track);
        var trackParse = {input: input, track: input, trackData: trackData, errors: []};

        Meteor.tracker._analyzeComment(trackParse);

        Meteor.tracker._analyzeWorkout(trackParse);

        Meteor.tracker._analyzeDate(trackParse);

        Meteor.tracker._analyzeTime(trackParse);

        //no date in the future
        if (moment(trackParse.trackData.date).isAfter(new Date())) {
            trackParse.errors.push({
                code: Meteor.tracker.ERR_FUTURE_DATE,
                description: "Track date in the future is not allowed: " + moment(trackParse.trackData.date).format("ddd YYYY-MM-DD HH:mm")
            });
        }

        Meteor.tracker._analyzeDuration(trackParse);

        Meteor.tracker._analyzeResults(trackParse);

        if (trackParse.track.trim().length > 0) {
            trackParse.errors.push({
                code: Meteor.tracker.ERR_UNRECOGNIZED,
                description: "Unrecognized tokens: " + trackParse.track.trim()
            });
        }

        return trackParse;
    }

}