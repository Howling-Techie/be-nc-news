const app = require("../app.js");
const request = require("supertest");
const db = require("../db/connection");
const testData = require("../db/data/test-data/index");
const seed = require("../db/seeds/seed");
const {generateToken} = require("../models/utils.model");

afterAll(() => {
    return db.end();
});
beforeEach(() => seed(testData));

describe("GET /api", () => {
    test("return 200 status code", () => {
        return request(app).get("/api").expect(200);
    });
    test("return an array of endpoints", () => {
        return request(app).get("/api").expect(200).then(({body}) => {
            const paths = [
                "/api/topics",
                "/api/users",
                "/api/users/{username}",
                "/api/comments/{comment_id}",
                "/api/articles",
                "/api/articles/{article_id}",
                "/api/articles/{article_id}/comments",
                "/api"
            ];
            for (const pathName of paths) {
                expect(body.endpoints.paths.hasOwnProperty(pathName)).toBeTruthy();
            }
        });
    });
});

describe("/api/topics", () => {
    describe("GET", () => {
        test("return 200 status code", () => {
            return request(app).get("/api/topics").expect(200);
        });
        test("return an array of topics", () => {
            return request(app).get("/api/topics").then(({body}) => {
                expect(body.topics.length).toBe(3);
                body.topics.forEach((topic) => {
                    expect(typeof topic.slug).toBe("string");
                    expect(typeof topic.description).toBe("string");
                });
            });
        });
    });
    describe("POST", () => {
        test("201 - return the newly created topic", () => {
            return request(app).post("/api/topics").send({
                slug: "Intro to front end",
                description: "Articles to help newbies get to grips with front end development"
            }).expect(201).then(({body}) => {
                expect(body.topic).toMatchObject({
                    slug: "Intro to front end",
                    description: "Articles to help newbies get to grips with front end development"
                });
            });
        });
        test("403 - reject attempts to insert topics that already exist", () => {
            return request(app).post("/api/topics").send({
                slug: "cats",
                description: "You know them, you love them"
            }).expect(403);
        });
        test("400 - reject attempts to insert topics with missing properties", () => {
            return request(app).post("/api/topics").send({
                description: "Like cats, but different"
            }).expect(400);
        });
    });
});

