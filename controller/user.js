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
