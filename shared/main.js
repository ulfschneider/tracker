TrackSchema = new SimpleSchema({
    date: {type: Date},
    workout: {type: String},
    results: {type: [String], optional: true},
    comment: {type: String, optional: true},
    username: {type: String},
    userId: {type: String}
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
        return TrackData.find({userId: this.userId});
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
        }
    });
}