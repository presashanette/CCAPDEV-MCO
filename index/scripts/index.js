const express = require('express');
const multer = require('multer');
const app = express();
const path = require('path');
const hbs = require("hbs");
const { Post, User, Comment } = require('./mongodb');
const session = require('express-session');
const bcrypt = require('bcrypt');
const templatePath = path.join(__dirname, "../templates");
app.use(express.json());
app.set("view engine", "hbs");
app.set("views", templatePath);
app.use(express.urlencoded({extended:false}));
app.use(express.static(path.join(__dirname, "../public")));
app.use(express.static(path.join(__dirname, "../images")));

app.use(
    session({
      secret: 'secret-key',
      cookie: {
        sameSite: 'strict'
      }
    })
);

app.get("/", (req,res) => {
    res.render("index");
});

app.get("/index", (req,res) => {
    res.render("index");
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

        // Reverse the order of posts and comments
        const reversedPosts = posts.reverse();
        const reversedComments = comments.reverse();

        const isEmpty = reversedPosts.length === 0;

        const userDetails = {
            user,
            posts: reversedPosts,
            comments: reversedComments,
            isEmpty 
        };

        res.render("viewprofile", userDetails);

    } catch (error) {
        console.error("Error fetching user profile:", error);
        res.render("homepage", { showError3: true });
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



app.get("/viewone/:postId", async (req, res) => {
    try {
        const postId = req.params.postId;

        // Fetch the post including author details and explicitly populate author fields
        const post = await Post.findById(postId)
            .populate({
                path: 'author',
                select: 'username profPicLink' // Select only necessary fields
            })
            .exec();

        // Fetch the comments for the post
        const comments = await Comment.find({ post: postId })
            .populate('author')
            .exec();

        if (!post) {
            return res.status(404).send("Post not found");
        }

        res.render("viewone", { post, comments });
    } catch (error) {
        console.error("Error fetching data:", error);
        res.status(500).send("An error occurred fetching post details.");
    }
});



// Like (Upvote) a post
app.post('/upvotePost/:postId', async (req, res) => {
    try {
        const postId = req.params.postId;
        const post = await Post.findById(postId).exec();

        if (!post) {
            return res.status(404).send('Post not found');
        }

        // Increment upvotes
        post.upvotes += 1;
        await post.save();

        // Redirect to viewone page after upvoting
        res.redirect(`/viewone/${postId}`);
    } catch (error) {
        console.error('Error upvoting post:', error);
        res.status(500).send('Error upvoting post.');
    }
});



// Downvote a post
app.post('/downvotePost/:postId', async (req, res) => {
    try {
        const postId = req.params.postId;
        const post = await Post.findById(postId).exec();

        if (!post) {
            return res.status(404).send('Post not found');
        }

        // Increment downvotes
        post.downvotes += 1;
        await post.save();

        res.redirect(`/viewone/${postId}`);
    } catch (error) {
        console.error('Error downvoting post:', error);
        res.status(500).send('Error downvoting post.');
    }
});


// Update the indexloggedin route handler
app.get("/indexloggedin", async (req, res) => {
    try {
        if (!req.session.authorized || !req.session.user) {
            return res.render("login", { showError1: true });
        }

        let posts;

        if (req.session.authorized) {
            posts = await Post.find().populate('author').exec(); // Populate the author field
        } else {
            posts = await Post.find().limit(25).populate('author').exec(); // Limit and populate author field
        }

        // Calculate counts for each post
        const mappedPosts = posts.map(post => ({
            username: post.author.username,
            profileImage: post.author.profileImage,
            title: post.title,
            content: post.content,
            tags: post.tags,
            _id: post._id,
            upvotes: post.upvotes.length, // Get upvotes count
            downvotes: post.downvotes.length, // Get downvotes count
            commentsCount: post.comments.length // Get comments count
        }));

        res.render("homepage", { posts: mappedPosts });

    } catch (error) {
        console.error("Error fetching data:", error);
        res.render("homepage", { showError2: true, errorMessage: 'An error occurred fetching posts.' });
    }
});

// Delete post
app.post('/deletePost/:postId', async (req, res) => {
    try {
        const postId = req.params.postId;
        await Post.findByIdAndDelete(postId);

        // Redirect with success message
        req.session.successMessage = 'Post deleted successfully!';
        res.redirect('/homepage'); // Redirect to the home page or any other desired page
    } catch (error) {
        console.error('Error deleting post:', error);
        res.status(500).send('Error deleting post.');
    }
});

// Add a comment to a post
app.post('/addComment/:postId', async (req, res) => {
    try {
        const postId = req.params.postId;
        const { content } = req.body;
        const newComment = new Comment({
            content,
            post: postId
        });
        await newComment.save();

        const post = await Post.findById(postId).exec();
        post.comments.push(newComment);
        await post.save();

        // Increment comments count in the post
        post.commentsCount += 1;
        await post.save();

        res.redirect(`/viewone/${postId}`);
    } catch (error) {
        console.error('Error adding comment:', error);
        res.status(500).send('Error adding comment.');
    }
});


// Route for fetching homepage with all posts
app.get('/homepage', async (req, res) => {
    try {
        // Fetch all posts from the database
        const allPosts = await Post.find().populate('author').exec();

        // Render the homepage with posts data
        res.render('homepage', { posts: allPosts });
    } catch (error) {
        console.error('Error fetching homepage posts:', error);
        res.status(500).send('Error fetching homepage posts.');
    }
});


        

app.post("/signup", async(req, res) => {
    const checksu = await User.findOne({uname: req.body.uname});

    if (checksu && checksu.uname === req.body.uname){
        const showError1 = true;
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

 // Import your User model

app.post("/login", async (req, res) => {
    try {
        const { uname, psw } = req.body;
        const user = await User.findOne({ uname });

        if (!user) {
            const showError2 = true;
            return res.render("login", { showError2 });
        }

        const isPassMatch = await bcrypt.compare(psw, user.psw);

        if (isPassMatch) {
            req.session.user = user;
            req.session.authorized = true;
            return res.redirect("/homepage");
        } else {
            const showError1 = true;
            return res.render("login", { showError1 });
        }
    } catch (error) {
        console.error("Error during login:", error);
        const showError2 = true;
        return res.render("login", { showError2 });
    }
});

// POST route to handle creating a new post
app.post("/createPost", async (req, res) => {
    if (!req.session.authorized) {
        return res.render("login", { showError1: true });
    }

    try {
        const { title, contentHTML, tags } = req.body;
        const tagList = tags.split(',').map(tag => tag.trim()); // Split tags by comma and trim whitespace

        const newPost = new Post({
            title, // Ensure that title is accessed correctly from req.body
            content: contentHTML,
            tags: tagList,
            author: req.session.user._id 
        });

        // Save the new post to the database
        await newPost.save();
        
        // Redirect to an appropriate page after successful creation
        res.redirect('/homepage');
         
    } catch (error) {
        console.error('Error creating post:', error);
        res.status(500).send('Error creating post.');
    }
});




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
        if (bioUpdate && bioUpdate.trim() !== '') {
            updateData.bio = bioUpdate;
        }
        if (req.file) {
            const uploadedFile = req.file;
            const profilePicLink = `/picUploads/${uploadedFile.filename}`;
            updateData.profPicLink = profilePicLink;
        }

        if (Object.keys(updateData).length > 0) {
            await User.findByIdAndUpdate(userId, updateData);
        }

        const baseUrl = req.protocol + '://' + req.get('host');
        const redirectUrl = `${baseUrl}/viewprofile`;
        res.redirect(redirectUrl);
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).send('Error updating profile.');
    }
});

app.get('/globalSearch', async (req, res) => {
    const { query } = req.query;
    try {
        // Search based on title, content, and tags
        const posts = await Post.find({
            $or: [
                { title: { $regex: query, $options: 'i' } },
                { content: { $regex: query, $options: 'i' } },
                { tags: { $regex: query, $options: 'i' } } // Search in tags field
            ]
        }).populate('author');
        res.render('searchloggedins', { posts, query });
    } catch (error) {
        console.error('Error searching posts:', error);
        res.status(500).send('Error searching posts.');
    }
});


// Route for fetching recent posts
app.get('/recent', async (req, res) => {
    try {
        // Fetch recent posts from the database, limit as needed and reverse the order
        const recentPosts = await Post.find()
            .sort({ createdAt: -1 }) // Sort by createdAt in descending order (latest first)
            .limit(10) // Limit the number of posts
            .populate('author')
            .exec();

        // Reverse the order of recentPosts
        const reversedPosts = recentPosts.reverse();

        res.render('recentloggedin', { posts: reversedPosts });
    } catch (error) {
        console.error('Error fetching recent posts:', error);
        res.status(500).send('Error fetching recent posts.');
    }
});


// Route for fetching popular posts based on upvotes count
app.get('/popular', async (req, res) => {
    try {
        // Fetch popular posts from the database, sorted by upvotes count in descending order
        const popularPosts = await Post.find()
            .sort({ upvotes: -1 }) // Sort by upvotes count in descending order
            .limit(10)
            .populate('author')
            .exec();

        res.render('popularloggedin', { posts: popularPosts });
    } catch (error) {
        console.error('Error fetching popular posts:', error);
        res.status(500).send('Error fetching popular posts.');
    }
});



function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) return next();
    res.redirect("/login");
}

