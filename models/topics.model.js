const db = require("../db/connection");
const format = require("pg-format");
const {checkIfExists} = require("./utils.model");

exports.selectTopics = async () => {
  const results = await db.query(`SELECT *
                                  FROM topics;`);
  return results.rows;
};

exports.insertTopic = async (body) => {

  if (!("slug" in body && "description" in body)) {
    return Promise.reject({status: 400, msg: "Missing required properties in body"});
  }

  if (await checkIfExists("topics", "slug", body.slug)) {
    return Promise.reject({status: 403, msg: "Topic already exists"});
  }

  const insertQuery = format("INSERT INTO topics(slug, description) VALUES (%L, %L) RETURNING *;", body.slug, body.description);

  return (await db.query(insertQuery)).rows[0];
};