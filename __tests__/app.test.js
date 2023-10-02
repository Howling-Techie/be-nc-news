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
        });
      });
    });
    test("return an array of articles with the comment count", () => {
      return request(app).get("/api/articles").then(({body}) => {
        expect(body.articles[0].comment_count).toBe(11);
        expect(body.articles[1].comment_count).toBe(0);
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
});