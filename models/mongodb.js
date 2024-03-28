const mongoose = require("mongoose")

mongoose.connect("mongodb://localhost:27017/Girls")
.then(() => {
    console.log("mongodb connected")
})

.catch(() => {
    console.log("failed to connect mongodb")
})



const userSch = new mongoose.Schema({
    uname:{
        type: String,
        required: true
    },

    psw:{
        type: String,
        required: true
    },

    profPicLink:  {
        type: String,
        default: '/picUploads/defUser.png'
    },
    bio: {
        type: String,
        default: 'No bio added'
    },
    posts:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post'
    }],
    comments:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment'
    }],
})

const postSch = new mongoose.Schema({
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    comments: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment'
    }],
    title: String,
    content: String,
    tags: [String],
    image: {
        type: String,
        default: '/default-image.png' // Default image URL if no image is uploaded
    },
    upvotes: {
        type: Number,
        default: 0,
    },
    downvotes: {
        type: Number,
        default: 0,
    },
    upvotedBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    downvotedBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }]
});


const commentSch = new mongoose.Schema({
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    content: String,
    parentComment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment',
        default: null
    },
    replies:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment'
    }],
    post: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post'
    }
});



const Post = mongoose.model('Post', postSch, 'posts');
const User = mongoose.model('User', userSch, 'users');
const Comment = mongoose.model('Comment', commentSch, 'comments');

const posts = new mongoose.model("posts", postSch);
const users = new mongoose.model("users", userSch);
const comments = new mongoose.model("comments", commentSch);

module.exports = { Post, User, Comment };

