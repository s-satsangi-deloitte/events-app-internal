DROP DATABASE IF EXISTS events_db;
CREATE DATABASE events_db;

USE events_db;

CREATE TABLE events(
   id INT NOT NULL AUTO_INCREMENT,
   title VARCHAR(255) NOT NULL,
   description TEXT NOT NULL,
   location VARCHAR(255) NOT NULL,
   likes INT DEFAULT 0,
   datetime_added TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
   PRIMARY KEY ( id )
);

CREATE TABLE comments(
id INT NOT NULL AUTO_INCREMENT,
comment VARCHAR(255),
fk_event_id INT FOREIGN KEY REFERENCES events( id ),
datetime_added TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
PRIMARY KEY ( id )
);

SHOW TABLES;

INSERT INTO events (title, description, location) VALUES ('Pet Show', 'Super-fun with furry friends!', 'Dog Park');

INSERT INTO events (title,  description, location) VALUES ('Company Picnic', 'Come for free food and drinks.', 'At the lake');

INSERT INTO comments ( comment, fk_event_id ) VALUES ( 'They kicked me out for bringing my pet Bear.', 1)

INSERT INTO comments ( comment, fk_event_id ) VALUES ( 'They tricked me with free food and then made me work :(', 2)

SELECT * FROM events;