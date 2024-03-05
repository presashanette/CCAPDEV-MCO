var express = require('express');
var router = express.Router();

/* GET home page. */
// router.get('/', function(req, res, next) {
//   res.render('index', { title: 'Express' });
// });

// const express = require('express')
// const app = express()
const path = require('path');
const hbs = require("hbs");
const collection = require('./mongodb');
const message = '<p>Message</p>';

const templatePath = path.join(__dirname, "../templates");

app.use(express.json()); //have to write this to use hbs and connect mongoDB?
app.set("view engine", "hbs");
app.set("views", templatePath);
app.use(express.urlencoded({extended:false}));
app.use(express.static(path.join(__dirname, "../public")));
app.use(express.static(path.join(__dirname, 'react-app/build')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'react-app/build/index.html'));
});


router.get("/", (req,res) => {
    res.render("login");
});

app.get("/login", (req,res) => {
    res.render("login");
});

app.get("/signup", (req,res) => {
    res.render("signup");
});



app.post("/signup", async(req, res) => {
    

    const checksu = await collection.findOne({uname: req.body.uname});

    if (checksu && checksu.uname === req.body.uname){
        res.send("Account already exists!");
    }

    else {
        const data = {
            uname: req.body.uname,
            psw: req.body.psw
        }

        await collection.insertMany([data]);

        res.render("index");
    }

})

app.post("/login", async(req, res) => {
    try {
        const check = await collection.findOne({uname: req.body.uname});

        if(check && check.psw === req.body.psw){
            res.render("index");
        }
        else {
            // res.send("wrong password")
            app.get('/pop/up', (req, res) => {
                res.status(201).json(message);
            })
        }
    }
    catch {
        res.send("wrong details");
    }

})

// app.listen(3000, () => {
//     console.log("port connected");
// })

module.exports = router;
