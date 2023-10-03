# Northcoders News API

### [Live demo](https://nc-news-8ccb.onrender.com/api)

## About

This is the result of a week long solo project to demonstrate my abilities to create a versatile and sturdy API for a
database.
The database itself is a Postgres database, which the API interacts with through a Javascript backend.

## How to set up

1. Clone or download the repository
2. For testing or development, ensure you have Postgres installed
3. Use either NPM or Yarn to install all dependencies
4. Run `setup-dbs` to create the required database
5. Run `seed` to insert all the initial data into the created databases.
6. `test` will run a series of functions that will test all endpoints to ensure they are functioning as intended.

## Environment setup

### .env.development

```
PGDATABASE=[path_to_nc_news_db]
```

### .env.test

```
PGDATABASE=[path_to_nc_news_test_db]
```

### .env.production

```
DATABASE_URL=[url_to_nc_news_db]
```

## Requirements

| Module | Version |
|--------|---------|
| node   | ^20.5.1 |
| pg     | ^8.7.3  |