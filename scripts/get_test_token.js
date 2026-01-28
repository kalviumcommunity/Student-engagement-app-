const sqlite3 = require('sqlite3').verbose();
const { v4: uuidv4 } = require('uuid');

const db = new sqlite3.Database('./dev.db');

db.serialize(() => {
    const mentorId = uuidv4();
    const mentorEmail = 'mentor@school.com';

    db.get("SELECT id FROM User WHERE email = ?", [mentorEmail], (err, row) => {
        if (err) {
            console.error(err.message);
            return;
        }
        if (row) {
            console.log(`MENTOR_ID=${row.id}`);
        } else {
            const now = new Date().toISOString();
            const stmt = db.prepare("INSERT INTO User (id, name, email, password, role, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)");
            stmt.run(mentorId, 'Mr. Stark', mentorEmail, 'hashed_password_123', 'MENTOR', now, now, function (err) {
                if (err) {
                    console.error(err.message);
                    return;
                }
                console.log(`MENTOR_ID=${mentorId}`);
            });
            stmt.finalize();
        }
    });
});

db.close();
