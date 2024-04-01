const mongoose = require("mongoose")
require('dotenv').config();

mongoose.connect(process.env.MONGODB_CONNECT_URI)
  .then(() => {
    console.log("MongoDB connected");
  })
  .catch((err) => {
    console.error("Failed to connect MongoDB:", err);
  });

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
    isEdited: {
        type: Boolean,
        default: false
    },
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
    isEdited: {
        type: Boolean,
        default: false
    },
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

commentSch.pre("find", function( next){
    this.populate({path:"replies",
    populate:{path:"author"}
})
    next()
})

const Post = mongoose.model('Post', postSch, 'posts');
const User = mongoose.model('User', userSch, 'users');
const Comment = mongoose.model('Comment', commentSch, 'comments');

const posts = new mongoose.model("posts", postSch);
const users = new mongoose.model("users", userSch);
const comments = new mongoose.model("comments", commentSch);

module.exports = Post, User, Comment;