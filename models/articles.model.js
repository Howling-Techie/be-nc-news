const db = require("../db/connection");
const {checkIfExists} = require("./utils.model");

exports.selectArticles = async () => {
  return (await db.query(`SELECT author,
                                 title,
                                 a.article_id,
                                 topic,
                                 created_at,
                                 votes,
                                 article_img_url,
                                 COALESCE(c.comment_count, 0) as comment_count
                          FROM articles a
                                   LEFT JOIN (SELECT article_id,
                                                     CAST(COUNT(comment_id) as INTEGER) as comment_count
                                              FROM comments
                                              GROUP BY article_id) c on c.article_id = a.article_id
                          ORDER BY a.created_at desc;`)).rows;
};

exports.selectArticle = async (article_id) => {
  if (Number.isNaN(+article_id)) {
    return Promise.reject({status: 400, msg: "Invalid article_id datatype"});
  }
  const results = await db.query(`SELECT a.*, COALESCE(c.comment_count, 0) as comment_count
                                  FROM articles a
                                           LEFT JOIN (SELECT article_id,
                                                             CAST(COUNT(comment_id) as INTEGER) as comment_count
                                                      FROM comments
                                                      GROUP BY article_id) c on c.article_id = a.article_id
                                  WHERE a.article_id = $1`, [article_id]);

  if (results.rows.length === 0) {
    return Promise.reject({status: 404, msg: "Article not found"});
  }
  return results.rows[0];
};

exports.selectArticleComments = async (article_id) => {
  if (Number.isNaN(+article_id)) {
    return Promise.reject({status: 400, msg: "Invalid article_id datatype"});
  }

  const articleResults = await db.query(`
      SELECT article_id
      FROM articles
      WHERE article_id = $1;`, [article_id]);
  if (articleResults.rows.length === 0) {
    return Promise.reject({status: 404, msg: "Article not found"});
  }

  const commentResults = await db.query(`
      SELECT *
      FROM comments
      WHERE article_id = $1
      ORDER BY created_at desc;`, [article_id]);

  return commentResults.rows;
};

exports.insertArticleComment = async (article_id, comment) => {
  if (Number.isNaN(+article_id)) {
    return Promise.reject({status: 400, msg: "Invalid article_id datatype"});
  }

  if (!("username" in comment)) {
    return Promise.reject({status: 400, msg: "Request missing username"});
  }
  if (!("body" in comment)) {
    return Promise.reject({status: 400, msg: "Request missing body"});
  }

  if (!(await checkIfExists("articles", "article_id", article_id))) {
    return Promise.reject({status: 404, msg: "Article not found"});
  }
  if (!(await checkIfExists("users", "username", comment.username))) {
    return Promise.reject({status: 404, msg: "User not found"});
  }
  return (await db.query(`INSERT INTO comments(article_id, body, author)
                          VALUES ($1, $2, $3)
                          RETURNING *;`, [article_id, comment.body, comment.username])).rows[0];
};