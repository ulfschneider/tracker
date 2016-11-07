Template.createTrack.events = {
    "keypress #newTrack": function (event) {
        if (event.which === 13) {
            event.preventDefault();
            event.stopPropagation();
            var track = Meteor.tracker.analyzeTrack($("#newTrack").val());
            if (track.failure) {
                console.log("Input: " + track.input);
                console.log("Failure: " + JSON.stringify(track.failure));
                console.log("Recognized: " + JSON.stringify(track.recognized));
            } else {
                Meteor.call("upsert", trackData, function (error, result) {
                    if (!error) {
                        $("#newTrack").val("");
                    }
                });
            }
        }
    }
};

Template.createTrack.rendered = function () {
    $("#newTrack").autosize();
}