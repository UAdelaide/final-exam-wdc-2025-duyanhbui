var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var mysql = require('mysql2/promise');

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

let db;

async function insertTestData() {
  try {
    const [existingUsers] = await db.execute('SELECT COUNT(*) AS count FROM Users');
    if (existingUsers[0].count > 0) return;


    await db.execute(`
      INSERT INTO Users (username, email, password_hash, role) VALUES
      ('alice123', 'alice@example.com', 'hashed123', 'owner'),
      ('bobwalker', 'bob@example.com', 'hashed456', 'walker'),
      ('carol123', 'carol@example.com', 'hashed789', 'owner'),
      ('davidwalker', 'david@example.com', 'hashed111', 'walker'),
      ('eveowner', 'eve@example.com', 'hashed222', 'owner')
    `);


    const [users] = await db.execute('SELECT user_id, username FROM Users');
    const userMap = {};

    for (let i = 0; i < users.length; i++) {
      userMap[users[i].username] = users[i].user_id;
    }

    // Insert dogs
    await db.execute(`
      INSERT INTO Dogs (owner_id, name, size) VALUES
      (?, 'Max', 'medium'),
      (?, 'Bella', 'small'),
      (?, 'Charlie', 'large'),
      (?, 'Luna', 'medium'),
      (?, 'Rocky', 'large')
    `, [userMap['alice123'], userMap['carol123'], userMap['alice123'], userMap['eveowner'], userMap['carol123']]);


    const [dogs] = await db.execute('SELECT dog_id, name, owner_id FROM Dogs');
    const dogMap = {};
    for (let i = 0; i < dogs.length; i++) {
      dogMap[`${dogs[i].name}_${dogs[i].owner_id}`] = dogs[i].dog_id;
    }


    await db.execute(`
      INSERT INTO WalkRequests (dog_id, requested_time, duration_minutes, location, status) VALUES
      (?, '2025-06-10 08:00:00', 30, 'Parklands', 'open'),
      (?, '2025-06-10 09:30:00', 45, 'Beachside Ave', 'accepted'),
      (?, '2025-06-11 07:00:00', 60, 'Central Park', 'open'),
      (?, '2025-06-11 14:00:00', 30, 'Riverside Walk', 'completed'),
      (?, '2025-06-12 10:00:00', 45, 'Mountain Trail', 'open')
    `, [

      dogMap[`Max_${userMap['alice123']}`],
      dogMap[`Bella_${userMap['carol123']}`],
      dogMap[`Charlie_${userMap['alice123']}`],
      dogMap[`Luna_${userMap['eveowner']}`],
      dogMap[`Rocky_${userMap['carol123']}`]
    ]);


    console.log('Test data inserted successfully');

  } catch (err) {

    console.error('Error inserting test data:', err);

  }

}


(async () => {
  try {
    // Now connect to the created database
    db = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'DogWalkService'
    });


    // Insert test data
    await insertTestData();

  } catch (err) {
    console.error('Error setting up database. Ensure Mysql is running: service mysql start', err);
  }
})();




// QUESTION 6: /api/dogs route
// GET all dogs
app.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT dog_id, name, size, owner_id
      FROM Dogs
      ORDER BY dog_id
    `);
    res.json(rows);
  } catch (error) {
    console.error('SQL Error:', error);
    res.status(500).json({ error: 'Failed to fetch dogs' });
  }
});


// QUESTION 7: /api/walkrequests/open route
app.get('/api/walkrequests/open', async (req, res) => {

  try {
    const [results] = await db.execute(`
      SELECT
        wr.request_id,
        d.name AS dog_name,
        wr.requested_time,
        wr.duration_minutes,
        wr.location,
        u.username AS owner_username
      FROM WalkRequests wr
      JOIN Dogs d ON wr.dog_id = d.dog_id
      JOIN Users u ON d.owner_id = u.user_id
      WHERE wr.status = 'open'
      ORDER BY wr.requested_time
    `);

    res.json(results);
  } catch (err) {
    console.error('Error fetching open walk requests:', err);
    res.status(500).json({ error: 'Failed to fetch open walk requests' });

  }

});


app.get('/api/walkers/summary', async (req, res) => {
  try {
    const [results] = await db.execute(`
      SELECT
        u.username AS walker_username,
        COUNT(DISTINCT r.rating_id) AS total_ratings,
        COALESCE(AVG(r.rating), 0) AS average_rating,
        COUNT(DISTINCT CASE WHEN wr.status = 'completed' THEN wr.request_id END) AS completed_walks
      FROM Users u
      LEFT JOIN WalkApplications wa ON u.user_id = wa.walker_id AND wa.status = 'accepted'
      LEFT JOIN WalkRequests wr ON wa.request_id = wr.request_id
      LEFT JOIN WalkRatings r ON wr.request_id = r.request_id AND u.user_id = r.walker_id
      WHERE u.role = 'walker'
      GROUP BY u.user_id, u.username
      ORDER BY u.username
    `);



    res.json(results);

  } catch (err) {

    console.error('Error fetching walker summary:', err);

    res.status(500).json({ error: 'Failed to fetch walker summary' });

  }

});
app.use(express.static(path.join(__dirname, 'public')));

module.exports = app;
