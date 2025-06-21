INSERT INTO Users (username, email, password_hash, role) VALUES
('alice123', 'alice@example.com', 'hashed123', 'owner'),
('bobwalker', 'bob@example.com', 'hashed456', 'walker'),
('carol123', 'carol@example.com', 'hashed789', 'owner'),
('davidwalker', 'david@example.com', 'hashed111', 'walker'),
('eveowner', 'eve@example.com', 'hashed222', 'owner');


INSERT INTO Dogs (owner_id, name, size) VALUES
((SELECT user_id FROM Users WHERE username = 'alice123'), 'Max', 'medium'),
((SELECT user_id FROM Users WHERE username = 'carol123'), 'Bella', 'small'),
((SELECT user_id FROM Users WHERE username = 'alice123'), 'Charlie', 'large'),
((SELECT user_id FROM Users WHERE username = 'eveowner'), 'Luna', 'medium'),
((SELECT user_id FROM Users WHERE username = 'carol123'), 'Rocky', 'large');

INSERT INTO WalkRequests (dog_id, requested_time, duration_minutes, location, status) VALUES
((SELECT dog_id FROM Dogs WHERE name = 'Max' AND owner_id = (SELECT user_id FROM Users WHERE username = 'alice123')),
 '2025-06-10 08:00:00', 30, 'Parklands', 'open'),
((SELECT dog_id FROM Dogs WHERE name = 'Bella' AND owner_id = (SELECT user_id FROM Users WHERE username = 'carol123')),
 '2025-06-10 09:30:00', 45, 'Beachside Ave', 'accepted'),
((SELECT dog_id FROM Dogs WHERE name = 'Charlie' AND owner_id = (SELECT user_id FROM Users WHERE username = 'alice123')),
 '2025-06-11 07:00:00', 60, 'Central Park', 'open'),
((SELECT dog_id FROM Dogs WHERE name = 'Luna' AND owner_id = (SELECT user_id FROM Users WHERE username = 'eveowner')),
 '2025-06-11 14:00:00', 30, 'Riverside Walk', 'completed'),
((SELECT dog_id FROM Dogs WHERE name = 'Rocky' AND owner_id = (SELECT user_id FROM Users WHERE username = 'carol123')),
 '2025-06-12 10:00:00', 45, 'Mountain Trail', 'open');

UPDATE WalkRequests
SET status = 'accepted'
WHERE dog_id = (SELECT dog_id FROM Dogs WHERE name = 'Bella' AND owner_id = (SELECT user_id FROM Users WHERE username = 'carol123'))
AND requested_time = '2025-06-10 09:30:00';

INSERT INTO WalkApplications (request_id, walker_id, status) VALUES
((SELECT request_id FROM WalkRequests WHERE dog_id = (SELECT dog_id FROM Dogs WHERE name = 'Bella') AND requested_time = '2025-06-10 09:30:00'),
 (SELECT user_id FROM Users WHERE username = 'bobwalker'), 'accepted');

INSERT INTO WalkApplications (request_id, walker_id, status) VALUES
((SELECT request_id FROM WalkRequests WHERE dog_id = (SELECT dog_id FROM Dogs WHERE name = 'Max') AND requested_time = '2025-06-10 08:00:00'),
 (SELECT user_id FROM Users WHERE username = 'bobwalker'), 'pending'),
((SELECT request_id FROM WalkRequests WHERE dog_id = (SELECT dog_id FROM Dogs WHERE name = 'Max') AND requested_time = '2025-06-10 08:00:00'),
 (SELECT user_id FROM Users WHERE username = 'davidwalker'), 'pending');