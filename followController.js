const db = require('./db.js');

async function followUser(follower, followee) {
    const sql = "INSERT INTO follows (follower, followee) VALUES (?, ?)";
    const [result] = await db.query(sql, [follower, followee]);
    return result.affectedRows === 1;
}

async function unfollowUser(follower, followee) {
    const sql = "DELETE FROM follows WHERE follower = ? AND followee = ?";
    const [result] = await db.query(sql, [follower, followee]);
    return result.affectedRows === 1;
}

async function getFollowerCount(username) {
    const sql = "SELECT COUNT(*) AS cnt FROM follows WHERE followee = ?";
    const [rows] = await db.query(sql, [username]);
    return rows[0].cnt;
}

async function getFollowingCount(username) {
    const sql = "SELECT COUNT(*) AS cnt FROM follows WHERE follower = ?";
    const [rows] = await db.query(sql, [username]);
    return rows[0].cnt;
}

async function isFollowing(follower, followee) {
    const sql = "SELECT 1 FROM follows WHERE follower = ? AND followee = ? LIMIT 1";
    const [rows] = await db.query(sql, [follower, followee]);
    return rows.length > 0;
}

async function isFollowed(followee, follower) {
    const sql = "SELECT 1 FROM follows WHERE follower = ? AND followee = ? LIMIT 1";
    const [rows] = await db.query(sql, [follower, followee]);
    return rows.length > 0;
}

async function renameFollowsUser(oldUsername, newUsername) {
    if (!oldUsername || !newUsername || oldUsername === newUsername) return;
    await db.query("UPDATE follows SET follower = ? WHERE follower = ?", [newUsername, oldUsername]);
    await db.query("UPDATE follows SET followee = ? WHERE followee = ?", [newUsername, oldUsername]);
}

async function listFollowers(username) {
    const sql = `
        SELECT u.username, u.firstName, u.lastName, u.profilePic
        FROM follows f
        JOIN users u ON u.username = f.follower
        WHERE f.followee = ?
        ORDER BY u.username
    `;
    const [rows] = await db.query(sql, [username]);
    return rows;
}

async function listFollowing(username) {
    const sql = `
        SELECT u.username, u.firstName, u.lastName, u.profilePic
        FROM follows f
        JOIN users u ON u.username = f.followee
        WHERE f.follower = ?
        ORDER BY u.username
    `;
    const [rows] = await db.query(sql, [username]);
    return rows;
}

async function getMutualFriends(username) {
    try {
        const sql = `
            SELECT u.username, u.firstName, u.lastName, u.profilePic
            FROM users u
            JOIN follows f1 ON f1.followee = u.username    -- jij volgt deze persoon
            JOIN follows f2 ON f2.follower = u.username    -- deze persoon volgt jou terug
            WHERE f1.follower = ? AND f2.followee = ?
            ORDER BY u.username
        `;

        const [rows] = await db.query(sql, [username, username]);
        return rows; // array van mutual friends
    } catch (err) {
        console.error('Error fetching mutual friends:', err);
        throw err;
    }
}

module.exports = {
    followUser,
    unfollowUser,
    getFollowerCount,
    getFollowingCount,
    isFollowing,
    isFollowed,
    renameFollowsUser,
    listFollowers,
    listFollowing,
    getMutualFriends
};
