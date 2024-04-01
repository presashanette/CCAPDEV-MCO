const express = require('express');
const multer = require('multer');
const app = express();
const path = require('path');
const hbs = require("hbs");
const { Post, User, Comment } = require('./models/mongodb');
const session = require('express-session');
const flash = require('connect-flash');
// const MongoStore = require('connect-mongo')(session);
const bcrypt = require('bcrypt');
const templatePath = path.join(__dirname, "./templates");
const { body } = require('express-validator');
const { cp } = require('fs');
const uuidv4 = require('uuid').v4;

app.use(express.json());
app.use(express.urlencoded({extended:false}));
app.use(express.static(path.join(__dirname, "./public")));
app.use(express.static(path.join(__dirname, "./images")));
hbs.registerPartials(path.join(__dirname, 'templates', 'partials'));


app.set("view engine", "hbs");
app.set("views", templatePath);


// app.use(
//     session({
//       secret: 'secret-key',
//       resave: false,
//         saveUninitialized: false,
//       cookie: {
//         sameSite: 'strict'
//       }
//     })
// );

app.use(session({
    secret: 'somegibberishsecret',
    // store: new MongoStore({ mongooseConnection: mongoose.connection }),
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false, maxAge: 1000 * 60 * 60 * 24 * 7 }
  }));
  
app.use(express.cookieParser());
app.use(express.cookieSession({
    secret: 'secret',
    cookie: {maxAge: 60 * 60 * 1000}
}));

// Flash
app.use(flash());

// Global messages vars
app.use((req, res, next) => {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  next();
});

const sessions = {};

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
    const sessionId = req.headers.cookie?.split('=')[1];
    const userSession = sessions[sessionId];
    if(userSession) {
        console.log ([{
            id:1,
            title: "hi",
            userId,
        }]);
    }
    else {
        res.redirect('/homepage');
    }
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

            return res.render('indexloggedin', { posts: allPosts.reverse(), pageTitle, userId });
        }
    } catch (error) {
        console.error('Error fetching homepage posts.', error);
        res.status(500).send('Error fetching homepage posts.');
    }
});

