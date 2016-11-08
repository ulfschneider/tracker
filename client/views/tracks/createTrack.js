Template.createTrack.events({
    "keyup #newTrack": function (event) {
        if (event.which !== 13) {
            $("#newTrack").removeClass("error");
        }
    },
    "keypress #newTrack": function (event) {
        if (event.which === 13) {
            event.preventDefault();
            event.stopPropagation();
            var track = Meteor.tracker.analyzeTrack($("#newTrack").val());
            var errors;
            if (track.errors.length) {
                errors = Meteor.tracker.errorPrintHtml(track.errors);
                $("#errors").html(errors);
                $("#newTrack").addClass("error");
            } else {
                $("#errors").html("");
                Meteor.call("upsert", track.data, function (error, result) {
                    if (!error) {
                        $("#newTrack").val("");
                    } else {
                        errors = Meteor.tracker.errorPrintHtml([{description: "Your track could not be stored on the server. " + error}]);
                        $("#errors").html(errors);
                    }
                });
            }
        }
    }
});

Template.createTrack.rendered = function () {
    $("#newTrack").autosize();
}