describe("/api/articles", () => {
    describe("GET", () => {
        describe("GET /api/articles", () => {
            test("return 200 status code", () => {
                return request(app).get("/api/articles").expect(200);
            });
            test("return an array of articles", () => {
                return request(app).get("/api/articles").then(({body}) => {
                    expect(body.articles.length).toBe(10);
                    body.articles.forEach((article) => {
                        expect(article).toMatchObject({
                            author: expect.any(String),
                            title: expect.any(String),
                            article_id: expect.any(Number),
                            topic: expect.any(String),
                            created_at: expect.any(String),
                            votes: expect.any(Number),
                            article_img_url: expect.any(String),
                            comment_count: expect.any(Number)
                        });
                        expect(article).not.toHaveProperty("body");
                    });
                });
            });
            test("return an array of articles with the comment count", () => {
                return request(app).get("/api/articles").then(({body}) => {
                    expect(body.articles.find((article) => article.article_id === 1).comment_count).toBe(11);
                    expect(body.articles.find((article) => article.article_id === 2).comment_count).toBe(0);
                });
            });
            describe("filtering and sorting", () => {
                test("return an array sorted by date descending by default", () => {
                    return request(app).get("/api/articles").then(({body}) => {
                        expect(body.articles).toBeSorted({key: "created_at", descending: true});
                    });
                });
                test("return an array sorted by date in the order specified", () => {
                    return request(app).get("/api/articles?order=asc").then(({body}) => {
                        expect(body.articles).toBeSorted({key: "created_at", descending: false});
                    });
                });
                test("return an array sorted by the column specified in descending order", () => {
                    return request(app).get("/api/articles?sort_by=votes").then(({body}) => {
                        expect(body.articles).toBeSorted({key: "votes", descending: true});
                    });
                });
                test("return 400 if an invalid order is provided", () => {
                    return request(app).get("/api/articles?order=mixed").expect(400);
                });
                test("return 400 if an invalid sort_by is provided", () => {
                    return request(app).get("/api/articles?sort_by=tone").expect(400);
                });
                test("return an array sorted by a column in the order specified", () => {
                    return request(app).get("/api/articles?sort_by=title&order=asc").then(({body}) => {
                        expect(body.articles).toBeSorted({key: "title", descending: false});
                    });
                });
                test("return an array filtered by the provided topic", () => {
                    return request(app).get("/api/articles?topic=cats").then(({body}) => {
                        expect(body.articles.filter(article => article.topic !== "cats").length === 0).toBeTruthy();
                        expect(body.articles.filter(article => article.topic === "cats").length === 1).toBeTruthy();
                    });
                });
                test("return a filtered array sorted by the column and order specified", () => {
                    return request(app).get("/api/articles?topic=mitch&sort_by=title&order=desc").then(({body}) => {
                        expect(body.articles).toBeSorted({key: "title", descending: true});
                        expect(body.articles.filter((article) => article.topic !== "mitch").length).toBe(0);
                        expect(body.articles.filter((article) => article.topic === "mitch").length).toBe(10);
                    });
                });
                test("return 404 if the topic does not exist", () => {
                    return request(app).get("/api/articles?topic=dogs")
                        .expect(404).then(({body}) => expect(body.msg).toBe("Topic not found"));
                });
                test("return an empty array if no articles found in topic", () => {
                    return request(app).get("/api/articles?topic=paper")
                        .expect(200).then(({body}) => expect(body.articles.length).toBe(0));
                });
            });
            describe("pagination", () => {
                test("return an array limited to the value specified", () => {
                    return request(app).get("/api/articles?limit=5").then(({body}) => {
                        expect(body.articles.length).toBe(5);
                    });
                });
                test("return the second page of results when when p is 2", () => {
                    return request(app).get("/api/articles?p=2").then(({body}) => {
                        expect(body.articles.length).toBe(3);
                    });
                });
                test("limit is taken into account when calculating pages", () => {
                    return request(app).get("/api/articles?limit=4&p=4").then(({body}) => {
                        expect(body.articles.length).toBe(1);
                    });
                });
                test("return 400 if an invalid limit is provided", () => {
                    return request(app).get("/api/articles?limit=-10").expect(400);
                });
                test("return 400 if an invalid p is provided", () => {
                    return request(app).get("/api/articles?p=1.5").expect(400);
                });
            });
        });
        describe("GET /api/articles/:article_id", () => {
            test("return 200 status code", () => {
                return request(app).get("/api/articles/1").expect(200);
            });
            test("return an article object", () => {
                return request(app).get("/api/articles/2").then(({body}) => {
                    expect(body.article).toMatchObject({
                        article_id: 2,
                        title: expect.any(String),
                        topic: expect.any(String),
                        author: expect.any(String),
                        body: expect.any(String),
                        created_at: expect.any(String),
                        votes: expect.any(Number),
                        article_img_url: expect.any(String),
                        comment_count: expect.any(Number)
                    });
                });
            });
            test("return an article with a comment count", () => {
                return request(app).get("/api/articles/3").then(({body}) => {
                    expect(body.article).toHaveProperty("comment_count", 2);
                });
            });
            test("return 404 if article not found", () => {
                return request(app).get("/api/articles/100000").expect(404);
            });
            test("return 400 if article_id is not an integer", () => {
                return request(app).get("/api/articles/first_article").expect(400);
            });
            test("return the correct article when provided with an article_id", () => {
                return request(app).get("/api/articles/3").then(({body}) => {
                    const result = {
                        article_id: 3,
                        title: "Eight pug gifs that remind me of mitch",
                        topic: "mitch",
                        author: "icellusedkars",
                        body: "some gifs",
                        created_at: new Date(1604394720000).toISOString(),
                        votes: 0,
                        article_img_url:
                            "https://images.pexels.com/photos/158651/news-newsletter-newspaper-information-158651.jpeg?w=700&h=700",
                        comment_count: 2
                    };
                    expect(body.article).toMatchObject(result);
                });
            });
        });
        describe("GET /api/articles/:article_id/comments", () => {
            test("return an array of comment objects", () => {
                return request(app).get("/api/articles/1/comments").expect(200).then(({body}) => {
                    expect(body.comments.length).toBe(10);
                    body.comments.forEach((comment) => {
                        expect(comment).toMatchObject({
                            article_id: 1,
                            comment_id: expect.any(Number),
                            votes: expect.any(Number),
                            created_at: expect.any(String),
                            author: expect.any(String),
                            body: expect.any(String),
                        });
                    });
                });
            });
            test("return 404 if article not found", () => {
                return request(app).get("/api/articles/100000/comments").expect(404);
            });
            test("return 400 if article_id is not an integer", () => {
                return request(app).get("/api/articles/first_article/comments").expect(400);
            });
            test("return the correct comments when provided with an article_id", () => {
                return request(app).get("/api/articles/6/comments").then(({body}) => {
                    const result = [{
                        body: "This is a bad article name",
                        votes: 1,
                        author: "butter_bridge",
                        article_id: 6,
                        created_at: "2020-10-11T15:23:00.000Z"
                    }];
                    expect(body.comments).toMatchObject(result);
                });
            });
            test("return array of comments is ordered with most recent first", () => {
                return request(app).get("/api/articles/1/comments").then(({body}) => {
                    expect(body.comments.length).toBe(10);
                    expect(body.comments).toBeSortedBy("created_at", {descending: true});
                });
            });
            test("return an empty array if the article exists but has no comments", () => {
                return request(app).get("/api/articles/2/comments").expect(200).then(({body}) => {
                    expect(body.comments.length).toBe(0);
                });
            });
            describe("pagination", () => {
                test("return an array limited to the value specified", () => {
                    return request(app).get("/api/articles/1/comments?limit=5").then(({body}) => {
                        expect(body.comments.length).toBe(5);
                    });
                });
                test("return the second page of results when when p is 2", () => {
                    return request(app).get("/api/articles/1/comments?p=2").then(({body}) => {
                        expect(body.comments.length).toBe(1);
                    });
                });
                test("limit is taken into account when calculating pages", () => {
                    return request(app).get("/api/articles/1/comments?limit=3&p=4").then(({body}) => {
                        expect(body.comments.length).toBe(2);
                    });
                });
                test("return 400 if an invalid limit is provided", () => {
                    return request(app).get("/api/articles/1/comments?limit=1.5").expect(400);
                });
                test("return 400 if an invalid p is provided", () => {
                    return request(app).get("/api/articles/1/comments?p=-3").expect(400);
                });
            });
        });
    });
    describe("POST", () => {
        describe("POST /api/articles/:article_id/comments", () => {
            test("Respond with the newly created comment object", () => {
                return request(app).post("/api/articles/1/comments").send({
                    username: "lurker",
                    body: "My first post!"
                }).expect(201).then(({body}) => {
                    expect(body.comment).toMatchObject({
                        article_id: 1,
                        comment_id: expect.any(Number),
                        votes: 0,
                        created_at: expect.any(String),
                        author: "lurker",
                        body: "My first post!",
                    });
                });
            });
            test("Extra properties are ignored in send body", () => {
                return request(app).post("/api/articles/1/comments").send({
                    username: "lurker",
                    body: "I wanted to say more!",
                    originalMessage: "My first post!"
                }).expect(201).then(({body}) => {
                    expect(body.comment).toMatchObject({
                        article_id: 1,
                        comment_id: expect.any(Number),
                        votes: 0,
                        created_at: expect.any(String),
                        author: "lurker",
                        body: "I wanted to say more!",
                    });
                });
            });
            test("New comment is stored on the database", () => {
                return request(app).post("/api/articles/2/comments")
                    .send({
                        username: "lurker",
                        body: "Who wrote this?"
                    }).then(() => {
                        return request(app).get("/api/articles/2/comments")
                            .then(({body}) => {
                                expect(body.comments.filter((comment) => comment.author === "lurker").length).toBe(1);
                            });
                    });
            });
            test("Respond with 400 if object is missing username", () => {
                return request(app).post("/api/articles/1/comments").send({
                    body: "Send me a DM for deets"
                }).expect(400).then(({body}) => expect(body.msg).toBe("Request missing username"));
            });
            test("Respond with 400 if object is missing body", () => {
                return request(app).post("/api/articles/1/comments").send({
                    username: "lurker"
                }).expect(400).then(({body}) => expect(body.msg).toBe("Request missing body"));
            });
            test("Respond with 404 if the article cannot be found", () => {
                return request(app).post("/api/articles/1000/comments").send({
                    username: "lurker",
                    body: "My second post!"
                }).expect(404).then(({body}) => expect(body.msg).toBe("Article not found"));
            });
            test("Respond with 404 if the user cannot be found", () => {
                return request(app).post("/api/articles/1/comments").send({
                    username: "newbie",
                    body: "hiii"
                }).expect(404).then(({body}) => expect(body.msg).toBe("User not found"));
            });
            test("Respond with 400 if the article id is not an integer", () => {
                return request(app).post("/api/articles/about_me/comments").send({
                    username: "lurker",
                    body: "My first article"
                }).expect(400).then(({body}) => expect(body.msg).toBe("Invalid article_id datatype"));
            });
        });
        describe("POST /api/articles", () => {
            test("201 - Respond with the newly created article object", () => {
                return request(app).post("/api/articles").send({
                    author: "butter_bridge",
                    title: "A new article, for YOU",
                    body: "Here is some contents",
                    topic: "cats",
                    article_img_url: "https://a.slack-edge.com/bv1-10/slack_logo-ebd02d1.svg"
                }).expect(201).then(({body}) => {
                    expect(body.article).toContainEntries([
                        ["author", "butter_bridge"],
                        ["title", "A new article, for YOU"],
                        ["body", "Here is some contents"],
                        ["topic", "cats"],
                        ["article_img_url", "https://a.slack-edge.com/bv1-10/slack_logo-ebd02d1.svg"]]);
                });
            });
            test("201 - Extra properties are ignored in send body", () => {
                return request(app).post("/api/articles").send({
                    author: "butter_bridge",
                    title: "A new article, for YOU",
                    body: "Here is some contents",
                    topic: "cats",
                    article_img_url: "https://a.slack-edge.com/bv1-10/slack_logo-ebd02d1.svg",
                    tags: ["first", "tagged"]
                }).expect(201).then(({body}) => {
                    expect(body.article).not.toContainKey("tags");
                });
            });
            test("201 - Response contains all new article properties", () => {
                return request(app).post("/api/articles").send({
                    author: "butter_bridge",
                    title: "A new article, for YOU",
                    body: "Here is some contents",
                    topic: "cats",
                    article_img_url: "https://a.slack-edge.com/bv1-10/slack_logo-ebd02d1.svg"
                }).expect(201).then(({body}) => {
                    expect(body.article).toMatchObject({
                        author: "butter_bridge",
                        title: "A new article, for YOU",
                        body: "Here is some contents",
                        topic: "cats",
                        article_img_url: "https://a.slack-edge.com/bv1-10/slack_logo-ebd02d1.svg",
                        article_id: expect.any(Number),
                        votes: 0,
                        created_at: expect.any(String),
                        comment_count: 0,
                    });
                });
            });
            test("201 - Article contains default image if one is not provided", () => {
                return request(app).post("/api/articles").send({
                    author: "butter_bridge",
                    title: "A new article, for YOU",
                    body: "Here is some contents",
                    topic: "cats"
                }).expect(201).then(({body}) => {
                    expect(body.article).toMatchObject({
                        author: "butter_bridge",
                        title: "A new article, for YOU",
                        body: "Here is some contents",
                        topic: "cats",
                        article_img_url: "https://avatars.slack-edge.com/2021-02-08/1724811773957_c6b24cf6ef8cfcca933a_102.png",
                        article_id: expect.any(Number),
                        votes: 0,
                        created_at: expect.any(String),
                        comment_count: 0,
                    });
                });
            });
            test("400 - Reject POST if object is missing parameters", () => {
                return request(app).post("/api/articles").send({
                    author: "butter_bridge",
                    title: "A new article, for YOU",
                    body: "Here is some contents",
                    article_img_url: "https://a.slack-edge.com/bv1-10/slack_logo-ebd02d1.svg"
                }).expect(400).then(({body}) => expect(body.msg).toBe("Request missing properties"));
            });
            test("404 - Reject POST if the topic cannot be found", () => {
                return request(app).post("/api/articles").send({
                    author: "butter_bridge",
                    title: "A new article, for YOU",
                    body: "Here is some contents",
                    topic: "dogs",
                    article_img_url: "https://a.slack-edge.com/bv1-10/slack_logo-ebd02d1.svg"
                }).expect(404).then(({body}) => expect(body.msg).toBe("Topic not found"));
            });
            test("404 - Reject POST if the user cannot be found", () => {
                return request(app).post("/api/articles").send({
                    author: "cheese_bridge",
                    title: "A new article, for YOU",
                    body: "Here is some contents",
                    topic: "cats",
                    article_img_url: "https://a.slack-edge.com/bv1-10/slack_logo-ebd02d1.svg"
                }).expect(404).then(({body}) => expect(body.msg).toBe("Author not found"));
            });
        });
    });
    describe("PATCH", () => {
        describe("PATCH /api/articles/:article_id", () => {
            test("200 - Return the altered object on a successful patch", () => {
                return request(app).patch("/api/articles/1")
                    .send({inc_votes: 1})
                    .expect(200)
                    .then(({body}) => {
                        expect(body.article).toMatchObject({
                            article_id: 1,
                            title: "Living in the shadow of a great man",
                            topic: "mitch",
                            author: "butter_bridge",
                            body: "I find this existence challenging",
                            created_at: "2020-07-09T20:11:00.000Z",
                            votes: 101,
                            article_img_url:
                                "https://images.pexels.com/photos/158651/news-newsletter-newspaper-information-158651.jpeg?w=700&h=700",
                        });
                    });
            });
            test("200 - Allow negative votes", () => {
                return request(app).patch("/api/articles/3")
                    .send({inc_votes: -30})
                    .expect(200)
                    .then(({body}) => {
                        expect(body.article).toHaveProperty(
                            "votes", -30);
                    });
            });
            test("Return 404 on article not found", () => {
                return request(app).patch("/api/articles/1000")
                    .send({inc_votes: 1})
                    .expect(404).then(({body}) => expect(body.msg).toBe("Article not found"));
            });
            test("Return 304 when no change has been made", () => {
                return request(app).patch("/api/articles/2")
                    .send({inc_votes: 0})
                    .expect(304);
            });
            test("200 - Ignore additional properties when patching", () => {
                return request(app).patch("/api/articles/2")
                    .send({inc_votes: 10, author: "anonymous"})
                    .expect(200).then(({body}) => {
                        expect(body.article).toMatchObject({
                            article_id: 2,
                            title: "Sony Vaio; or, The Laptop",
                            topic: "mitch",
                            author: "icellusedkars",
                            body: "Call me Mitchell. Some years ago—never mind how long precisely—having little or no money in my purse, and nothing particular to interest me on shore, I thought I would buy a laptop about a little and see the codey part of the world. It is a way I have of driving off the spleen and regulating the circulation. Whenever I find myself growing grim about the mouth; whenever it is a damp, drizzly November in my soul; whenever I find myself involuntarily pausing before coffin warehouses, and bringing up the rear of every funeral I meet; and especially whenever my hypos get such an upper hand of me, that it requires a strong moral principle to prevent me from deliberately stepping into the street, and methodically knocking people’s hats off—then, I account it high time to get to coding as soon as I can. This is my substitute for pistol and ball. With a philosophical flourish Cato throws himself upon his sword; I quietly take to the laptop. There is nothing surprising in this. If they but knew it, almost all men in their degree, some time or other, cherish very nearly the same feelings towards the the Vaio with me.",
                            created_at: "2020-10-16T05:03:00.000Z",
                            votes: 10,
                            article_img_url:
                                "https://images.pexels.com/photos/158651/news-newsletter-newspaper-information-158651.jpeg?w=700&h=700",
                        });
                    });
            });
            test("Return 304 when no properties are provided", () => {
                return request(app).patch("/api/articles/3")
                    .send({})
                    .expect(304);
            });
            test("Return 304 when no properties are provided that can be patched", () => {
                return request(app).patch("/api/articles/3")
                    .send({icon: "robot"})
                    .expect(304);
            });
            test("Return 400 when inc_votes has an invalid datatype", () => {
                return request(app).patch("/api/articles/3")
                    .send({inc_votes: "all of them"})
                    .expect(400).then(({body}) => expect(body.msg).toBe("Invalid inc_votes datatype"));
            });
        });
    });
});

