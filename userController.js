const db = require('./db.js');

async function findUserInfoByUsername(name){
   const sql = "SELECT * FROM users WHERE username = ? ";
   const [info] = await db.query(sql , [name],);
   return info;
}

async function AddUser(values , res){
    const sql = "INSERT INTO users (firstName, lastName, email, username, password ) VALUES(?)";
    const [user] = await db.query(sql , [values]);
    return user.affectedRows === 1;
}

async function DeleteUser(values , res){
    const sql = "DELETE INTO users (firstName, lastName, email, username, password ) VALUES(?)";
    const [user] = await db.query(sql , [values]);
    return user.affectedRows === 1;
}

function UpDateUserEmail(username , newEmail){
    const sql = "UPDATE users SET email = ? WHERE userame = ?";
    db.query(sql , [newEmail , username]);
    
}

function UpDateUserFirstName(username , newEmail){
    const sql = "UPDATE users SET firstname = ? WHERE userame = ?";
    db.query(sql , [newEmail , username]);
    
}

function UpDateUserLastName(username , newEmail){
    const sql = "UPDATE users SET lastname = ? WHERE userame = ?";
    db.query(sql , [newEmail , username]);
    
}



async function ValidateLogin(username, password) {
    const [info] = await findUserInfoByUsername(username);

    if (!info) return false;   // user bestaat niet

    const dbPassword = info.password;
    return password === dbPassword;
}


module.exports = {
    findUserInfoByUsername,
    AddUser,
    UpDateUserEmail,
    ValidateLogin,
    UpDateUserFirstName,
    UpDateUserLastName
};