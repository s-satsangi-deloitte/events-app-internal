// Going to connect to MySQL database
const mariadb = require('mariadb');

const HOST = process.env.DBHOST ? process.env.DBHOST : "localhost";
const USER = process.env.DBUSER ? process.env.DBUSER : "events_user";
const PASSWORD = process.env.DBPASSWORD ? process.env.DBPASSWORD : "letmein!";
const DATABASE = process.env.DBDATABASE ? process.env.DBDATABASE : "events_db";

async function getConnection(db) {
    try {
        return await db.createConnection(
            {
                host: HOST,
                user: USER,
                password: PASSWORD,
                database: DATABASE
            });
    }
    catch (err) {
        // uncomment this line to help see why connection is failing.
        // console.log(err);
        return Promise.resolve(null);
    }

}

// mock events data - Once deployed the data will come from database
const mockEvents = {
    events: [
        { id: 1, title: 'a mock event', description: 'something really cool', location: 'Chez Joe Pizza', likes: 0, datetime_added: '2022-02-01:12:00', comments: [] },
        { id: 2, title: 'another mock event', description: 'something even cooler', location: 'Chez John Pizza', likes: 0, datetime_added: '2022-02-01:12:00', comments: [] },
    ]
};

const dbEvents = { events: [], comments: [] };

async function getEvents(db = mariadb) {
    const conn = await getConnection(db);
    if (conn) {
        const sql = 'SELECT ev.id ev_id, ev.title ev_title, ev.description ev_description, ev.location ev_location, ev.likes ev_likes, ev.datetime_added ev_datetime_added, comm.comment comm_comment FROM comments comm INNER JOIN events ev ON comm.fk_event_id = ev.id;';
        return conn.query(sql)
            .then(rows => {
                console.log(rows);
                dbEvents.events = [];
                eventsMap = {};
                rows.forEach((row) => {
                    if (row.ev_id in eventsMap) {
                        const ev = {
                            title: row.ev_title,
                            description: row.ev_description,
                            location: row.ev_location,
                            id: row.ev_id,
                            likes: row.ev_likes,
                            datetime_added: row.ev_datetime_added,
                            comments: [row.comm_comment]
                        };
                        dbEvents.events.push(ev);
                        eventsMap[row.ev_id] = ev
                    }
                    else {
                        eventsMap[row.ev_id].comments.push(row.comm_comment);
                    }
                });
                conn.end();
                return dbEvents;
            })
            .catch(err => {
                //handle query error
                console.log(err);
                if (conn && conn.destroy) {
                    conn.destroy();
                }
                return mockEvents;
            });
    }
    else {
        return mockEvents;
    }

};

async function addEvent(req, db = mariadb) {
    // create a new object from the json data and add an id
    const ev = {
        title: req.body.title,
        description: req.body.description,
        location: req.body.location,
        id: mockEvents.events.length + 1,
        likes: 0,
        datetime_added: new Date().toUTCString()
    }
    const sql = 'INSERT INTO events (title, description, location) VALUES (?,?,?);';
    const values = [ev.title, ev.description, ev.location];
    const conn = await getConnection(db);
    if (conn) {
        conn.query(sql, values)
            .then(() => {
                conn.end();
                return {};
            })
            .catch(err => {
                console.log(err);
                mockEvents.events.push(ev);
                if (conn && conn.destroy) {
                    conn.destroy();
                }
                return {};
            });
    }
    else {
        mockEvents.events.push(ev);
        return {};
    }
};

async function addComment(req, db = mariadb) {
    // create a new object from the json data and add an id
    const comment = {
        comment: req.body.comment,
        fk_event_id: req.body.eventId,
        datetime_added: new Date().toUTCString()                
    }     
    const sql = 'INSERT INTO comments (comment, fk_event_id) VALUES (?,?);';
    const values = [comment.comment, comment.fk_event_id];
    const conn = await getConnection(db);
    if (conn) {
        conn.query(sql, values)
            .then(() => {
                conn.end();
                return {};
            })
            .catch(err => {
                console.log(err);
                mockEvents.events.filter(ev => ev.id === req.body.eventId)[0].comments.push(req.body.comment);
                if (conn && conn.destroy) {
                    conn.destroy();
                }
                return {};
            });
    }
    else {
        mockEvents.events.filter(ev => ev.id === req.body.eventId)[0].comments.push(req.body.comment);
        return {};
    }
}

function cleanUpLike(err, conn, id, increment) {
    console.log(err);
    const objIndex = mockEvents.events.findIndex((obj => obj.id == id));
    let likes = mockEvents.events[objIndex].likes;
    if (increment) {
        mockEvents.events[objIndex].likes = ++likes;
    }
    else if (likes > 0) {
        mockEvents.events[objIndex].likes = --likes;
    }
    if (conn && conn.destroy) {
        conn.destroy();
    }
    return {};
}

// function used by both like and unlike. If increment = true, a like is added.
// If increment is false, a like is removed.
async function changeLikes(id, increment, db = mariadb) {
    const get_likes_sql = `SELECT likes from events WHERE id = ?;`
    const update_sql = `UPDATE events SET likes = ? WHERE id = ?`;
    const conn = await getConnection(db);
    if (conn) {
        conn.query(get_likes_sql, id)
            .then((rows) => {
                let total = rows[0].likes;
                if (increment) {
                    total++;
                }
                else if (total > 0) {
                    total--;
                }
                conn.query(update_sql, [total, id])
                    .then(() => {
                        if (increment) {
                            console.log("Like added");
                        }
                        else {
                            console.log("Like removed");
                        }
                    });
                conn.end();
                return {};
            })
            .catch(err => {
                return cleanUpLike(err, conn, id, increment);
            });

    }
    else {
        return cleanUpLike("no connection", conn, id, increment);
    }

}

async function addLike(id) {
    console.log("adding like to = " + id);
    return changeLikes(id, true);
};

async function removeLike(id) {
    console.log("removing like from = " + id);
    return changeLikes(id, false);
};


const eventRepository = function () {

    return {
        getEvents: getEvents,
        addEvent: addEvent,
        addComment: addComment,
        addLike: addLike,
        removeLike: removeLike
    };
}();

module.exports = eventRepository;