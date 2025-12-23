const db = require('./db.js'); //Import the MYSQL pool

// Add post to database
async function addPost(username, caption, imagePaths) {
    const sqlPost = "INSERT INTO posts (username, caption) VALUES (?, ?)"; 
    const [result] = await db.query(sqlPost, [username, caption]);
    const postId = result.insertId;

    if (imagePaths && imagePaths.length > 0) {
        const sqlImages = "INSERT INTO post_images (post_id, image_path) VALUES ?";
        const imageValues = imagePaths.map(path => [postId, path]);
        await db.query(sqlImages, [imageValues]);
    }
}

// Get posts of a certain user
async function getPostsForUser(username) {
    const sql = `
        SELECT p.*, GROUP_CONCAT(pi.image_path) as images 
        FROM posts p 
        LEFT JOIN post_images pi ON p.id = pi.post_id 
        WHERE p.username = ? 
        GROUP BY p.id 
        ORDER BY p.created_at DESC
    `;
    const [posts] = await db.query(sql, [username]);

    return posts.map(post => ({
        ...post,
        images: post.images ? post.images.split(',') : []
    }));
}

// Get all the posts from the database (from each user)
async function getAllPosts(viewerUsername) {
    const sql = `
        SELECT p.*, GROUP_CONCAT(pi.image_path) as images 
        FROM posts p 
        LEFT JOIN users u ON u.username = p.username
        LEFT JOIN post_images pi ON p.id = pi.post_id 
        WHERE u.privacy = 'public' OR p.username = ?
        GROUP BY p.id 
        ORDER BY p.created_at DESC
    `;
    const [posts] = await db.query(sql, [viewerUsername || '']);

    return posts.map(post => ({
        ...post,
        images: post.images ? post.images.split(',') : []
    }));
}

// Delete a post
async function deletePost(id, username) {
    await db.query("DELETE FROM saved_posts WHERE post_id = ?", [id]);
    const sql = "DELETE FROM posts WHERE id = ? AND username = ?";
    await db.query(sql, [id, username]);
}

// Update the username of OP 
async function renamePostsUser(oldUsername, newUsername) {
    await db.query("UPDATE posts SET username = ? WHERE username = ?", [newUsername, oldUsername]);
}


//Retrieves all root comments for a specific post.
// Root comments are comments that do not have a parent comment.
async function getRootCommentsForPost(postId){
    const sql = `
        SELECT * 
        FROM comments 
        WHERE post_id = ? AND parent_id is NULL
        ORDER BY created_at DESC
    `;
    const [comments] = await db.query(sql, [postId]);

    return comments;

}
//Retrieves all replies for a specific comment.
 //Replies are comments that have a parent comment.(it is a reply to a comment)
async function getRepliesForComment(commentId){
    const sql = `
        SELECT * 
        FROM comments 
        WHERE parent_id = ?
        ORDER BY created_at DESC
    `;
    const [comments] = await db.query(sql, [commentId]);

    return comments;

}

//Adds a new comment or reply to a post.
async function addComment(post_id, username, caption , parent_id) {
    const sql = "INSERT INTO comments (post_id, username, caption , parent_id) VALUES (?, ?, ? , ?)";
    const [result] = await db.query(sql, [post_id, username, caption , parent_id]);

    return result.insertId; 
}

//Deletes a comment owned by the given user.
async function deleteComment(id, username) {
    const sql = "DELETE FROM comments WHERE id = ? AND username = ?";
    const [result] = await db.query(sql, [id, username]);;
    return result.affectedRows === 1;
}


//Updates the caption of an existing comment.
async function updateComment(comment_id, username, caption) {
    const sql = `
        UPDATE comments
        SET caption = ?
        WHERE id = ? AND username = ?
    `;
    
    const [result] = await db.query(sql, [caption, comment_id, username]);

    return result.affectedRows === 1;
}

//get profil picture from the user who made the post
async function getProfilPictureForPost(postId) {

    const sql = `
        SELECT u.profilePic
        FROM users u
        JOIN posts p ON u.username = p.username
        WHERE p.id = ?
    `;

    const [rows] = await db.query(sql, [postId]);

    return rows.length > 0 ? rows[0].profilePic : null;
}


// Export functions
module.exports = {
    addPost,
    getPostsForUser,
    getAllPosts,
    deletePost,
    renamePostsUser,
    getRootCommentsForPost,
    getRepliesForComment,
    addComment,
    deleteComment,
    updateComment,
    getProfilPictureForPost
};
