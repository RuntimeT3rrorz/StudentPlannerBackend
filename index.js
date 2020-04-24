require('dotenv').config()
const express = require('express')
const mongoose = require('mongoose')
const passport = require('passport');
const Strategy = require('passport-http').BasicStrategy;
const bcrypt = require('bcrypt')
const compression = require('compression');
const helmet = require('helmet');

const User = require('./models/User').user;

const app = express()
const port = 3000

mongoose.connect(`mongodb+srv://appUser:${process.env.DB_PASSWORD}@studentplannercluster-ykqqe.mongodb.net/test?retryWrites=true&w=majority`, {useNewUrlParser: true, useUnifiedTopology: true});
console.log(process.env.DB_PASSWORD);
// Compares password to its hash
passport.use(new Strategy(
    function(username, password, cb) {
        User.findOne({ username: username }, (err, user) => {
            if (err) { return cb(err); }
            if (!user) { return cb(null, false); }
            bcrypt.compare(password, user.password, (err, res) => {
                if (err) { return cb(err) }
                if (res) { return cb(null, user) } else { return cb(null, false) }
            })
        })
    }
));

passport.serializeUser(function(user, cb) {
    cb(null, user._id);
});

passport.deserializeUser(function(id, cb) {
    User.findOne({ _id: id }, function (err, user) {
        if (err) { return cb(err); }
        cb(null, user);
    });
});

function makeUser() {
    bcrypt.hash("test", 10, (err, res) => {
        if (err) { throw err}
        let user = new User({
            username: "Jw2476",
            password: res
        })
        user.save()
        console.log("User created!!!")
    })
}

// Setup Middlewares
app.use(require('body-parser').urlencoded({ extended: true }));
app.use(require('body-parser').json());
app.use(require('express-session')({ secret: process.env.DB_PASSWORD, resave: false, saveUninitialized: false }));
app.use(helmet());
app.use(compression());

// Initialize Passport and restore authentication state, if any, from the
// session.
app.use(passport.initialize());
app.use(passport.session());

app.get('/login',
    passport.authenticate('basic'),
    (req, res) => res.send("You have logged in!"))

app.post('/signup', (req, res) => {
    bcrypt.hash(req.body.password, 10, (err, result) => {
        if (err) { throw err}

        User.findOne({ username: req.body.username }, (err, existing_user) => {
            if (existing_user) {
                res.send("User already exists!")
                return null
            }

            let user = new User({
                username: req.body.username,
                password: result
            })
            user.save()
            res.send("User created!")
        })
    })
})

app.listen(port, () => console.log(`Backend app listening at http://localhost:${port}`))