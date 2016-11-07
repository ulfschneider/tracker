Template.createTrack.events({
    "keyup #newTrack": function(event) {
        if (event.which !== 13) {
            $("#newTrack").removeClass("error");
        }
    },
    "keypress #newTrack": function (event) {
        if (event.which === 13) {
            event.preventDefault();
            event.stopPropagation();
            var track = Meteor.tracker.analyzeTrack($("#newTrack").val());
            if (track.errors.length) {
                var errors = Meteor.tracker.errorPrintHtml(track.errors);
                $("#errors").html(errors);
                $("#newTrack").addClass("error");
            } else {
                $("#errors").html("");
                Meteor.call("upsert", track.trackData, function (error, result) {
                    if (!error) {
                        $("#newTrack").val("");
                    }
                });
            }
        }
    }
});

Template.createTrack.rendered = function () {
    $("#newTrack").autosize();
}