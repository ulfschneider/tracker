var day = null; //browser window scope

Meteor.track = {
    formatDay: function(day) {
        var now = new Date();
        if (moment(day).isBefore(now, "week") && moment(day).isSame(now, "year")) {
            return moment(day).format("dd Mo MMM");
        } else if (moment(day).isBefore(now, "week")) {
            return moment(day).format("dd Mo MMM YY");
        } else if (day) {
            return moment(day).format("dd");
        }
    }
}

Template.track.helpers({
    day: function () {
        //detect if date changed compared to track from before
        var result = null;
        var date = Template.currentData().date;

        if (day == null) {
            result = date;
            day = date;
        } else if (!moment(day).isSame(date, "day")) {
            result = date;
        }

        return Meteor.track.formatDay(result);
    },
    time: function () {
        return moment(new Date()).format("HH:mm");
    },
    workout: function () {
        return "6pyra";
    },
    results: function () {
        return "18m30s";
    },
    comment: function () {
        return "PB";
    }
});