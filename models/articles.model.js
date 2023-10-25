const db = require("../db/connection");
const {checkIfExists} = require("./utils.model");
const format = require("pg-format");

exports.selectArticles = async (queries) => {
    const {topic, sort_by = "created_at", order = "desc", limit = 10, p = 1} = queries;
    if (Number.isNaN(+limit) || limit <= 0 || !Number.isInteger(+limit)) {
        return Promise.reject({status: 400, msg: "Invalid limit datatype"});
    }
    if (Number.isNaN(+p) || p <= 0 || !Number.isInteger(+p)) {
        return Promise.reject({status: 400, msg: "Invalid p datatype"});
    }
    if (topic && !(await checkIfExists("topics", "slug", topic))) {
        return Promise.reject({status: 404, msg: "Topic not found"});
    }
    if (!(order === "asc" || order === "desc")) {
        return Promise.reject({status: 400, msg: "Invalid order"});
    }
    const validSorts = ["article_id", "title", "topic", "author", "created_at", "votes", "comment_count"];
    if (!validSorts.includes(sort_by)) {
        return Promise.reject({status: 400, msg: "Invalid sort_by"});
    }
    const whereClause = topic ? format("WHERE topic = %L", topic) : "";
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
                                ${whereClause}
                            ORDER BY a.${sort_by} ${order}
                            LIMIT ${limit} OFFSET ${limit * (p - 1)};`)).rows;
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

exports.selectArticleComments = async (article_id, queries) => {
    const {limit = 10, p = 1} = queries;
    if (Number.isNaN(+limit) || limit <= 0 || !Number.isInteger(+limit)) {
        return Promise.reject({status: 400, msg: "Invalid limit datatype"});
    }
    if (Number.isNaN(+p) || p <= 0 || !Number.isInteger(+p)) {
        return Promise.reject({status: 400, msg: "Invalid p datatype"});
    }
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
        ORDER BY created_at desc
        LIMIT $2 OFFSET $3;`, [article_id, limit, ((p - 1) * limit)]);

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

exports.updateArticle = async (article_id, body) => {
    if (!body || body === {}) {
        return Promise.reject({status: 304, msg: "Article not changed"});
    }
    const {inc_votes} = body;
    if (inc_votes === undefined) {
        return Promise.reject({status: 304, msg: "Article not changed"});
    }
    if (Number.isNaN(+inc_votes) || Math.floor(inc_votes) !== inc_votes) {
        return Promise.reject({status: 400, msg: "Invalid inc_votes datatype"});
    }
    if (inc_votes === 0) {
        return Promise.reject({status: 304, msg: "Article not changed"});
    }
    if (!(await checkIfExists("articles", "article_id", article_id))) {
        return Promise.reject({status: 404, msg: "Article not found"});
    }

    const query = format("UPDATE articles SET votes = votes + %s WHERE article_id = %s RETURNING *;"
        , inc_votes, article_id);
    return (await db.query(query)).rows[0];
};

exports.insertArticle = async (reqBody) => {
    const {
        author,
        title,
        body,
        topic,
        article_img_url = "https://avatars.slack-edge.com/2021-02-08/1724811773957_c6b24cf6ef8cfcca933a_102.png"
    } = reqBody;
    if (!(author && title && body && topic)) {
        return Promise.reject({status: 400, msg: "Request missing properties"});
    }
    if (!(await checkIfExists("topics", "slug", topic))) {
        return Promise.reject({status: 404, msg: "Topic not found"});
    }
    if (!(await checkIfExists("users", "username", author))) {
        return Promise.reject({status: 404, msg: "Author not found"});
    }

    const insertQuery = format("INSERT INTO articles (title, topic, author, body, article_img_url) VALUES (%L, %L, %L, %L, %L) RETURNING *;",
        title, topic, author, body, article_img_url);

    const result = (await db.query(insertQuery)).rows[0];

    return (await db.query(`SELECT a.*, COALESCE(c.comment_count, 0) as comment_count
                            FROM articles a
                                     LEFT JOIN (SELECT article_id,
                                                       CAST(COUNT(comment_id) as INTEGER) as comment_count
                                                FROM comments
                                                GROUP BY article_id) c on c.article_id = a.article_id
                            WHERE a.article_id = $1`, [result.article_id])).rows[0];
};