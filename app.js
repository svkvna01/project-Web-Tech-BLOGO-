const express = require('express');
const session = require('express-session');
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

const users = new Map();

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

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const rec = users.get(username);

    if (rec && rec.password === password) {
        req.session.user = { username, firstName: rec.firstName };
        return res.redirect('/profile');
    }
    return res.redirect('/login');
});

app.get('/register', (req, res) => {
    res.render('register');
});

app.post('/register', (req, res) => {
    const { firstName, lastName, email, username, password } = req.body;

    users.set(username, { password, firstName, lastName, email });
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
