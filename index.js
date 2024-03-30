const express = require('express');
const multer = require('multer');
const app = express();
const path = require('path');
const hbs = require("hbs");
const { Post, User, Comment } = require('./models/mongodb');
const session = require('express-session');
const bcrypt = require('bcrypt');
const templatePath = path.join(__dirname, "./templates");

app.use(express.json());
app.use(express.urlencoded({extended:false}));
app.use(express.static(path.join(__dirname, "./public")));
app.use(express.static(path.join(__dirname, "./images")));
hbs.registerPartials(path.join(__dirname, 'templates', 'partials'));


app.set("view engine", "hbs");
app.set("views", templatePath);


app.use(
    session({
      secret: 'secret-key',
      resave: false,
        saveUninitialized: false,
      cookie: {
        sameSite: 'strict'
      }
    })
);

app.get("/login", (req,res) => {
    res.render("login");
});

app.get("/signup", (req,res) => {
    res.render("signup");
})

app.get("/secret", isLoggedIn, function (req, res) {
    res.render("secret");
})

app.get('/', async (req, res) => {
    res.redirect('/homepage');
});


// Route for fetching homepage with all posts
app.get('/homepage', async (req, res) => {
    try {
        const allPosts = await Post.find()
        .populate('author')
        .populate({
            path: 'comments',
            populate: {
                path: 'replies'
            }
        })
        .exec();

        const pageTitle = 'All Posts';
        
        
        let totalComments = 0;

        allPosts.forEach(post => {
        
            if (post.comments) {
                console.log("comment amount" + post.comments.length);
                totalComments = post.comments ? post.comments.length : 0;
        
                post.comments.forEach(comment => {
                    totalComments += countReplies(comment); // Call the recursive function for each comment
                });
            }
        
            post.totalComments = totalComments;
            console.log(post.totalComments);
        });
        
        if (!req.session.authorized || !req.session.user) {
            return res.render('homepage', { posts: allPosts.reverse(), pageTitle });
        } else {
            const userId = req.session.user._id;

            const upvotedPosts = await Post.find({ upvotedBy: userId }).exec();
            const downvotedPosts = await Post.find({ downvotedBy: userId }).exec();

            allPosts.forEach(post => {
                post.isUpvoted = upvotedPosts.some(upvotedPost => upvotedPost._id.equals(post._id));
                post.isDownvoted = downvotedPosts.some(downvotedPost => downvotedPost._id.equals(post._id));
            });

            return res.render('indexloggedin', { posts: allPosts.reverse(), pageTitle });
        }
    } catch (error) {
        console.error('Error fetching homepage posts.', error);
        res.status(500).send('Error fetching homepage posts.');
    }
});

app.get("/viewone/:postId", async (req, res) => {
    try {
        if(!req.session.authorized){
            return res.redirect('/login');
        }
        
        const postId = req.params.postId;
        const userId = req.session.user._id;

        const foundPosts = await Post.find({ _id: postId, upvotedBy: userId }).exec();
        const foundPostsdown = await Post.find({ _id: postId, downvotedBy: userId }).exec();
        let addClassHeart;
        let addClassBheart;
        if (foundPosts.length > 0) {
            addClassHeart = true;
        }
        else {
            addClassHeart = false;
        }

        if (foundPostsdown.length > 0) {
            addClassBheart = true;
        }
        else {
            addClassBheart = false;
        }

        // Fetch the post including author details and explicitly populate author fields
        const post = await Post.findById(postId)
            .populate({
                path: 'author',
                select: 'uname profPicLink' // Select only necessary fields
            })
            .exec();

        // Fetch the comments for the post
        const comments = await Comment.find({ parentComment: null, post: postId })
        .populate({
            path: 'author',
            select: 'uname profPicLink' // Specify fields to populate for the author
        })
        .populate({
            path: 'replies',
            populate: {
                path: 'author',
                select: 'uname profPicLink' // Specify fields to populate for the reply author
            }
        })
            .exec();

            let totalComments = 0;
            if (comments) {
                console.log("comment amount" + comments.length);
                totalComments = comments ? comments.length : 0;
            
                comments.forEach(comment => {
                    totalComments += countReplies(comment);
                });
            }
            

            post.totalComments = totalComments;
            console.log(post.totalComments);


        if (!post) {
            return res.status(404).send("Post not found");
        }

        if (!req.session.authorized || !req.session.user) {
            return res.render("viewone", { post, comments });
        }
        else{
            const userId = req.session.user._id;
            return res.render("viewoneloggedin", { addClassHeart, addClassBheart, post, comments, userId });
        }

        
    } catch (error) {
        console.error("Error fetching data:", error);
        res.status(500).send("An error occurred fetching post details.");
    }
});

