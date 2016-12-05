import {Filter} from "/lib/filter.js";

Meteor.tracker = {
    ERR_MULTIPLE_DATE: 1,
    ERR_MULTIPLE_TIME: 2,
    ERR_FUTURE_DATE: 3,
    ERR_MULTIPLE_TRACKS: 4,
    ERR_NO_TRACK: 5,
    ERR_UNRECOGNIZED: 6,

    TOKEN_TRACK: "#",
    TOKEN_COMMENT: "//",
    TOKEN_RANGE: "..",

    COUNT_RELOAD: 75,

    cacheTrackBuckets: null,
    cacheResultBuckets: null,


    getTrackBuckets: function () {
        if (this.cacheTrackBuckets) {
            return this.cacheTrackBuckets;
        }

        this.cacheTrackBuckets = [];
        var track = "";
        var cursor = TrackData.find({}, {fields: {track: 1}, sort: {track: 1}}).map(function (t) {
            return t.track;
        });

        var _self = this;
        cursor.forEach(function (t) {
            if (t != track) {
                _self.cacheTrackBuckets.push(t);
                track = t;
            }
        });

        return this.cacheTrackBuckets;
    },
    clearCacheTrackBuckets: function () {
        this.cacheTrackBuckets = null;
    },
    getResultBuckets: function () {
        if (this.cacheResultBuckets) {
            return this.cacheResultBuckets;
        }
        var buckets = new Filter();
        var cursor = TrackData.find({}, {fields: {results: 1}}).map(function (t) {
            return t.results;
        });
        cursor.forEach(function (results) {
            _.each(results, function (r) {
                var bucket = Meteor.tracker.extractResultBucket(r);
                if (bucket) {
                    buckets.add(bucket);
                }
            });
        });

        this.cacheResultBuckets = buckets.getAll();
        return this.cacheResultBuckets;
    },
    clearCacheResultBuckets: function () {
        this.cacheResultBuckets = null;
    },

    printArray: function (value, delimiter, from, to) {
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
    printDuration: function (milliseconds) {
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
    printDay: function (day) {
        if (day) {
            var momentDay = moment(day);
            var now = new Date();

            if (moment(now).subtract(7, "day").isAfter(day, "day")) {
                return momentDay.format("YY-MM-DD");
            } else if (momentDay.isSame(now, "day")) {
                return "Today";
            } else if (moment(now).subtract(1, "day").isSame(day, "day")) {
                return "Yesterday";
            } else {
                return momentDay.format("dddd");
            }
        } else {
            return null;
        }
    },
    printErrorHtml: function (errors) {
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

    uid: function () {
        return "id-" + ("0000" + (Math.random() * Math.pow(36, 4) << 0).toString(36)).slice(-4)
    },
    extractResult: function (result) {
        return parseFloat(Meteor.tracker.extractResultString(result));
    },
    extractResultString: function (result) {
        var regex = /(^|[\s]+)(\d+(\.\d+)?)/;
        var match = regex.exec(result);

        if (match) {
            return match[2];
        } else {
            return "";
        }
    },
    extractResultBucket: function (result) {
        var bucket = "";
        var numberString = Meteor.tracker.extractResultString(result);

        if (numberString) {

            var idx = result.indexOf(numberString);

            if (idx == 0) {
                bucket = result.substr(idx + numberString.length, result.length);
            }
        }
        return bucket;
    },

    /* edit track */

    _initData: function () {
        var now = moment();
        now.set({second: 0, millisecond: 0}); //will influence order in tracklist, while the user can intentionally not set seconds and millis;
        return {
            date: now.toDate()
        };

    }
    ,
    _analyzeComment: function (analyze) {
        var regex = /\/\/.*/; //Meteor.track.TOKEN_COMMENT
        var comment = analyze.parse.match(regex);
        if (comment) {
            analyze.data.comment = comment[0].substring(2);
            analyze.parse = analyze.parse.replace(comment[0], "");
        }
    }
    ,
    _analyzeTrack: function (analyze) {
        var regex = /(#|@)[^\s]+\b/g;  //Meteor.track.TOKEN_TRACK, alternate for mobile phones, the @ is easier to reach than #
        var track = analyze.parse.match(regex);

        if (track) {
            analyze.data.track = track[0].substring(1).toLocaleLowerCase();
            _.each(track, function (match) {
                analyze.parse = analyze.parse.replace(match, "");
            });

            if (track.length > 1) {
                analyze.errors.push({
                    code: Meteor.tracker.ERR_MULTIPLE_TRACKS,
                    description: "Multiple tracks are not allowed: " + Meteor.tracker.printArray(track, " ", 1)
                });
            }
        } else {
            analyze.errors.push({
                code: Meteor.tracker.ERR_NO_TRACK,
                description: "No track specified - you can specify a track by typing #your_track_name"
            });
        }

    }
    ,
    _analyzeDuration: function (analyze) {
        var regex = /\b([0-9]+(d|h|m|s|i)[\s]*)+\b/gi;
        var duration = analyze.parse.match(regex);

        if (duration) {
            analyze.data.duration = Meteor.tracker._sumMillis(duration);
            _.each(duration, function (match) {
                analyze.parse = analyze.parse.replace(match, "");
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
    _analyzeDate: function (analyze) {
        var dates = [];
        var date;

        //today
        var regex = /\btoday\b/gi
        date = analyze.parse.match(regex);
        if (date) {
            _.each(date, function (match) {
                dates.push(moment().format("YYYY-MM-DD"));
                analyze.parse = analyze.parse.replace(match, "");
            });
        }

        //yesterday,yday,yest
        regex = /\byesterday\b|\byday\b|\byest\b/gi
        date = analyze.parse.match(regex);
        if (date) {
            _.each(date, function (match) {
                dates.push(moment().subtract(1, "day").format("YYYY-MM-DD"));
                analyze.parse = analyze.parse.replace(match, "");
            });

        }

        //mon,tue,wed,thu,fri,sat,son
        regex = /\bmon\b|\btue\b|\bwed\b|\bthu\b|\bfri\b|\bsat\b|\bsun\b|\bmonday\b|\btuesday\b|\bwednesday\b|\bthursday\b|\bfriday\b|\bsaturday\b|\bsunday\b/gi
        date = analyze.parse.match(regex);
        if (date) {
            var destination = date[0].toLocaleLowerCase();
            var dayPointer = moment();
            while (dayPointer.format("ddd").toLocaleLowerCase() != destination && dayPointer.format("dddd").toLocaleLowerCase() != destination) {
                dayPointer.subtract(1, "day");
            }
            _.each(date, function (match) {
                dates.push(dayPointer.format("YYYY-MM-DD"));
                analyze.parse = analyze.parse.replace(match, "");
            });

        }

        //2016-01-5,2016-01-25,
        regex = /\b(2[0-9])?[0-9]{2}-(0[1-9]|1[0-2])-(0[1-9]|[1-2][0-9]|3[0-1])\b/g;
        date = analyze.parse.match(regex);
        if (date) {
            dates = dates.concat(date);
            _.each(date, function (match) {
                analyze.parse = analyze.parse.replace(match, "");
            });
        }


        if (dates.length) {
            var parsedDate = moment(dates[0], ["YYYY-M-D", "YY-M-D"], true).toDate();

            var trackDate = moment(analyze.data.date);
            trackDate.set({year: parsedDate.getFullYear(), month: parsedDate.getMonth(), date: parsedDate.getDate()});
            analyze.data.date = trackDate.toDate();

            if (dates.length > 1) {
                analyze.errors.push({
                    code: Meteor.tracker.ERR_MULTIPLE_DATE,
                    description: "Multiple date entries are not allowed: " + Meteor.tracker.printArray(dates, " ", 1)
                });
            }
        }

    }
    ,
    _analyzeTime: function (analyze) {
        var regex = /\b([0-1]?[1-9]|2[0-3]):([0-5][0-9])\b/g;
        var time = analyze.parse.match(regex);

        if (time) {
            var parsedTime = moment(time[0], "HH:mm");

            var trackDate = moment(analyze.data.date);
            trackDate.set({hour: parsedTime.hours(), minute: parsedTime.minutes()});
            analyze.data.date = trackDate.toDate();

            _.each(time, function (match) {
                analyze.parse = analyze.parse.replace(match, "");
            });

            if (time.length > 1) {
                analyze.errors.push({
                    code: Meteor.tracker.ERR_MULTIPLE_TIME,
                    description: "Multiple time entries are not allowed: " + Meteor.tracker.printArray(time, " ", 1)
                });
            }
        }
    }
    ,
    _analyzeResults: function (analyze) {
        var regex = /\b[0-9]+[^\s]*\b/g;
        var results = analyze.parse.match(regex);

        if (results) {
            analyze.data.results = [];
            _.each(results, function (match) {
                analyze.data.results.push(match.toLocaleLowerCase());
                analyze.parse = analyze.parse.replace(match, "");
            });
        }
    }
    ,

    /* query tracks */
    _analyzeTracks: function (analyze) {
        var regex = /(#|@)[^\s]+\b/g;  //Meteor.track.TOKEN_TRACK, and @ as an alternate for mobile phones, the @ is easier to reach than #
        var tracks = analyze.parse.match(regex);

        if (tracks) {
            analyze.data.tracks = [];
            _.each(tracks, function (match) {
                analyze.data.tracks.push(match.substring(1).toLocaleLowerCase());
                analyze.parse = analyze.parse.replace(match, "");
            });

        }

    },
    _analyzeDates: function (analyze) {
        //2016-01-5,2016-01-25

        var regex = /\b(2[0-9])?[0-9]{2}-(0[1-9]|1[0-2])-(0[1-9]|[1-2][0-9]|3[0-1])[\s]*\.\.[\s]*(2[0-9])?[0-9]{2}-(0[1-9]|1[0-2])-(0[1-9]|[1-2][0-9]|3[0-1])\b|\b(2[0-9])?[0-9]{2}-(0[1-9]|1[0-2])-(0[1-9]|[1-2][0-9]|3[0-1])[\s]*\.\.|\.\.[\s]*(2[0-9])?[0-9]{2}-(0[1-9]|1[0-2])-(0[1-9]|[1-2][0-9]|3[0-1])\b/g;
        var dates = analyze.parse.match(regex);
        if (dates) {

            _.each(dates, function (match) {

                var equalIndex = match.indexOf(Meteor.tracker.TOKEN_RANGE);
                var equalLength = Meteor.tracker.TOKEN_RANGE.length;
                if (equalIndex == 0) {
                    //to
                    analyze.data.to = moment(match.substring(equalIndex + equalLength).trim(), ["YYYY-M-D", "YY-M-D"], true).toDate();
                } else if (equalIndex == match.length - equalLength) {
                    //from
                    analyze.data.from = moment(match.substring(0, equalIndex).trim(), ["YYYY-M-D", "YY-M-D"], true).toDate();
                } else {
                    //range
                    analyze.data.from = moment(match.substring(0, equalIndex).trim(), ["YYYY-M-D", "YY-M-D"], true).toDate();
                    analyze.data.to = moment(match.substring(equalIndex + equalLength).trim(), ["YYYY-M-D", "YY-M-D"], true).toDate()
                }

                analyze.parse = analyze.parse.replace(match, "");
            });

            if (dates.length > 1) {
                analyze.errors.push({
                    code: Meteor.tracker.ERR_MULTIPLE_DATE,
                    description: "Multiple date entries are not allowed: " + Meteor.tracker.printArray(dates, " ", 1)
                });
            }
        }
    }
    ,

    analyzeTrack: function (track) {
        var input = track ? track : "";
        var data = Meteor.tracker._initData(track);
        var analyze = {input: input, parse: input, data: data, errors: []};

        Meteor.tracker._analyzeComment(analyze);

        Meteor.tracker._analyzeTrack(analyze);

        Meteor.tracker._analyzeDate(analyze);

        Meteor.tracker._analyzeTime(analyze);

        //no date in the future
        if (moment(analyze.data.date).isAfter(new Date())) {
            analyze.errors.push({
                code: Meteor.tracker.ERR_FUTURE_DATE,
                description: "Track date in the future is not allowed: " + moment(analyze.data.date).format("ddd YYYY-MM-DD HH:mm")
            });
        }

        Meteor.tracker._analyzeDuration(analyze);

        Meteor.tracker._analyzeResults(analyze);

        if (analyze.parse.trim().length > 0) {
            analyze.errors.push({
                code: Meteor.tracker.ERR_UNRECOGNIZED,
                description: "Unrecognized tokens: " + analyze.parse.trim()
            });
        }

        delete analyze.parse;

        return analyze;
    },
    analyzeQuery: function (query) {
        var input = query ? query : "";
        var data = {};
        var analyze = {input: input, parse: input, data: data, errors: []};

        Meteor.tracker._analyzeTracks(analyze);
        Meteor.tracker._analyzeDates(analyze);

        if (analyze.parse.trim().length > 0) {
            analyze.errors.push({
                code: Meteor.tracker.ERR_UNRECOGNIZED,
                description: "Unrecognized tokens: " + analyze.parse.trim()
            });
        }

        delete analyze.parse;

        return analyze;
    }

}