Template.track.helpers({
   time: function() {
        return moment(new Date()).format("HH:mm");
   },
    workout: function() {
        return "6pyra";
    },
    results: function() {
        return "18m30s";
    },
    comment: function() {
        return "PB";
    }
});