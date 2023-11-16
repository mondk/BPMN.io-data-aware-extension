const express = require("express");
const mysql = require("mysql2");
const bodyParser = require("body-parser");

const app = express();



app.use(express.json())


// MySQL database configuration
const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "BBJ23xp",
    database: "test"
});

// Connect to the database
db.connect(err => {
    if (err) {
        console.error("Error connecting to the database:", err);
        return;
    }
    console.log("Connected to MySQL database");
});

// Serve static files from the "public" directory
app.use(express.static("public"));

// Handle POST request to save a note
app.post("/save", (req, res) => {
    const { name } = req.body;
    console.log(name)
    if (!name) {
        console.log("Error")
        return res.status(400).send("Note cannot be empty");
    }

    const sql = "INSERT INTO names (full_name) VALUES (?)";
    db.query(sql, [name], (err, result) => {
        if (err) {
            console.error("Error saving note:", err);
            return res.status(400).send("Error saving note");
        }
        console.log("Note saved");
        res.sendStatus(200);
    });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
