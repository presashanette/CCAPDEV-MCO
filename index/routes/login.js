const express = require('express');
const router = express.Router();
const { user } = require('../../controllers');

router.get('/', (req, res) => {
    if (req.session.authorized) {
        res.render('indexloggedin', {uname: req.session.user.uname});
    }
    else {
        res.render('login');
    }
});

router.post('/', user.login);

module.exports = router;