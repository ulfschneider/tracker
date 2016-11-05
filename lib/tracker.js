Meteor.tracker = {

    arrayPrint: function (value, delimiter) {
        var pretty = "";
        if (value && value.length) {
            for (var i = 0; i < value.length; i++) {
                pretty += value[i].toString();
                if (i < value.length - 1 && delimiter) {
                    pretty += delimiter;
                }
            }

        } else if (value) {
            pretty = value.toString();
        }
        return pretty;
    },
    durationPrint: function(milliseconds) {
        var pretty = "";
        var hours = 0;
        var minutes = 0;
        var seconds = 0;
        var millis = 0;

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

        if (hours) {
            pretty += (hours + "h");
        }

        if (minutes || pretty && (seconds || millis)) {
            pretty += (minutes + "m");
        }

        if (seconds || pretty && millis) {
            pretty += (seconds + "s");
        }

        if (millis) {
            pretty += (millis + "i");
        }


        return pretty;
    }
}