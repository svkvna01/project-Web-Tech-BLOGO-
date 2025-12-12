<<<<<<< HEAD
const db = require('./db.js'); // Import MYSQL pool

// Add a trip to database
async function addTrip(username, title, description, budget) {
    const sql = "INSERT INTO trips (username, title, description, budget) VALUES (?, ?, ?, ?)";
    await db.query(sql, [username, title, description, budget]);
}

// Add trip with location to database
=======
const db = require('./db.js');

async function addTrip(username, title, description, budget) {
    const sql = "INSERT INTO trips (username, title, description, budget) VALUES (?, ?, ?, ?)";
    const [result] = await db.query(sql, [username, title, description, budget]);
    return result.insertId;
}

>>>>>>> origin/main
async function addTripLocation(tripId, country, city, date, activity, order) {
    const sql = `
        INSERT INTO trip_locations (trip_id, country, city, date, activity, order_index)
        VALUES (?, ?, ?, ?, ?, ?)
    `;
    await db.query(sql, [tripId, country, city, date, activity, order]);
}

<<<<<<< HEAD
// Get trips where the user is the owner or a participant
async function getTripsForUser(username) {
=======
async function getTripsForUser(username) {
    // Get trips where the user is the owner or a participant
>>>>>>> origin/main
    const [trips] = await db.query(`
        SELECT DISTINCT t.*
        FROM trips t
        LEFT JOIN trip_participants tp ON t.id = tp.trip_id
        WHERE t.username = ? OR tp.username = ?
    `, [username, username]);

<<<<<<< HEAD
    for (const trip of trips) {
        const [locations] = await db.query(       // Get locations
=======
    // For each trip, get locations and participants
    for (const trip of trips) {
        // Get locations
        const [locations] = await db.query(
>>>>>>> origin/main
            "SELECT * FROM trip_locations WHERE trip_id = ? ORDER BY order_index",
            [trip.id]
        );
        trip.locations = locations;

<<<<<<< HEAD
        const [participants] = await db.query(    // Get participants
=======
        // Get participants
        const [participants] = await db.query(
>>>>>>> origin/main
            `SELECT tp.*, u.firstName, u.lastName 
             FROM trip_participants tp 
             JOIN users u ON tp.username = u.username 
             WHERE tp.trip_id = ?`,
            [trip.id]
        );
        trip.participants = participants;
    }
<<<<<<< HEAD
    return trips;
}

// Edit an existing trip 
async function editTrip(tripId, username, title, description, budget, locations, participants) {
    const conn = await db.getConnection();
    await conn.beginTransaction();

    const [rows] = await conn.query(
        'SELECT username FROM trips WHERE id = ?', // If user part of trip
        [tripId]
    );

    const owner = rows[0].username;

    const [participantRows] = await conn.query(
        'SELECT username FROM trip_participants WHERE trip_id = ? AND username = ?',  // Check if user is owner or participant
        [tripId, username]
    );
    if (username !== owner && participantRows.length === 0) {
        throw new Error('Not authorized');
    }

    await conn.query(
        'UPDATE trips SET title = ?, description = ?, budget = ? WHERE id = ?', // Update title, description and budget
        [title, description, budget, tripId]
    );

    await conn.query('DELETE FROM trip_locations WHERE trip_id = ?', [tripId]); // Delete existing locations 
    for (let i = 0; i < locations.length; i++) {
        const loc = locations[i];
        const dateValue = loc.date && loc.date.trim() !== '' ? loc.date : null;

        const visited = loc.visited || false;

        await conn.query(
            'INSERT INTO trip_locations (trip_id, country, city, date, activity, order_index, visited) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [tripId, loc.country, loc.city, dateValue, loc.activity, i, visited] // add new locations
        );
    }

    if (username === owner) {
        await conn.query('DELETE FROM trip_participants WHERE trip_id = ?', [tripId]); // Only owner can modify participants

        await conn.query(
            'INSERT INTO trip_participants (trip_id, username, role) VALUES (?, ?, ?)', // re-add owner (else error of duplicates)
            [tripId, username, 'owner']
        );

        if (participants && participants.length > 0) {
            for (const participant of participants) {
                if (participant === username) continue;
                await conn.query(
                    'INSERT INTO trip_participants (trip_id, username, role) VALUES (?, ?, ?)', // Add new participants
                    [tripId, participant, 'editor']
                );
            }
        }
    }

    await conn.commit();
    return true;

}

// Delete an existing trip
async function deleteTrip(id, username) {
    const sql = "DELETE FROM trips WHERE id = ? AND username = ?";
    await db.query(sql, [id, username]);
}

// Update change of usernames
=======

    return trips;
}

async function editTrip(tripId, username, title, description, budget, locations, participants) {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        // 1️⃣ Check if the user is part of the trip
        const [rows] = await conn.query(
            'SELECT username FROM trips WHERE id = ?',
            [tripId]
        );
        if (rows.length === 0) throw new Error('Trip not found');

        const owner = rows[0].username;

        // Check if user is owner or participant
        const [participantRows] = await conn.query(
            'SELECT username FROM trip_participants WHERE trip_id = ? AND username = ?',
            [tripId, username]
        );
        if (username !== owner && participantRows.length === 0) {
            throw new Error('Not authorized');
        }

        // 2️⃣ Update trip title, description & budget
        await conn.query(
            'UPDATE trips SET title = ?, description = ?, budget = ? WHERE id = ?',
            [title, description, budget, tripId]
        );

        // 3️⃣ Delete existing locations and add new ones
        await conn.query('DELETE FROM trip_locations WHERE trip_id = ?', [tripId]);
        for (let i = 0; i < locations.length; i++) {
            const loc = locations[i];
            const dateValue = loc.date && loc.date.trim() !== '' ? loc.date : null;

            const visited = loc.visited || false;

            await conn.query(
                'INSERT INTO trip_locations (trip_id, country, city, date, activity, order_index, visited) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [tripId, loc.country, loc.city, dateValue, loc.activity, i, visited]
            );
        }

        // 4️⃣ Only allow owner to update participants
        if (username === owner) {
            await conn.query('DELETE FROM trip_participants WHERE trip_id = ?', [tripId]);

            // Re-add owner
            await conn.query(
                'INSERT INTO trip_participants (trip_id, username, role) VALUES (?, ?, ?)',
                [tripId, username, 'owner']
            );

            // Add new participants
            if (participants && participants.length > 0) {
                for (const participant of participants) {
                    if (participant === username) continue;
                    await conn.query(
                        'INSERT INTO trip_participants (trip_id, username, role) VALUES (?, ?, ?)',
                        [tripId, participant, 'editor']
                    );
                }
            }
        }

        await conn.commit();
        return true;

    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
}



async function deleteTrip(id, username) {
    const sql = "DELETE FROM trips WHERE id = ? AND username = ?";
    const [result] = await db.query(sql, [id, username]);
    return result.affectedRows === 1;
}

>>>>>>> origin/main
async function renameTripsUser(oldUsername, newUsername) {
    const sql = "UPDATE trips SET username = ? WHERE username = ?";
    await db.query(sql, [newUsername, oldUsername]);
}

<<<<<<< HEAD
// Create collaborative trip (= with other participants)
async function createCollaborativeTrip(username, title, description, budget, locations, participants) {
    const conn = await db.getConnection();
    await conn.beginTransaction();

    // Create main trip
    const [result] = await conn.query(
        'INSERT INTO trips (username, title, description, budget) VALUES (?, ?, ?, ?)',
        [username, title, description, budget]
    );
    const tripId = result.insertId;

    // Add owner as participant
    await conn.query(
        'INSERT INTO trip_participants (trip_id, username, role) VALUES (?, ?, ?)',
        [tripId, username, 'owner']
    );

    // Add other participants
    if (participants && Array.isArray(participants) && participants.length > 0) {
        for (const participant of participants) {
            await conn.query(
                'INSERT INTO trip_participants (trip_id, username, role) VALUES (?, ?, ?)',
                [tripId, participant, 'editor']
            );
        }
    }
    // Add locations
    for (let i = 0; i < locations.length; i++) {
        const dateValue = locations[i].date && locations[i].date.trim() !== '' // empty date string => null
            ? locations[i].date
            : null;

        const visited = locations[i].visited || false;

        await conn.query(
            'INSERT INTO trip_locations (trip_id, country, city, date, activity, order_index, visited) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [tripId, locations[i].country, locations[i].city, dateValue, locations[i].activity, i, visited]
        );
    }
    await conn.commit();
    return tripId;
=======
// Create collaborative trip
async function createCollaborativeTrip(username, title, description, budget, locations, participants) {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        
        console.log('=== CREATE COLLABORATIVE TRIP ===');
        console.log('Username:', username);
        console.log('Participants array:', participants);
        console.log('Participants length:', participants?.length);
        
        // Create main trip
        const [result] = await conn.query(
            'INSERT INTO trips (username, title, description, budget) VALUES (?, ?, ?, ?)',
            [username, title, description, budget]
        );
        const tripId = result.insertId;
        console.log('Trip created with ID:', tripId);
        
        // Add owner as participant
        await conn.query(
            'INSERT INTO trip_participants (trip_id, username, role) VALUES (?, ?, ?)',
            [tripId, username, 'owner']
        );
        console.log('✅ Owner added as participant');
        
        // Add other participants
        if (participants && Array.isArray(participants) && participants.length > 0) {
            console.log(`Adding ${participants.length} participants...`);
            for (const participant of participants) {
                console.log('Adding participant:', participant);
                await conn.query(
                    'INSERT INTO trip_participants (trip_id, username, role) VALUES (?, ?, ?)',
                    [tripId, participant, 'editor']
                );
                console.log('✅ Added:', participant);
            }
        } else {
            console.log('⚠️ No participants to add');
        }
        
        // Add locations
        console.log(`Adding ${locations.length} locations...`);
        for (let i = 0; i < locations.length; i++) {
            // ✅ Convert empty date string to null
            const dateValue = locations[i].date && locations[i].date.trim() !== '' 
                ? locations[i].date 
                : null;

            const visited = locations[i].visited || false;
            
            await conn.query(
                'INSERT INTO trip_locations (trip_id, country, city, date, activity, order_index, visited) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [tripId, locations[i].country, locations[i].city, dateValue, locations[i].activity, i, visited]
            );
        }
        console.log('✅ All locations added');
        
        await conn.commit();
        console.log('✅ Transaction committed');
        console.log('================================');
        return tripId;
    } catch (err) {
        await conn.rollback();
        console.error('❌ Error in createCollaborativeTrip:', err);
        throw err;
    } finally {
        conn.release();
    }
>>>>>>> origin/main
}

// Get trip with locations and participants
async function getTripDetails(tripId) {
    const [trips] = await db.query('SELECT * FROM trips WHERE id = ?', [tripId]);
    if (trips.length === 0) return null;

    const trip = trips[0];

    // Get locations
    const [locations] = await db.query(
        'SELECT * FROM trip_locations WHERE trip_id = ? ORDER BY order_index',
        [tripId]
    );

    // Get participants
    const [participants] = await db.query(
        'SELECT tp.*, u.firstName, u.lastName FROM trip_participants tp JOIN users u ON tp.username = u.username WHERE tp.trip_id = ?',
        [tripId]
    );

    trip.locations = locations;
    trip.participants = participants;

    return trip;
}

// Add chat message
async function addTripMessage(tripId, username, message) {
    await db.query(
        'INSERT INTO trip_messages (trip_id, username, message) VALUES (?, ?, ?)',
        [tripId, username, message]
    );
}

// Get chat messages
async function getTripMessages(tripId) {
    const [messages] = await db.query(
        'SELECT tm.*, u.firstName, u.lastName FROM trip_messages tm JOIN users u ON tm.username = u.username WHERE tm.trip_id = ? ORDER BY tm.created_at ASC',
        [tripId]
    );
    return messages;
}

<<<<<<< HEAD
// Export functions
=======
>>>>>>> origin/main
module.exports = {
    addTrip,
    addTripLocation,
    getTripsForUser,
    editTrip,
    deleteTrip,
    renameTripsUser,
    createCollaborativeTrip,
    getTripDetails,
    addTripMessage,
    getTripMessages
};
