const db = require("../db/connection");

exports.selectUsers = async () => {
  return (await db.query(`SELECT *
                          FROM users`)).rows;
};