app.get("/editpost/:postId", async (req, res) => {
    if (!req.session.authorized || !req.session.user) {
        return res.render('login');
    }
    const postId = req.params.postId;
    const userId = req.session.user._id;
    try {
        const post = await Post.findById(postId)
            .populate({
                path: 'author',
                select: 'uname profPicLink' 
            })
            .exec();
        
        if (!post.author || !post.author._id.equals(userId)) {
            return res.redirect(`/viewone/${postId}?error=Unauthorized: You cannot edit this post.`);
            
        }
        
        res.render("editpost", {post});

    } catch (error) {
        console.error("Error editing post:", error);
        res.render("homepage", { showError2: true, errorMessage: 'An error occurred editing post.' });
    }
});

app.post('/updatePost', async (req, res) => {
    const { postId, title, content, tags } = req.body;

    try {        
        await Post.findByIdAndUpdate(postId, {
            title: title,
            content: content,
            tags: tags.split(',').map(tag => tag.trim()), 
        });
      
        res.redirect(`/viewone/${postId}`);
    } catch (error) {
        console.error('Failed to update post:', error);
        res.status(500).send('Error updating post.');
    }
});

app.post('/deletePost/:postId', async (req, res) => {
    if (!req.session.authorized || !req.session.user) {
        return res.status(401).render('login');
    }

    const postId = req.params.postId;
    const userId = req.session.user._id;

    try {
        const post = await Post.findById(postId).populate('author');
        if (!post) {
            return res.status(404).send('Post not found');
        }

        if (!post.author || !post.author._id.equals(userId)) {
            return res.redirect(`/viewone/${postId}?error=Unauthorized: You cannot delete this post.`);   
        }
        else {
            await Post.findByIdAndDelete(postId);
            res.redirect('/homepage');
        }

        
    } catch (error) {
        console.error('Error deleting post:', error);
        res.status(500).send('An error occurred while deleting the post.');
    }
});

app.get('/logout', async (req, res) => {

    try {
        req.session.destroy();
        res.redirect('/homepage');
    } catch (error) {
        console.error('Error destroying session:', err);
        res.status(500).send('Error destroying session.');
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
        res.redirect("/editprofile");
    }

})

app.post("/login", async (req, res) => {
    let showError1 = false;
    let showError2 = false;
    try {
        const { uname, psw } = req.body;
        const user = await User.findOne({ uname });

        if (!user) {
            showError2 = true;
            return res.render("login", { showError2 });
        }

        const isPassMatch = await bcrypt.compare(psw, user.psw);

        if (isPassMatch) {
            req.session.user = user;
            req.session.authorized = true;
            return res.redirect("/homepage");
        } else {
            showError1 = true;
            return res.render("login", { showError1 });
        }
    } catch (error) {
        console.error("Error during login:", error);
        showError2 = true;
        return res.render("login", { showError2 });
    }
});

app.get("/createpost",  (req, res) => {
    if(!req.session.authorized){
        return res.render('login');
    }
    
    res.render("createpost");
});

