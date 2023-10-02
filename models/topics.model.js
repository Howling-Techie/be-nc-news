const db = require("../db/connection");

exports.selectTopics = async () => {

  const results = await db.query(`SELECT *
                                  FROM topics;`);
  return results.rows;
};