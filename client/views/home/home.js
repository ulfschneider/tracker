

Template.home.helpers({
    watchMode: function() {
         return Meteor.stopWatch.isWatchMode();
    }
});

Template.home.onRendered(function () {
    $(document).keydown(function (event) {
        if (Meteor.stopWatch.isWatchMode()) {
            if (event.which == 32) {
                //start - stop
                event.preventDefault();
                event.stopPropagation();

                Meteor.stopWatch.toggle();
            } else if (event.which == 13) {
                //return
                if (Meteor.stopWatch.isStopped()) {
                    event.preventDefault();
                    event.stopPropagation();
                    Meteor.stopWatch.setTime();
                }
            } else if (event.which == 27) {
                //clear
                if (Meteor.stopWatch.isStopped()) {
                    event.preventDefault();
                    event.stopPropagation();
                    Meteor.stopWatch.clear();
                }
            }
        }
    });
})