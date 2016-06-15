-- create the role/user
CREATE ROLE greasebot;
ALTER ROLE greasebot WITH LOGIN PASSWORD 'greasy' NOSUPERUSER NOCREATEDB NOCREATEROLE;

-- create the database and assign permissions
CREATE DATABASE greasedb OWNER greasebot;
REVOKE ALL ON DATABASE greasedb FROM public;
GRANT CONNECT ON DATABASE greasedb TO greasebot;
GRANT ALL ON DATABASE greasedb TO greasebot;

-- connect
\c greasedb

-- create the table(s) and assign permissions
CREATE TABLE IF NOT EXISTS oauth (
    id              varchar(255) PRIMARY KEY,
    access_token    varchar(255) NOT NULL,
    refresh_token   varchar(255) NOT NULL
);
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO greasebot;
