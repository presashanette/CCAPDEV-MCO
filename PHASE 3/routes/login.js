const express = require('express');
const router = express.Router();
const { user,postController } = require('../../controllers');

router.get('/', (req, res) => {
    if (req.session.authorized) {
        res.render('indexloggedin', {uname: req.session.user.uname});
    }
    else {
        res.render('login');
    }
});

router.post('/', user.login);
const { createPost } = require('./postController'); // Import the createPost controller function

// Route to handle creating a new post
router.post('/createpost', createPost);


module.exports = router;