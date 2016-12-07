

Template.home.helpers({
    watchMode: function() {
         return Meteor.watch.isWatchMode();
    }
});

Template.home.onRendered(function () {
    $(document).keydown(function (event) {
        if (Meteor.watch.isWatchMode()) {
            if (event.which == 32) {
                //start - stop
                event.preventDefault();
                event.stopPropagation();

                Meteor.watch.toggle();
            } else if (event.which == 13) {
                //return
                if (Meteor.watch.isStopped()) {
                    event.preventDefault();
                    event.stopPropagation();
                    Meteor.watch.setTime();
                }
            } else if (event.which == 27) {
                //clear
                if (Meteor.watch.isStopped()) {
                    event.preventDefault();
                    event.stopPropagation();
                    Meteor.watch.clear();
                }
            }
        }
    });
})