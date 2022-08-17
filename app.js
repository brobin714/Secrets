//jshint esversion:6
const express = require("express");
const ejs = require("ejs");
const _ = require("lodash");
const https = require('https');
require('dotenv').config()
const encrypt = require('mongoose-encryption');

console.log(process.env.SECRET);

const app = express();
const port = 3000;

const mongoose = require('mongoose');

main().catch(err => console.log(err));

async function main() {
    const url = "mongodb://127.0.0.1:27017/userDB"
    await mongoose.connect(url);
}

const { Schema } = mongoose;

const userSchema = new Schema ({
    email: String,
    password: String
})

const secret = process.env.SECRET
userSchema.plugin(encrypt, { secret: secret, encryptedFields: ['password']  })

const User = new mongoose.model("User", userSchema)


app.set('view engine', 'ejs');
app.use(express.urlencoded({
    extended: true
}));
app.use(express.static("public"));

app.route('/secrets')
    .get((req, res) => {
        res.render("secrets")
    })

app.route("/home")
    .get((req, res) => {
        res.render("home")
    })

app.route("/login")
    .get((req, res) => {
        res.render("login")
    })

    .post((req, res) => {
        const username = req.body.username
        const password = req.body.password

        User.findOne({
            email: username
        }, (err, foundUser) => {
            if (err) {
                console.log(err);
            } else {
                if (foundUser) {
                    if (foundUser.password === password) {
                        res.render("secrets")
                    }
                }
            }
        })
    })

app.route("/register")
    .get((req, res) => {
        res.render("register")
    })

    .post((req, res) => {
        const newUser = new User({
            email: req.body.username,
            password: req.body.password
        })
        newUser.save((err) => {
            if (err) {
                console.log(err);
            } else {
                res.render("secrets")
            }
        })
    })

app.route("/submit")
    .get((req, res) => {
        res.render("submit")
    })

    .post((req, res) => {

    })






app.listen(process.env.PORT || port, () => {
    console.log(`The server launched in http://localhost:${port}`);
});
