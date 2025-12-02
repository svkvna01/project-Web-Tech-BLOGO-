const express = require('express');
const session = require('express-session');
const db = require('./userController.js');
const { findUserInfoByUsername, AddUser,UpdateUser, ValidateLogin } = require('./userController');
const { addTrip, getTripsForUser, deleteTrip } = require('./tripController');

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

app.post('/editProfile', requireAuth, async (req, res) => {
    const username = req.session.user.username;

    const field = req.body.field;
    const value = req.body.value;

    await UpdateUser(username, field, value);

    let newUser;

    if (field === "username") {
        newUser = await findUserInfoByUsername(value);
    } else {
        newUser = await findUserInfoByUsername(username);
    }
    req.session.user = newUser;
    res.redirect('/editProfile');
});


app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    const isValid = await ValidateLogin(username, password);

    if (!isValid) {
        return res.render("login", { error: "Incorrect username or password" });
    }

    // login OK
    req.session.user = await findUserInfoByUsername(username);
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
        req.body.password]

    const result = AddUser(values);
    return res.redirect('/login');
});

function requireAuth(req, res, next) {
    if (!req.session.user) return res.redirect('/login');
    next();
}

app.get('/profile', requireAuth, (req, res) => {
    res.render('profile', { user: req.session.user });
});

app.post('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/login');
    });
});

app.get('/planner', requireAuth, async (req, res) => {
    const username = req.session.user.username;
    const trips = await getTripsForUser(username);
    res.render('planner', { trips });
});

app.post('/planner', requireAuth, async (req, res) => {
    const username = req.session.user.username;
    const { country, city, date, activity } = req.body;

    const values = [username, country, city, date, activity];
    await addTrip(values);

    res.redirect('/planner');
});

app.get('/trips', requireAuth, async (req, res) => {
  const username = req.session.user.username;
  const trips = await getTripsForUser(username);
  res.render('trips', { trips });
});

app.post('/trips/delete', requireAuth, async (req, res) => {
  const username = req.session.user.username;
  const { id } = req.body;
  await deleteTrip(id, username);
  res.redirect('/trips');
});

app.get('/api/trips', requireAuth, async (req, res) => {
  const username = req.session.user.username;
  const trips = await getTripsForUser(username);
  res.json(trips);
});

app.get('/map', requireAuth, (req, res) => {
  res.render('map');
});

const PORT = 3000;
app.listen(PORT, () => console.log(`App listening on http://localhost:${PORT}`));
