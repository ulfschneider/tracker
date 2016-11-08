TrackSchema = new SimpleSchema({
    _id: {type: String, optional:true}, //mongo id
    date: {type: Date}, //date and time of track
    track: {type: String}, //name of track
    duration: {type: Number, optional:true}, //milliseconds
    results: {type: [String], optional: true}, //further generic results
    comment: {type: String, optional: true}, //a comment
    username: {type: String}, //the name of the user
    userId: {type: String} //the meteor userId
});

TrackData = new Mongo.Collection("TrackData");
TrackData.schema = TrackSchema;

if (Meteor.isClient) {
    Accounts.ui.config({
        passwordSignupFields: "USERNAME_AND_OPTIONAL_EMAIL"
    });
}

if (Meteor.isServer) {

    Meteor.publish("TrackData", function (limit) {
        return TrackData.find({userId: this.userId}, {limit: limit, sort: {date: -1, track: 1}});
    });


    Meteor.methods({
        upsert: function (data) {
            if (!this.userId) {
                //user not authenticated
                throw new Meteor.Error('not-authenticated');
            }

            if (data) {
                data.userId = this.userId;
                data.username = Meteor.users.findOne(this.userId).username;
            }
            TrackData.schema.validate(data);
            if (data._id) {
                TrackData.update(data._id, data);
                return data._id;
            } else {
                return TrackData.insert(data);
            }
        },
        remove: function(data) {
            if (data && data._id) {
                TrackData.remove(data._id);
            }
        }
    });
}