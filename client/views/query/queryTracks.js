import {Session} from "meteor/session";

Meteor.queryTracks = {
    _setQuery: function (query) {
        Session.set("query", query);
    },
    _query: function () {
        var input = $("#query").val();
        var analyze = Meteor.tracker.analyzeQuery(input);
        var errors = "";

        if (analyze.errors.length) {
            errors = Meteor.tracker.printErrorHtml(analyze.errors);
            $("#query-errors").html(errors);
            $("#query").addClass("error");
        } else {
            $("#query-errors").html("");

            var query = {};
            if (analyze.data.tracks) {
                query.track = {$in: analyze.data.tracks};
            }

            if (analyze.data.from || analyze.data.to) {
                var dateSelector = {};
                if (analyze.data.from) {
                    dateSelector.$gte = analyze.data.from;
                }
                if (analyze.data.to) {
                    dateSelector.$lte = analyze.data.to;
                }
                query.date = dateSelector;
            }

            $("#query").blur(); //hide keyboard on touch devices
            if (_.isEmpty(query)) {
                Meteor.queryTracks._setQuery("");
            } else {
                Meteor.queryTracks._setQuery(query);
            }
        }
    },
    _reset: function () {
        $("#query").val("");
        $("#query").removeClass("error");
        $("#query-errors").html("");
        $(".control .query").hide();
        $(".control .reset").hide();

        $("#query").blur(); //hide keyboard on touch devices
        Meteor.queryTracks._setQuery("");
    },
    getQuery: function () {
        var query = Session.get("query");
        return query ? query : "";
    },
    hasQuery: function () {
        return Meteor.queryTracks.getQuery() ? true : false;
    }
}

Template.queryTracks.events({
    "click a.query": function (event) {
        event.preventDefault();
        event.stopPropagation();

        Meteor.queryTracks._query();
    },
    "click a.reset": function (event) {
        event.preventDefault();
        event.stopPropagation();

        Meteor.queryTracks._reset();
    },
    "keyup textarea": function (event) {
        if (event.which !== 13) {
            $("#query").removeClass("error");
        }
        if (event.which === 27) {
            Meteor.queryTracks._reset();
        }
        if($("#query").val()) {
            $(".control .reset").show();
            $(".control .query").show();
        } else {
            $("#query-errors").html("");
            $(".control .query").hide();
            $(".control .reset").hide();
        }

    },
    "keypress textarea": function (event) {
        if (event.which === 13) {
            event.preventDefault();
            event.stopPropagation();

            Meteor.queryTracks._query();
        }
    }

});

Template.queryTracks.helpers({
    hasQuery:function() {
        return Meteor.queryTracks.hasQuery();
    }
});


Template.queryTracks.rendered = function () {
    $("#query").autosize();

    if($("#query").val()) {
        $(".control .reset").show();
        $(".control .query").show();
    } else {
        $(".control .query").hide();
        $(".control .reset").hide();
    }

    $("#query").textcomplete([
        {
            match: /(^|[\s]+)#([^\s]*)$/,
            search: function (term, callback) {
                callback($.map(Meteor.tracker.getTrackBuckets(), function (element) {
                    return element.indexOf(term) === 0 ? element : null;
                }));
            },
            index: 2,
            replace: function (element) {
                return "$1#" + element + " ";
            }
        },
        {
            match: /(^|[\s]+)@([^\s]*)$/,  //@ as an alternate for mobile phones, the @ is easier to reach than #
            search: function (term, callback) {
                callback($.map(Meteor.tracker.getTrackBuckets(), function (element) {
                    return element.indexOf(term) === 0 ? element : null;
                }));
            },
            index: 2,
            replace: function (element) {
                trackBuckets = null;
                return "$1#" + element + " ";
            }
        }
    ]);
}
