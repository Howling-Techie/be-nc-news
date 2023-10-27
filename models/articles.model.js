const db = require("../db/connection");
const {checkIfExists} = require("./utils.model");
const format = require("pg-format");
const jwt = require("jsonwebtoken");

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
                                   (CAST(COALESCE(SUM(v.vote), 0) AS int) + a.votes) as votes,
                                   article_img_url,
                                   COALESCE(c.comment_count, 0)                      as comment_count
                            FROM articles a
                                     LEFT JOIN (SELECT article_id,
                                                       CAST(COUNT(comment_id) as INTEGER) as comment_count
                                                FROM comments
                                                GROUP BY article_id) c on c.article_id = a.article_id
                                     LEFT JOIN article_votes v ON a.article_id = v.article_id
                                ${whereClause}
                            GROUP BY a.article_id, c.comment_count
                            ORDER BY ${sort_by} ${order}
                            LIMIT ${limit} OFFSET ${limit * (p - 1)};`)).rows;
};

exports.selectArticle = async (article_id) => {
    if (Number.isNaN(+article_id)) {
        return Promise.reject({status: 400, msg: "Invalid article_id datatype"});
    }
    const results = await db.query(`SELECT a.article_id,
                                           a.article_img_url,
                                           a.title,
                                           a.topic,
                                           a.author,
                                           a.body,
                                           a.created_at,
                                           (CAST(COALESCE(SUM(v.vote), 0) AS int) + a.votes) as votes,
                                           COALESCE(c.comment_count, 0)                      as comment_count
                                    FROM articles a
                                             LEFT JOIN (SELECT article_id,
                                                               CAST(COUNT(comment_id) as INTEGER) as comment_count
                                                        FROM comments
                                                        GROUP BY article_id) c on c.article_id = a.article_id
                                             LEFT JOIN article_votes v ON a.article_id = v.article_id
                                    WHERE a.article_id = $1
                                    GROUP BY a.article_id, c.comment_count`, [article_id]);

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
        SELECT c.comment_id,
               c.body,
               c.article_id,
               c.author,
               (CAST(COALESCE(SUM(v.vote), 0) AS int) + c.votes) as votes,
               c.created_at
        FROM comments c
                 LEFT JOIN comment_votes v ON c.comment_id = v.comment_id
        WHERE article_id = $1
        GROUP BY c.comment_id
        ORDER BY created_at desc
        LIMIT $2 OFFSET $3;`, [article_id, limit, ((p - 1) * limit)]);
    return commentResults.rows;
};

exports.insertArticleComment = async (article_id, comment) => {
    if (Number.isNaN(+article_id)) {
        return Promise.reject({status: 400, msg: "Invalid article_id datatype"});
    }

    if (!("token" in comment)) {
        return Promise.reject({status: 400, msg: "Request missing token"});
    }
    if (!("body" in comment)) {
        return Promise.reject({status: 400, msg: "Request missing body"});
    }

    if (!(await checkIfExists("articles", "article_id", article_id))) {
        return Promise.reject({status: 404, msg: "Article not found"});
    }
    try {
        const decoded = jwt.verify(comment.token, process.env.JWT_KEY);
        const username = decoded.username;
        return (await db.query(`INSERT INTO comments(article_id, body, author)
                                VALUES ($1, $2, $3)
                                RETURNING *;`, [article_id, comment.body, username])).rows[0];
    } catch {
        return Promise.reject({status: 401, msg: "Unauthorised"});
    }
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


exports.updateArticleVotes = async (article_id, body) => {
    if (Number.isNaN(+article_id)) {
        return Promise.reject({status: 400, msg: "Invalid article_id datatype"});
    }

    if (!("token" in body)) {
        return Promise.reject({status: 400, msg: "Request missing token"});
    }
    if (!("vote" in body)) {
        return Promise.reject({status: 400, msg: "Request missing vote"});
    }

    const {vote, token} = body;
    if (Number.isNaN(+vote) || Math.floor(vote) !== vote) {
        return Promise.reject({status: 400, msg: "Invalid vote datatype"});
    }

    if (!(await checkIfExists("articles", "article_id", article_id))) {
        return Promise.reject({status: 404, msg: "Article not found"});
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_KEY);
        const username = decoded.username;
        await db.query(`INSERT INTO article_votes(article_id, username, vote)
                        VALUES ($1, $2, $3)
                        ON CONFLICT (article_id, username)
                            DO UPDATE SET vote = $3;`,
            [article_id, username, vote]);
        return await exports.selectArticle(article_id);
    } catch {
        return Promise.reject({status: 401, msg: "Unauthorised"});
    }
};