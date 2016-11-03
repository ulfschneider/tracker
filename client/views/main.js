import {Template} from 'meteor/templating';

import './main.html';

Template.tracks.helpers({
    tracks: function () {
        return [{formattedTrack: "Hello"}, {formattedTrack: "World"}];
    }
});


