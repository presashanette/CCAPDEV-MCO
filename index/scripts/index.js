const express = require('express');
const multer = require('multer');
const app = express();
const path = require('path');
const hbs = require("hbs");
const { Post, User, Comment } = require('./mongodb');

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
    res.render("index");
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

app.get("/viewprofile", async (req, res) => {
    try {
        const user = await User.findOne({ _id: req.session.user._id }).exec();
        const posts = await Post.find({ 'author': user._id }).populate('comments').populate('author').exec();
        const comments = await Comment.find({ 'author': user._id }).populate('replies').populate('author').exec();

        const isEmpty = posts.length === 0;

        const userDetails = {
            user,
            posts,
            comments,
            isEmpty 
        };

        res.render("viewprofile", userDetails);

    } catch (error) {
        console.error("Error fetching user profile:", error);
        res.render("indexloggedin", { showError3: true });
    }
});

app.get("/editprofile", async (req, res) => {
    if (!req.session.authorized || !req.session.user) {
        return res.render("login", { showError1: true });
    }

    try {
        const user = await User.findOne({ _id: req.session.user._id }).exec();
        
        res.render("editprofile", user);

    } catch (error) {
        console.error("Error fetching user profile:", error);
        res.render("login", { showError2: true, errorMessage: 'An error occurred fetching user profile.' });
    }
});

app.post("/signup", async(req, res) => {
    const checksu = await User.findOne({uname: req.body.uname});

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
        await User.insertMany([data]);
        
        const signedup = await User.findOne({uname: req.body.uname});

        req.session.user = signedup;
        req.session.authorized = true;
        res.render("indexloggedin");
    }

})

app.post("/login", async(req, res) => {
    try {
        const check = await User.findOne({uname: req.body.uname});
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

/*app.post("/viewprofile", async (req, res) => {
    if (!req.session.authorized) {
        // If not authorized, redirect to login
        return res.render("login", { showError1: true });
    }

    try {
        const user = await User.findOne({ uname: req.body.uname }).exec();
        const posts = await Post.find({ 'author': user._id }).populate('comments').populate('author').exec();
        const comments = await Comment.find({ 'author': user._id }).populate('replies').populate('author').exec();
        
        const userDetails = {
            user,
            posts,
            comments,
        }

        // Set the session user details
        req.session.user = userDetails; // Consider what specific details need to be stored in session

        // Render the profile view with user details
        res.render("viewprofile", { user: req.session.user });

    } catch (error) {
        console.error("Error fetching user profile:", error);
        res.render("login", { showError2: true });
    }
});
*/

const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, 'public/picUploads'); 
    },
    filename: function(req, file, cb) {
        cb(null, file.fieldname + '-' + req.session.user._id + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage }).single('profPic');


app.post('/updateProfile', upload, async (req, res) => {
    try {
        const userId = req.session.user._id;
        const bioUpdate = req.body.bio;
        let updateData = {};

        // check if a new bio was provided
        if (bioUpdate && bioUpdate.trim() !== '') {
            updateData.bio = bioUpdate;
        }

        // check if a new profile picture was uploaded
        if (req.file) {
            const uploadedFile = req.file;
            
            const profilePicLink = `/picUploads/${uploadedFile.filename}`;
            updateData.profPicLink = profilePicLink;
        }

        if (Object.keys(updateData).length > 0) {
            await User.findByIdAndUpdate(userId, updateData);
        }

        res.redirect('/viewprofile');
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).send('Error updating profile.');
    }
});


function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) return next();
    res.redirect("/login");
}

app.listen(3000, () => {
    console.log("port connected");
});