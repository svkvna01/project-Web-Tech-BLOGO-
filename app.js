const express = require('express');
const session = require('express-session');
const db = require('./userController.js');
const { ValidateLogin , AddUser } = require('./userController.js');

const path = require('path');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));


app.use(express.static(path.join(__dirname)));

app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: 'User',
    resave: false,
    saveUninitialized: false,
}));


app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    next();
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/login', (req, res) => {
    res.render('login');
});

app.get('/editProfile', requireAuth, (req, res) => {
    res.render('editProfile', { user: req.session.user });
});


app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    const isValid = await ValidateLogin(username, password);

    if (!isValid) {
        return res.render("login", { error: "Incorrect username or password" });
    }

    // login OK
    req.session.user = { username };
    res.redirect("/profile");
});



app.get('/register', (req, res) => {
    res.render('register');
});

app.post('/register', (req, res) => {
    const values = [
        req.body.firstName,
        req.body.lastName, 
        req.body.email, 
        req.body.username, 
        req.body.password ]

    const result = AddUser(values);
     if (!result) {
         return res.send("Something went wrong!");
        }

    return res.redirect('/login');
});

function requireAuth(req, res, next) {
    if (!req.session.user) return res.redirect('/login');
    next();
}

app.get('/profile', requireAuth, (req, res) => {
    res.render('profile', { user: req.session.user });
});


const PORT = 3000;
app.listen(PORT, () => console.log(`App listening on http://localhost:${PORT}`));