describe("/api/comments", () => {
    describe("/api/comments/:comment_id", () => {
        describe("DELETE /api/comments/:comment_id", () => {
            test("return 204 status code on successful deletion", () => {
                return request(app).delete("/api/comments/1").expect(204);
            });
            test("return 404 status code when comment not found", () => {
                return request(app).delete("/api/comments/100000000").expect(404);
            });
            test("return 400 status code when passed an invalid comment id", () => {
                return request(app).delete("/api/comments/my_comment").expect(400);
            });
            test("selected comment is successfully deleted", () => {
                return request(app).delete("/api/comments/2").expect(204)
                    .then(() => {
                        return request(app).delete("/api/comments/2").expect(404);
                    });
            });
        });
        describe("PATCH /api/comments/:comment_id", () => {
            test("200 - Return the altered object on a successful patch", () => {
                return request(app).patch("/api/comments/1")
                    .send({inc_votes: 1})
                    .expect(200)
                    .then(({body}) => {
                        expect(body.comment).toMatchObject({
                            comment_id: 1,
                            body: "Oh, I've got compassion running out of my nose, pal! I'm the Sultan of Sentiment!",
                            votes: 17,
                            author: "butter_bridge",
                            article_id: 9,
                            created_at: "2020-04-06T12:17:00.000Z",
                        });
                    });
            });
            test("200 - Allow negative votes", () => {
                return request(app).patch("/api/comments/2")
                    .send({inc_votes: -30})
                    .expect(200)
                    .then(({body}) => {
                        expect(body.comment).toHaveProperty(
                            "votes", -16);
                    });
            });
            test("Return 404 on comment not found", () => {
                return request(app).patch("/api/comments/1000")
                    .send({inc_votes: 1})
                    .expect(404).then(({body}) => expect(body.msg).toBe("Comment not found"));
            });
            test("Return 304 when no change has been made", () => {
                return request(app).patch("/api/comments/3")
                    .send({inc_votes: 0})
                    .expect(304);
            });
            test("200 - Ignore additional properties when patching", () => {
                return request(app).patch("/api/comments/4")
                    .send({inc_votes: 10, reaction: "wink"})
                    .expect(200).then(({body}) => {
                        expect(body.comment).toMatchObject({
                            comment_id: 4,
                            body: " I carry a log — yes. Is it funny to you? It is not to me.",
                            votes: -90,
                            author: "icellusedkars",
                            article_id: 1,
                            created_at: "2020-02-23T12:01:00.000Z",
                        },);
                    });
            });
            test("Return 304 when no properties are provided", () => {
                return request(app).patch("/api/comments/5")
                    .send({})
                    .expect(304);
            });
            test("Return 304 when no properties are provided that can be patched", () => {
                return request(app).patch("/api/comments/6")
                    .send({react: "wave"})
                    .expect(304);
            });
            test("Return 400 when inc_votes has an invalid datatype", () => {
                return request(app).patch("/api/comments/7")
                    .send({inc_votes: "all of them"})
                    .expect(400).then(({body}) => expect(body.msg).toBe("Invalid inc_votes datatype"));
            });
        });
    });
});