app.get("/createpost",  (req, res) => {
    res.render("createpost");
});

app.get("/comment",  (req, res) => {
    res.render("comment");
});

// GET route to render the edit page
app.get("/edit/:postId", async (req, res) => {
    try {
        const postId = req.params.postId;
        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).send("Post not found");
        }
        res.render("edit", { post });
    } catch (error) {
        console.error("Error fetching post for edit:", error);
        res.status(500).send("Error fetching post for edit.");
    }
});

// POST route to handle updating the post
app.post("/edit/:postId", async (req, res) => {
    try {
        const postId = req.params.postId;
        const { title, content, tags } = req.body;

        // Process tags string into an array
        const tagList = tags.split(',').map(tag => tag.trim());

        // Update the post in your database using postId and updated data
        await Post.findByIdAndUpdate(postId, {
            title,
            content,
            tags: tagList
        });

        // Redirect to homepage with success message
        req.session.successMessage = 'Changes saved successfully!';
        res.redirect("/homepage");
    } catch (error) {
        console.error('Error updating post:', error);
        req.session.errorMessage = 'Error updating post.';
        res.redirect("/edit/" + postId); // Redirect back to edit page with error message
    }
});




app.get("/viewone",  (req, res) => {
    res.render("viewone");
});
app.get("/homepage",  (req, res) => {
    res.render("homepage");
});

app.listen(3000, () => {
    console.log("port connected");
});