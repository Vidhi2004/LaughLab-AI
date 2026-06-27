//models/UserModel.js

const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
    },
    isMemeRecommendationEnabled: {
        type: Boolean,
        default: false,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

userSchema.plugin(passportLocalMongoose, {
    usernameField: 'username',
    passwordField: 'password',
});

userSchema.pre('save', async function (next) {
    const existingUser = await mongoose.model('User').findOne({ username: this.username });
    if (existingUser) {
        throw new Error('Username already exists');
    }
    next();
});

const User = mongoose.model('User', userSchema);
module.exports = User;
