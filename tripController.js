const db = require('./db.js');

async function addTrip(values) {
    const sql = "INSERT INTO trips (username, country, city, date, activity) VALUES (?)";
    const [result] = await db.query(sql, [values]);
    return result.affectedRows === 1;
}

async function getTripsForUser(username) {
    const sql = "SELECT * FROM trips WHERE username = ?";
    const [rows] = await db.query(sql, [username]);
    return rows;
}

module.exports = {
    addTrip,
    getTripsForUser
};
