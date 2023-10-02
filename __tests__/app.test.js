const app = require("../app.js");
const request = require("supertest");
const db = require("../db/connection");
const testData = require("../db/data/test-data/index");
const seed = require("../db/seeds/seed");

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
      console.log(body.endpoints);
      expect("GET /api" in body.endpoints).toBeTruthy();
      expect("GET /api/topics" in body.endpoints).toBeTruthy();
      for (const endpointKey in body.endpoints) {
        expect(typeof body.endpoints[endpointKey].description).toBe("string");
      }
    });
  });
});

describe("GET /api/topics", () => {
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

describe("/api/articles", () => {
  describe("GET /api/articles", () => {
    test("return 200 status code", () => {
      return request(app).get("/api/articles").expect(200);
    });
    test("return an array of articles", () => {
      return request(app).get("/api/articles").then(({body}) => {
        expect(body.articles.length).toBe(13);
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
    test("return an array sorted by date descending", () => {
      return request(app).get("/api/articles").then(({body}) => {
        expect(body.articles).toBeSorted({key: "created_at", descending: true});
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
          article_img_url: expect.any(String)
        });
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
        };
        expect(body.article).toMatchObject(result);
      });
    });
  });
  describe("GET /api/articles/:article_id/comments", () => {
    test("return an array of comment objects", () => {
      return request(app).get("/api/articles/1/comments").expect(200).then(({body}) => {
        expect(body.comments.length).toBe(11);
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
        expect(body.comments.length).toBe(11);
        expect(body.comments).toBeSortedBy("created_at", {descending: true});
      });
    });
    test("return an empty array if the article exists but has no comments", () => {
      return request(app).get("/api/articles/2/comments").expect(200).then(({body}) => {
        expect(body.comments.length).toBe(0);
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
  });
});