// POST route to handle creating a new post
app.post("/createpost", async (req, res) => {
    
    try {
        let showError1 = false;
        let showValid = false;

        const { title, contentHTML, tags } = req.body;

        const tagList = tags.split(',').map(tag => tag.trim()); // Split tags by comma and trim whitespace


        const newPost = new Post({
            title, // Ensure that title is accessed correctly from req.body
            content: contentHTML,
            tags: tagList,
            author: req.session.user._id 
        });

        if (!title || !contentHTML) {
            showError1 = true;
            return res.render("createpost", { showError1 });
        }
        else {
            showValid = true;
            res.render("createpost", { showValid });
        }

        // Save the new post to the database
        await newPost.save();
                    
        const postId = newPost._id;

        // Redirect to an appropriate page after successful creation
        res.redirect(`/viewone/${postId}`);
         
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

// Add a comment to a post
app.post('/addComment/:postId', async (req, res) => {
    try {
        if (!req.session.authorized || !req.session.user) {
            return res.redirect("/login");
        }
        else{
            const postId = req.params.postId;
            const { content } = req.body;
            const newComment = new Comment({
                author: req.session.user._id ,
                content,
                post: postId
            });
            await newComment.save();

            const post = await Post.findById(postId).exec();
            post.comments.push(newComment);
            await newComment.save();

            // Increment comments count in the post
            post.commentsCount += 1;
            await post.save();

            res.redirect(`/viewone/${postId}`);
        }
    } catch (error) {
        console.error('Error adding comment:', error);
        res.status(500).send('Error adding comment.');
    }
});

// Route to update a comment
app.put('/editComment/:postId/:commentId', async (req, res) => {
    const commentId = req.params.commentId;
    const comment = await Comment.findById(commentId);
    const userId = req.session.user._id;

    var { content } = req.body;
    content = content.trim();

    try {
        if (!comment.author._id.equals(userId)) {
            return res.status(403).json({ success: false, message: "Unauthorized: You cannot edit this comment." });
        }
        else{
            const updatedComment = await Comment.findByIdAndUpdate(req.params.commentId, { content, isEdited: true }, { new: true });
            res.json(updatedComment);
        }
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Route to delete a comment
app.delete("/deleteComment/:postId/:commentId", async function (req, res) {

    const commentId = req.params.commentId;
    const comment = await Comment.findById(commentId);
    const userId = req.session.user._id;

    try {
      const post = await Post.findByIdAndUpdate(
        req.params.postId,
        {
          $pull: { comments: req.params.commentId },
        },
        { new: true }
      );

        if (!comment.author._id.equals(userId)) {
            return res.status(403).json({ success: false, message: "Unauthorized: You cannot delete this comment." }); 
        }
        else{
            await deleteCommentAndReplies(commentId);
            res.send("success.");
        }
  
      
    } catch (err) {
      console.log(err);
      res.status(500).send("Something went wrong");
    }
  });

app.post('/reply/comment/:postId/:parentCommentId', async (req, res) => {
    try {
        // Extract postId and parentCommentId from req.params
        const { postId, parentCommentId } = req.params;

        // Extract replyContent from request body
        const { content: replyContent } = req.body;

        // Now, create a new comment for the reply
        const reply = await new Comment({
            author: req.session.user._id,
            content: replyContent,
            post: postId,
            parentComment: parentCommentId
        }).save();

        console.log(reply);

        const result = await Comment.findOneAndUpdate({_id:parentCommentId},{$push:{replies:reply._id}});

        console.log('Update result:', result);
        
        // Send a success response
        res.redirect(`/viewone/${postId}`);

    } catch (error) {
        // Handle any errors that occur during the process
        console.error('Error submitting reply:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

const upload = multer({ storage: storage }).single('profPic');

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

        if (!req.session.authorized || !req.session.user) 
            res.redirect('/login');
        else{
            // Search based on title, content, and tags
        const posts = await Post.find({
            $or: [
                { title: { $regex: query, $options: 'i' } },
                { content: { $regex: query, $options: 'i' } },
                { tags: { $regex: query, $options: 'i' } } // Search in tags field
            ]
        }).populate('author');

        let totalComments = 0;

        posts.forEach(post => {
        
            if (post.comments) {
                console.log("comment amount" + post.comments.length);
                totalComments = post.comments ? post.comments.length : 0;
        
                post.comments.forEach(comment => {
                    totalComments += countReplies(comment); // Call the recursive function for each comment
                });
            }
        
            post.totalComments = totalComments;
            console.log(post.totalComments);
        });
        
        

            const userId = req.session.user._id;

            const upvotedPosts = await Post.find({ upvotedBy: userId }).exec();
            const downvotedPosts = await Post.find({ downvotedBy: userId }).exec();

            posts.forEach(post => {
                post.isUpvoted = upvotedPosts.some(upvotedPost => upvotedPost._id.equals(post._id));
                post.isDownvoted = downvotedPosts.some(downvotedPost => downvotedPost._id.equals(post._id));
            });


        res.render('search', { posts, query });
        }   
        

    } catch (error) {
        console.error('Error searching posts:', error);
        res.status(500).send('Error searching posts.');
    }
});


// Route for fetching recent posts
app.get('/recent', async (req, res) => {
    try {
        const allPosts = await Post.find()
        .populate('author')
        .populate({
            path: 'comments',
            populate: {
                path: 'replies'
            }
        })
        .exec();

        const pageTitle = 'Recent Posts';
        
        
        let totalComments = 0;

        allPosts.forEach(post => {
        
            if (post.comments) {
                console.log("comment amount" + post.comments.length);
                totalComments = post.comments ? post.comments.length : 0;
        
                post.comments.forEach(comment => {
                    totalComments += countReplies(comment); // Call the recursive function for each comment
                });
            }
        
            post.totalComments = totalComments;
            console.log(post.totalComments);
        });
        
        if (!req.session.authorized || !req.session.user) {
            return res.render('homepage', { posts: allPosts.reverse(), pageTitle });
        } else {
            const userId = req.session.user._id;

            const upvotedPosts = await Post.find({ upvotedBy: userId }).exec();
            const downvotedPosts = await Post.find({ downvotedBy: userId }).exec();

            allPosts.forEach(post => {
                post.isUpvoted = upvotedPosts.some(upvotedPost => upvotedPost._id.equals(post._id));
                post.isDownvoted = downvotedPosts.some(downvotedPost => downvotedPost._id.equals(post._id));
            });

            return res.render('indexloggedin', { posts: allPosts.reverse(), pageTitle });
        }
    } catch (error) {
        console.error('Error fetching recent posts.', error);
        res.status(500).send('Error fetching recent posts.');
    }
});

// Route for fetching popular posts based on upvotes count
app.get('/popular', async (req, res) => {
    try {
        // Fetch popular posts from the database, sorted by upvotes count in descending order
        const popularPosts = await Post.find()
            .sort({ upvotes: -1 }) // Sort by upvotes count in descending order
            .populate('author')
            .exec();

            const pageTitle = 'Popular Posts';

            let totalComments = 0;

            popularPosts.forEach(post => {
            
                if (post.comments) {
                    console.log("comment amount" + post.comments.length);
                    totalComments = post.comments ? post.comments.length : 0;
            
                    post.comments.forEach(comment => {
                        totalComments += countReplies(comment); // Call the recursive function for each comment
                    });
                }
            
                post.totalComments = totalComments;
                console.log(post.totalComments);
            });
            
            if (!req.session.authorized || !req.session.user) {
                return res.render('homepage', { posts: popularPosts, pageTitle });
            } else {
                const userId = req.session.user._id;
    
                const upvotedPosts = await Post.find({ upvotedBy: userId }).exec();
                const downvotedPosts = await Post.find({ downvotedBy: userId }).exec();
    
                popularPosts.forEach(post => {
                    post.isUpvoted = upvotedPosts.some(upvotedPost => upvotedPost._id.equals(post._id));
                    post.isDownvoted = downvotedPosts.some(downvotedPost => downvotedPost._id.equals(post._id));
                });
    
                return res.render('indexloggedin', { posts: popularPosts, pageTitle });
            }
    } catch (error) {
        console.error('Error fetching popular posts:', error);
        res.status(500).send('Error fetching popular posts.');
    }
});

// Recursive function to count replies including replies to replies
function countReplies(comment) {
    let count = 0;
    if (comment.replies) {
        count += comment.replies.length;
        comment.replies.forEach(reply => {
            count += countReplies(reply); // Recursive call to count replies of replies
        });
    }
    return count;
}

async function deleteCommentAndReplies(commentId) {
    // Find the comment
    const comment = await Comment.findById(commentId);

    // If the comment doesn't exist, return
    if (!comment) {
        return;
    }

    // Recursively delete replies
    for (const replyId of comment.replies) {
        await deleteCommentAndReplies(replyId);
        await Comment.findByIdAndDelete(replyId);
    }

    // Delete the comment
    await Comment.findByIdAndDelete(commentId);
}

function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) return next();
    res.redirect("/login");
}

app.post('/upvotePost/:postId', async(req, res) => {
    try {
        const postId = req.params.postId;
        const userId = req.session.user._id;        
        const referer = req.header('Referer');

        const postExist = await Post.findOne({_id: postId}).exec();
        const userExist = await User.findOne({_id: userId}).exec();

        if (!postExist) {
            return res.status(400).json({message: "Post not found!"});
        }

        if (!userExist) {
            return res.status(400).json({message: "User not found!"});
        }

        if (postExist.upvotedBy.includes(userId)) {
            postExist.upvotedBy.pull(userId);
            postExist.upvotes -= 1;
        }
        else {
            postExist.upvotedBy.push(userId);
            postExist.upvotes += 1;
        }

        if (postExist.downvotedBy.includes(userId)) {
            postExist.downvotedBy.pull(userId);
            postExist.downvotes -= 1;
        }

        await postExist.save();

        if (referer && referer.includes('/viewone/')) {
            // Redirect to the same post if user came from viewone/:postId
            res.redirect(referer);
        } 

        else if (referer && referer.includes('/globalSearch')) {
            // Redirect to the same post if user came from viewone/:postId
            res.redirect(referer);
        } 
        
        else {
            // Redirect to viewall if user came from viewall or if referer is not available
            res.redirect('/homepage');
        }
        
    } catch (error) {
        res.status(500).json({error: error});
    }
});

app.post('/downvotePost/:postId', async(req, res) => {
    try {
        const postId = req.params.postId;
        const userId = req.session.user._id;        
        const referer = req.header('Referer');

        const postExist = await Post.findOne({_id: postId}).exec();
        const userExist = await User.findOne({_id: userId}).exec();

        if (!postExist) {
            return res.status(400).json({message: "Post not found!"});
        }

        if (!userExist) {
            return res.status(400).json({message: "User not found!"});
        }

        if (postExist.downvotedBy.includes(userId)) {
            postExist.downvotedBy.pull(userId);
            postExist.downvotes -= 1;
        }
        else {
            postExist.downvotedBy.push(userId);
            postExist.downvotes += 1;
        }

        if (postExist.upvotedBy.includes(userId)) {
            postExist.upvotedBy.pull(userId);
            postExist.upvotes -= 1;
        }
        
        await postExist.save();

        if (referer && referer.includes('/viewone/')) {
            // Redirect to the same post if user came from viewone/:postId
            res.redirect(referer);
        } 
        
        else if (referer && referer.includes('/globalSearch')) {
            // Redirect to the same post if user came from viewone/:postId
            res.redirect(referer);
        } 

        else {
            // Redirect to viewall if user came from viewall or if referer is not available
            res.redirect('/homepage');
        }

    } catch (error) {
        res.status(500).json({error: error});
    }
});

app.listen(3000, () => {
    console.log("port connected");
});