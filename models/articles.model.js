const db = require("../db/connection");

exports.selectArticle = async (article_id) => {
  if (Number.isNaN(+article_id)) {
    return Promise.reject({status: 400, msg: "Invalid article_id datatype"});
  }
  const results = await db.query(`SELECT *
                                  FROM articles
                                  WHERE article_id = $1`, [article_id]);

  if (results.rows.length === 0) {
    return Promise.reject({status: 404, msg: "Article not found"});
  }
  return results.rows[0];
};

exports.selectArticles = async () => {
  const results = await db.query(`SELECT *
                                  FROM articles;`);
  return results.rows;
};