app.get("/viewone/:postId", async (req, res) => {
    try {
        //if user is logged out (still can view post)
        if(!req.session.authorized){
            //return res.redirect('/login');
            const postId = req.params.postId;
            const post = await Post.findById(postId)
            .populate({
                path: 'author',
                select: 'uname profPicLink' 
            })
            .exec();

            const comments = await Comment.find({ parentComment: null, post: postId })
            .populate({
                path: 'author',
                select: 'uname profPicLink' 
            })
            .populate({
                path: 'replies',
                populate: {
                    path: 'author',
                    select: 'uname profPicLink' 
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
            
            return res.render("viewone", { post, comments });
            
        }
        
        //if user is logged in
        else {
            const postId = req.params.postId;
            const userId = req.session.user._id;

            const foundPosts = await Post.find({ _id: postId, upvotedBy: userId }).exec();
            const foundPostsdown = await Post.find({ _id: postId, downvotedBy: userId }).exec();

            // like dislike for posts
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


            



            const post = await Post.findById(postId)
                .populate({
                    path: 'author',
                    select: 'uname profPicLink' 
                })
                .exec();

            const comments = await Comment.find({ parentComment: null, post: postId })
            .populate({
                path: 'author',
                select: 'uname profPicLink' 
            })
            .populate({
                path: 'replies',
                populate: {
                    path: 'author',
                    select: 'uname profPicLink' 
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

            const upvotedComments = await Comment.find({ upvotedBy: userId }).exec();
            const downvotedComments = await Comment.find({ downvotedBy: userId }).exec();


            comments.forEach(comment => {
                comment.isUpvoted = upvotedComments.some(upvotedComment => upvotedComment._id.equals(comment._id));
                comment.isDownvoted = downvotedComments.some(downvotedComment => downvotedComment._id.equals(comment._id));

                comment.replies.forEach(reply => {
                    reply.isUpvoted = upvotedComments.some(upvotedComment => upvotedComment._id.equals(reply._id));
                    reply.isDownvoted = downvotedComments.some(downvotedComment => downvotedComment._id.equals(reply._id));
                });
            });    


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
            isEdited: true,
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
    const { uname, psw } = req.body
    const checksu = await User.findOne({uname});

    let showError1 = false;
    let showError2 = false;

    if (checksu && checksu.uname === uname){
        showError1 = true;
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
        const { uname, psw, remember } = req.body;
        const user = await User.findOne({ uname });
        const userId = user._id;

        if (!user) {
            showError2 = true;
            return res.render("login", { showError2 });
        }

        const isPassMatch = await bcrypt.compare(psw, user.psw);

        if (isPassMatch) {
            req.session.user = user;
            req.session.authorized = true;

            // if (remember) {
            //     res.cookie('remember_token', userId, { maxAge: 604800000 }); // Cookie expires in 7 days (604800000 ms)
            // }
            
            // const token = jwt.sign({ userId: user._id }, process.env.SECRET_KEY, {
            //     expiresIn: '1 hour'
            //   });
            //   res.json({ token });
            
            const sessionId = uuidv4();

            sessions[sessionId] = { uname, userId};
            res.set('Set-Cookie', `session=${sessionId}`);

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

// app.use((req, res, next) => {
//     const rememberToken = req.cookies.remember_token;

//     if (rememberToken) {
//         // Authenticate the user based on the remember token
//         // For example, you can look up the user in your database
//         // and set req.user to the authenticated user
//         User.findOne({ _id: rememberToken })
//             .then(user => {
//                 if (user) {
//                     req.session.user = user; // Set req.user to the authenticated user
//                 }
//                 next();
//             })
//             .catch(err => {
//                 console.error('Error finding user:', err);
//                 next();
//             });
//     } else {
//         next();
//     }
// });

app.get("/createpost",  (req, res) => {
    if(!req.session.authorized){
        return res.render('login');
    }
    
    res.render("createpost");
});


app.post("/createpost", async (req, res) => {
    
    try {
        let showError1 = false;
        let showValid = false;

        const { title, contentHTML, tags } = req.body;

        const tagList = tags.split(',').map(tag => tag.trim());


        const newPost = new Post({
            title, 
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

        await newPost.save();
        const postId = newPost._id;
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


app.post('/addComment/:postId', async (req, res) => {
    try {
        let showError1 = false;
        
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

            post.commentsCount += 1;
            await post.save();

            res.redirect(`/viewone/${postId}`);
        }
    } catch (error) {
        console.error('Error adding comment:', error);
        res.status(500).send('Error adding comment.');
    }
});


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
        else if (!content) {
            console.log("emptyyy");
        }
        else{
            const updatedComment = await Comment.findByIdAndUpdate(req.params.commentId, { content }, { new: true });
            res.json(updatedComment);
        }
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});


app.delete("/deleteComment/:postId/:commentId", async function (req, res) {
    try {
        if (!req.session.authorized || !req.session.user) {
            return res.redirect("/login");
        }

        else{
            const commentId = req.params.commentId;
            const comment = await Comment.findById(commentId);
            const userId = req.session.user._id;

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
        }
      
    } catch (err) {
      console.log(err);
      res.status(500).send("Something went wrong");
    }
  });

app.post('/reply/comment/:postId/:parentCommentId', async (req, res) => {
    try {
        if (!req.session.authorized || !req.session.user) {
            return res.redirect("/login");
        }

        else{
            const { postId, parentCommentId } = req.params;
            const { content: replyContent } = req.body;

            const reply = await new Comment({
                author: req.session.user._id,
                content: replyContent,
                post: postId,
                parentComment: parentCommentId
            }).save();

            console.log(reply);

            const result = await Comment.findOneAndUpdate({_id:parentCommentId},{$push:{replies:reply._id}});

            console.log('Update result:', result);
            res.redirect(`/viewone/${postId}`);
        }
        
    } catch (error) {
        console.error('Error submitting reply:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.post('/upvoteComment/:commentId', async(req, res) => {
    try {
        const commentId = req.params.commentId;
        const userId = req.session.user._id;        
        const referer = req.header('Referer');

        const commentExist = await Comment.findOne({_id: commentId}).exec();
        const userExist = await User.findOne({_id: userId}).exec();

        if (!commentExist) {
            return res.status(400).json({message: "Comment not found!"});
        }

        if (!userExist) {
            return res.status(400).json({message: "User not found!"});
        }

        if (commentExist.upvotedBy.includes(userId)) {
            commentExist.upvotedBy.pull(userId);
            commentExist.upvotes -= 1;
        }
        else {
            commentExist.upvotedBy.push(userId);
            commentExist.upvotes += 1;
        }

        if (commentExist.downvotedBy.includes(userId)) {
            commentExist.downvotedBy.pull(userId);
            commentExist.downvotes -= 1;
        }

        await commentExist.save();

        if (referer && referer.includes('/viewone/')) {
            res.redirect(referer);
        } 

        else if (referer && referer.includes('/globalSearch')) {
            res.redirect(referer);
        } 

        else if (referer && referer.includes('/viewprofile')) {
            res.redirect(referer);
        } 
        
        else if (referer && referer.includes('/popular')) {
            res.redirect(referer);
        }

        else if (referer && referer.includes('/recent')) {
            res.redirect(referer);
        }

        else {
            res.redirect('/homepage');
        }
        
    } catch (error) {
        res.status(500).json({error: error});
    }
});

app.post('/downvoteComment/:commentId', async(req, res) => {
    try {
        const commentId = req.params.commentId;
        const userId = req.session.user._id;        
        const referer = req.header('Referer');

        const commentExist = await Comment.findOne({_id: commentId}).exec();
        const userExist = await User.findOne({_id: userId}).exec();

        if (!commentExist) {
            return res.status(400).json({message: "Comment not found!"});
        }

        if (!userExist) {
            return res.status(400).json({message: "User not found!"});
        }

        if (commentExist.downvotedBy.includes(userId)) {
            commentExist.downvotedBy.pull(userId);
            commentExist.downvotes -= 1;
        }
        else {
            commentExist.downvotedBy.push(userId);
            commentExist.downvotes += 1;
        }

        if (commentExist.upvotedBy.includes(userId)) {
            commentExist.upvotedBy.pull(userId);
            commentExist.upvotes -= 1;
        }
        
        await commentExist.save();

        if (referer && referer.includes('/viewone/')) {
            
            res.redirect(referer);
        } 
        
        else if (referer && referer.includes('/globalSearch')) {
           
            res.redirect(referer);
        } 

        else if (referer && referer.includes('/viewprofile')) {
            res.redirect(referer);
        } 

        else if (referer && referer.includes('/popular')) {
            res.redirect(referer);
        }

        else if (referer && referer.includes('/recent')) {
            res.redirect(referer);
        }

        else {
            res.redirect('/homepage');
        }

    } catch (error) {
        res.status(500).json({error: error});
    }
});



const upload = multer({ storage: storage }).single('profPic');

app.get("/viewprofile", async (req, res) => {
    try {
        if (!req.session.authorized) {
            return res.render("login");
        }  
        else {  
            const user = await User.findOne({ _id: req.session.user._id }).exec();
            const posts = await Post.find({ 'author': user._id }).populate('comments').populate('author').exec();
            const comments = await Comment.find({ 'author': user._id }).populate('replies').populate('author').exec();

            const reversedPosts = posts.reverse();
            const reversedComments = comments.reverse();

            const isEmpty = reversedPosts.length === 0;

            const userDetails = {
                user,
                posts: reversedPosts,
                comments: reversedComments,
                isEmpty 
            };

            res.render("viewprofileloggedin", userDetails );
        }

    } catch (error) {
        console.error("Error fetching user profile:", error);
        res.render("homepage", { showError3: true });
    }
});

app.get("/viewprofile/:profileId", async (req, res) => {
    try {
        let userId = null;
        
        if (req.session.authorized) {
            userId = req.session.user._id;
        }
        
        console.log("user: "+userId);
        const profileId = req.params.profileId;
        console.log("profile: "+profileId);
         
        const user = await User.findOne({ _id: profileId }).exec();
        console.log("user:"+ user);
        const posts = await Post.find({ 'author': profileId }).populate('comments').populate('author').exec();
        console.log("posts:"+ posts);
        const comments = await Comment.find({ 'author': profileId }).populate('replies').populate('author').exec();
        console.log("comments:"+ comments);

        const reversedPosts = posts.reverse();
        const reversedComments = comments.reverse();

        const isEmpty = reversedPosts.length === 0;

        const userDetails = {
            user,
            posts: reversedPosts,
            comments: reversedComments,
            isEmpty,
            userId,
            profileId 
        };
        //console.log("user details:"+ userDetails);

        //Determine if the logged-in user is viewing their own profile
        // const isOwnProfile = userId === loggedInUserId;
        // console.log(isOwnProfile);
        if (req.session.authorized) {
            res.render("viewprofileloggedin",  userDetails);
        }
        else {
            res.render("viewprofile",  userDetails);
        }
        

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
            let tagQuery;
            let regexQuery;

            if(query.startsWith('#')){
                const tag = query.slice(1).toLowerCase();
                tagQuery = { tags: { $regex: new RegExp('^' + tag + '$', 'i') } };
                regexQuery = { $or: [
                    { title: { $regex: query.slice(1), $options: 'i' } },
                    { content: { $regex: query, $options: 'i' } }
                ] };

            }
            else{
                regexQuery = { $or: [
                    { title: { $regex: query, $options: 'i' } },
                    { content: { $regex: query, $options: 'i' } },
                    { tags: { $regex: query, $options: 'i' } } 
                ] };
            }

            const posts = await Post.find({ $and: [regexQuery, tagQuery || {}] }).populate('author');

            let totalComments = 0;

            posts.forEach(post => {
            
                if (post.comments) {
                    console.log("comment amount" + post.comments.length);
                    totalComments = post.comments ? post.comments.length : 0;
            
                    post.comments.forEach(comment => {
                        totalComments += countReplies(comment); 
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
                    totalComments += countReplies(comment); 
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

app.get('/popular', async (req, res) => {
    try {
        const popularPosts = await Post.find()
            .sort({ upvotes: -1 })
            .populate('author')
            .exec();

            const pageTitle = 'Popular Posts';

            let totalComments = 0;

            popularPosts.forEach(post => {
            
                if (post.comments) {
                    console.log("comment amount" + post.comments.length);
                    totalComments = post.comments ? post.comments.length : 0;
            
                    post.comments.forEach(comment => {
                        totalComments += countReplies(comment); 
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


function countReplies(comment) {
    let count = 0;
    if (comment.replies) {
        count += comment.replies.length;
        comment.replies.forEach(reply => {
            count += countReplies(reply); 
        });
    }
    return count;
}

async function deleteCommentAndReplies(commentId) {
    const comment = await Comment.findById(commentId);

    if (!comment) {
        return;
    }

    for (const replyId of comment.replies) {
        await deleteCommentAndReplies(replyId);
        await Comment.findByIdAndDelete(replyId);
    }

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
            res.redirect(referer);
        } 

        else if (referer && referer.includes('/globalSearch')) {
            res.redirect(referer);
        } 

        else if (referer && referer.includes('/viewprofile')) {
            res.redirect(referer);
        } 
        
        else if (referer && referer.includes('/popular')) {
            res.redirect(referer);
        }

        else if (referer && referer.includes('/recent')) {
            res.redirect(referer);
        }

        else {
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
            
            res.redirect(referer);
        } 
        
        else if (referer && referer.includes('/globalSearch')) {
           
            res.redirect(referer);
        } 

        else if (referer && referer.includes('/viewprofile')) {
            res.redirect(referer);
        } 

        else if (referer && referer.includes('/popular')) {
            res.redirect(referer);
        }

        else if (referer && referer.includes('/recent')) {
            res.redirect(referer);
        }

        else {
            res.redirect('/homepage');
        }

    } catch (error) {
        res.status(500).json({error: error});
    }
});

app.listen(3000, () => {
    console.log("port connected");
});