describe("api/users", () => {
    describe("GET /api/users", () => {
        test("200 - return an array of users", () => {
            return request(app).get("/api/users").expect(200).then(({body}) => {
                expect(body.users.length).toBe(5);
                body.users.forEach((user) => {
                    expect(user).toMatchObject({
                        username: expect.any(String),
                        name: expect.any(String),
                        avatar_url: expect.any(String)
                    });
                });
            });
        });
    });
    describe("GET /api/users/:username", () => {
        test("200 - return a user object", () => {
            return request(app).get("/api/users/butter_bridge").then(({body}) => {
                expect(body.user).toMatchObject({
                    username: "butter_bridge",
                    avatar_url: expect.any(String),
                    name: expect.any(String)
                });
            });
        });
        test("return 404 if user not found", () => {
            return request(app).get("/api/users/howling_techie").expect(404);
        });
        test("return the correct user when provided with a username", () => {
            return request(app).get("/api/users/butter_bridge").then(({body}) => {
                const result = {
                    username: "butter_bridge",
                    name: "jonny",
                    avatar_url:
                        "https://www.healthytherapies.com/wp-content/uploads/2016/06/Lime3.jpg"
                };
                expect(body.user).toMatchObject(result);
            });
        });
    });
});

describe("api/user", () => {
    describe("POST /api/user/register", () => {
        test("Return 400 when no body is provided", () => {
            return request(app).post("/api/user/register")
                .send({})
                .expect(400);
        });
        test("Return 400 when no body is missing required properties", () => {
            return request(app).post("/api/user/register")
                .send({username: "newUser"})
                .expect(400);
        });
        test("Return 400 when the username is invalid", () => {
            return request(app).post("/api/user/register")
                .send({username: "A fancy new user!", name: "Display Name", password: "hunter2"})
                .expect(400)
                .then(({body}) => {
                    expect(body.msg).toBe("Invalid username");
                });
        });
        test("Return 400 when the password is invalid", () => {
            return request(app).post("/api/user/register")
                .send({username: "newUser", name: "Display Name", password: "short"})
                .expect(400)
                .then(({body}) => {
                    expect(body.msg).toBe("Invalid password");
                });
        });
        test("Return 400 when the display name is invalid", () => {
            return request(app).post("/api/user/register")
                .send({username: "newUser", name: " Display Name", password: "hunter2"})
                .expect(400)
                .then(({body}) => {
                    expect(body.msg).toBe("Invalid name");
                });
        });
        test("Return 403 when the user already exists", () => {
            return request(app).post("/api/user/register")
                .send({username: "butter_bridge", name: "another butter", password: "hunter2"})
                .expect(403);
        });
        test("Return 201 on success", () => {
            return request(app).post("/api/user/register")
                .send({username: "newUser", name: "Display Name", password: "hunter2"})
                .expect(201);
        });
        test("On success return a JWT access and refresh token", () => {
            return request(app).post("/api/user/register")
                .send({username: "anotherNewUser", name: "Another Display Name", password: "hunter2"})
                .expect(201)
                .then(({body}) => {
                    expect(body).toHaveProperty("token");
                    expect(body.token).toHaveProperty("accessToken");
                    expect(body.token).toHaveProperty("refreshToken");
                });
        });
    });
    describe("GET /api/user/signin", () => {
        test("Return 400 when no body is provided", () => {
            return request(app).get("/api/user/signin")
                .send({})
                .expect(400);
        });
        test("Return 400 when no body is missing required properties", () => {
            return request(app).get("/api/user/signin")
                .send({username: "newUser"})
                .expect(400);
        });
        test("Return 404 when the user does not exists", () => {
            return request(app).get("/api/user/signin")
                .send({username: "a_third_user", password: "hunter2"})
                .expect(404);
        });
        test("Return 401 when the password is wrong", () => {
            return request(app).get("/api/user/signin")
                .send({username: "securedUser", password: "hunter1"})
                .expect(401);
        });
        test("Return 200 on success", () => {
            return request(app).get("/api/user/signin")
                .send({username: "securedUser", password: "hunter2"})
                .expect(200);
        });
        test("On success return a user and JWT access and refresh token", () => {
            return request(app).get("/api/user/signin")
                .send({username: "securedUser", password: "hunter2"})
                .expect(200)
                .then(({body}) => {
                    expect(body).toHaveProperty("token");
                    expect(body.token).toHaveProperty("accessToken");
                    expect(body.token).toHaveProperty("refreshToken");
                    expect(body).toHaveProperty("user");
                    expect(body.user).toHaveProperty("username");
                    expect(body.user).toHaveProperty("name");
                    expect(body.user).toHaveProperty("avatar_url");
                });
        });
    });

    describe("GET /api/user", () => {
        test("Return 400 when no body is provided", () => {
            return request(app).get("/api/user")
                .send({})
                .expect(400);
        });
        test("Return 401 when passed an expired token", () => {
            const accessToken = generateToken({username: "securedUser", name: "i_have_a_password"}, "0s");
            return request(app).get("/api/user")
                .send({token: accessToken})
                .expect(401);
        });
        test("Return 401 when passed an invalid token", () => {
            const accessToken = generateToken({username: "ghosts", name: "i_don't_exist"});
            return request(app).get("/api/user")
                .send({token: accessToken})
                .expect(401);
        });
        test("Return 200 on success", () => {
            const accessToken = generateToken({username: "securedUser", name: "i_have_a_password"});
            return request(app).get("/api/user")
                .send({token: accessToken})
                .expect(200);
        });
        test("On success return a user object", () => {
            const accessToken = generateToken({username: "securedUser", name: "i_have_a_password"});
            return request(app).get("/api/user")
                .send({token: accessToken})
                .expect(200)
                .then(({body}) => {
                    expect(body).toHaveProperty("user");
                    expect(body.user).toHaveProperty("username");
                    expect(body.user).toHaveProperty("name");
                    expect(body.user).toHaveProperty("avatar_url");
                });
        });
    });
});