TrackSchema = new SimpleSchema({
    date: {type: Date}, //date and time of workout
    workout: {type: String}, //name of workout
    duration: {type: Number, optional:true}, //milliseconds
    results: {type: [String], optional: true}, //further generic results
    comment: {type: String, optional: true}, //a comment
    input: {type: String, optional: true}, //original input string
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

    Meteor.publish("TrackData", function () {
        return TrackData.find({userId: this.userId}, {sort: {date: -1}});
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
                TrackData.update(data);
            } else {
                TrackData.insert(data);
            }
        },
        remove: function(data) {
            if (data && data._id) {
                TrackData.remove(data._id);
            }
        }
    });
}