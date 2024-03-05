const express = require('express');
const app = express();
const path = require('path');
const hbs = require("hbs");
const collection = require('./mongodb');
// const bodyParser = require('body-parser')
// const LocalStrategy = require('passport-local')
// const passport = require('passport')
// const passportLocalMongoose = require('passport-local-mongoose')
const session = require('express-session');
const bcrypt = require('bcrypt');
// const User = require("./user");
// const users = require('./routes/user');
// const login = require('./routes/login');

const templatePath = path.join(__dirname, "../templates");

// app.use(passport.initialize());
// app.use(passport.session());
app.use(express.json()); //have to write this to use hbs and connect mongoDB?
app.set("view engine", "hbs");
app.set("views", templatePath);
app.use(express.urlencoded({extended:false}));
app.use(express.static(path.join(__dirname, "../public")));
app.use(express.static(path.join(__dirname, "../images")));

// passport.use(new LocalStrategy(User.authenticate()));
// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());

app.use(
    session({
      secret: 'secret-key',
      cookie: {
        sameSite: 'strict'
      }
    //   resave: false,
    //   saveUninitialized: false,
    })
);

app.get("/", (req,res) => {
    res.render("login");
});

app.get("/index", (req,res) => {
    res.render("index");
});

app.get("/indexloggedin", (req,res) => {
    res.render("indexloggedin");
});

app.get("/login", (req,res) => {
    res.render("login");
});

app.get("/signup", (req,res) => {
    res.render("signup");
})

app.get("/secret", isLoggedIn, function (req, res) {
    res.render("secret");
})

app.post("/signup", async(req, res) => {
    

    const checksu = await collection.findOne({uname: req.body.uname});

    if (checksu && checksu.uname === req.body.uname){
        const showError1 = true; // Set to true if an error is detected
        res.render("signup", { showError1 });
    }

    else {
        const data = {
            uname: req.body.uname,
            psw: req.body.psw
        }

        //for hashing pw
        const saltRounds = 10;
        const hashedpsw = await bcrypt.hash(data.psw, saltRounds);
        data.psw = hashedpsw;
        await collection.insertMany([data]);

        res.render("indexloggedin");
    }

})

app.post("/login", async(req, res) => {
    try {
        const check = await collection.findOne({uname: req.body.uname});
        const isPassMatch = await bcrypt.compare(req.body.psw, check.psw);
        if(check && isPassMatch){
            req.session.user = check;
            req.session.authorized = true;
            res.render("indexloggedin");
        }
        else {
            if (check == null) {
                const showError2 = true; // Set to true if an error is detected
                res.render("login", { showError2 });
            }
            else {
                const showError1 = true; // Set to true if an error is detected
                res.render("login", { showError1 });
            }
        }
    }
    catch {
        const showError2 = true; // Set to true if an error is detected
        res.render("login", { showError2 });
    }

});

function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) return next();
    res.redirect("/login");
}

app.listen(3000, () => {
    console.log("port connected");
});