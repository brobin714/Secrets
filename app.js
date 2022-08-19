//jshint esversion:6
const express = require("express");
const ejs = require("ejs");
const _ = require("lodash");
const https = require('https');
require('dotenv').config()
const app = express();
const port = 3000;
const mongoose = require('mongoose');
const session = require('express-session')
const passportLocalMongoose = require('passport-local-mongoose');
const passport = require('passport');
const FacebookStrategy = require('passport-facebook');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate')

app.set('view engine', 'ejs');
app.use(express.urlencoded({
    extended: true
}));
app.use(express.static("public"));

app.use(session({
    secret: "Our little secret",
    resave: false,
    saveUninitialized: false
}))

app.use(passport.initialize())
app.use(passport.session())

main().catch(err => console.log(err));

async function main() {
    const url = "mongodb://127.0.0.1:27017/userDB"
    await mongoose.connect(url);
}
const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    googleId: String,
    facebookId: String,
    secret: String
})

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

// const secret = process.env.SECRET


const User = new mongoose.model("User", userSchema)

passport.use(User.createStrategy())
passport.serializeUser(function(user, done) {
    done(null, user);
});

passport.deserializeUser(function(user, done) {
    done(null, user);
});

passport.use(new FacebookStrategy({
        clientID: process.env.FACEBOOK_APP_ID,
        clientSecret: process.env.FACEBOOK_APP_SECRET,
        callbackURL: "http://localhost:3000/auth/facebook/secrets"
    },
    function(accessToken, refreshToken, profile, cb) {
        console.log(profile);
        User.findOrCreate({
            facebookId: profile.id
        }, function(err, user) {
            return cb(err, user);
        });
    }
));


passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "http://localhost:3000/auth/google/secrets"
    },
    function(accessToken, refreshToken, profile, cb) {
        console.log(profile);
        User.findOrCreate({
            googleId: profile.id
        }, function(err, user) {
            return cb(err, user);
        });
    }
));


app.route('/secrets')
    .get((req, res) => {
        User.find({
            "secret": {
                $ne: null
            }
        }, (err, foundUsers) => {
            if (err) {
                console.log(err);
            } else {
                if (foundUsers) {
                    res.render("secrets", {
                        usersWithSecrets: foundUsers
                    })
                }
            }
        })
    })

app.route("/logout")
    .get((req, res) => {
        req.logout(function(err) {
            if (err) {
                console.log(err);
            }
            res.redirect('/');
        });
    })

    .post()

app.route("/")
    .get((req, res) => {
        res.render("home")
    })

app.route("/auth/facebook")
    .get(passport.authenticate('facebook', {
        scope: "public_profile"
    }))

app.route("/auth/facebook/secrets")
    .get(passport.authenticate("facebook", {
        failureRedirect: "/login",
        failureMessage: true
    }), (req, res) => {
        // Successful authentication, redirect to secrets
        res.redirect("/secrets")
    })

app.route("/auth/google")
    .get(
        passport.authenticate('google', {
            scope: ['profile', "email"]
        })
    )

app.route("/auth/google/secrets")
    .get(passport.authenticate("google", {
        failureRedirect: "/login",
        failureMessage: true
    }), (req, res) => {
        // Successful authentication, redirect to secrets
        res.redirect("/secrets")
    })

app.route("/login")
    .get((req, res) => {
        res.render("login")
    })

    .post((req, res) => {
        const user = new User({
            username: req.body.username,
            password: req.body.password
        })

        req.login(user, function(err) {
            if (err) {
                console.log(err);
            } else {
                passport.authenticate("local")(req, res, function() {
                    res.redirect("/secrets")
                })
            }
        });
    })

app.route("/register")
    .get((req, res) => {
        res.render("register")
    })

    .post((req, res) => {
        User.register({
                username: req.body.username
            },
            req.body.password,
            (err, user) => {
                if (err) {
                    console.log(err);
                    res.redirect("/register")
                } else {
                    passport.authenticate("local")(req, res, function() {
                        res.redirect("/secrets")
                    })
                }
            })
    })

app.route("/submit")
    .get((req, res) => {
        if (req.isAuthenticated()) {
            res.render("submit")
        } else {
            res.redirect("/login")
        }
    })

    .post((req, res) => {
        const submittedSecret = req.body.secret

        User.findById(req.user._id, (err, foundUser) => {
            if (err) {
                console.log(err);
            } else {
                if (foundUser) {
                    foundUser.secret = submittedSecret
                    foundUser.save(() => {
                        res.redirect("/secrets")
                    })
                }
            }
        })

    })






app.listen(process.env.PORT || port, () => {
    console.log(`The server launched in http://localhost:${port}`);
});
