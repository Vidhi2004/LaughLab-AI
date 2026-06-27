module.exports = {
    isAuthenticated: (req, res, next) => {
        if (req.isAuthenticated()) {
            return next();
        }
        res.redirect('/login');
    },
    trackSession: (req, res, next) => {
        console.log(`Session ID: ${req.sessionID}`);
        console.log(`User: ${req.user ? req.user.username : 'Not logged in'}`);
        next();
    }
};
