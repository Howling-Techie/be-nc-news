const db = require("../db/connection");

exports.selectUsers = async () => {
  return (await db.query(`SELECT *
                          FROM users`)).rows;
};

exports.selectUser = async (username) => {
  const results = await db.query(`SELECT *
                                  FROM users
                                  WHERE username = $1`, [username]);

  if (results.rows.length === 0) {
    return Promise.reject({status: 404, msg: "User not found"});
  }
  return results.rows[0];
};