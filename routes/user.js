//routes/user.js


const express = require('express');
const router = express.Router();
const User = require('../models/UserModel');
const passport = require('passport');
const { trackSession } = require('../middleware');

router.use(trackSession);

router.get('/register', async (req, res) => {
    res.render('../views/user/createUser.ejs');
});

router.post('/register', async (req, res) => {
    const { username, password, confirmPassword, isMemeRecommendationEnabled } = req.body;


    if (password !== confirmPassword) {
        return res.status(400).send('Passwords do not match');
    }

    const memeRecommendationEnabled = isMemeRecommendationEnabled === 'on';

    try {
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).send('Username already exists. Please choose a different username.');
        }

        // Register new user
        const user = new User({ username, isMemeRecommendationEnabled: memeRecommendationEnabled });
        await User.register(user, password);

        passport.authenticate('local')(req, res, () => {
            res.redirect('/dashboard');
        });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).send('Username already exists. Please choose a different username.');
        }
        console.error(err);
        res.status(500).send('An error occurred while creating the user. Please try again.');
    }
});

router.get('/login', async (req, res) => {
    res.render('../views/user/login.ejs');
});

router.post('/login', passport.authenticate('local', {
    successRedirect: '/dashboard',
    failureRedirect: '/login',
    failureFlash: true
}));

router.post('/logout', (req, res) => {
    req.logout((err) => {
        if (err) {
            return next(err);
        }
        res.redirect('/login');
    });
});

module.exports = router;
