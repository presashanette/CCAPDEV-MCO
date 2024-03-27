import models from '../models';
const { models: { User } } = models;

export async function create(req, res) {
    if (req.body.uname && req.body.psw) {
        const { uname, psw } = req.body;

        await User.create({
            uname,
            psw
        });

        res.cookie('uname', uname, { secure: true });
        res.render('indexloggedin', { username });
    }
    else {
        const showError1 = true; // Set to true if an error is detected
        res.render("signup", { showError1 });
    }
}
export async function login(req, res) {
    if (req.body.uname && req.body.psw) {
        const { uname, psw } = req.body;

        let user = await User.findOne({
            where: { uname, psw }
        });

        if (user) {
            req.session.user = user;
            req.session.authorized = true;
            res.render('indexloggedin', { username });
        }
        else {
            res.render('login');
        }
    }
}

// async function createPost(req, res) {
//     const { title, content, tags } = req.body; // Assuming form fields are 'title', 'content', and 'tags'

//     try {
//         // Create a new post document
//         const newPost = new Post({
//             title,
//             content,
//             tags: tags.split(',').map(tag => tag.trim()), // Split tags string by comma and trim spaces
//             author: req.session.user._id // Assuming you have user details in the session
//         });

//         // Save the post to the database
//         await newPost.save();

//         // Redirect or send a response as needed
//         res.redirect('/viewone'); // Redirect to a specific page after successful post creation
//     } catch (error) {
//         console.error('Error creating post:', error);
//         res.status(500).send('Error creating post.'); // Send an error response
//     }
// }

module.exports = { createPost };