const dotenv = require('dotenv')
const express = require('express');
const mysql = require("mysql2");
const cors = require('cors')
// const bodyParser = require('body-parser');
dotenv.config()
const app = express();


const corsOptions = {
    origin: 'http://localhost:8080', // Replace with your frontend's domain and port
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  };
  
  app.use(cors(corsOptions));
app.use(express.json());



let db;

app.post('/create-database-pool', (req, res) => {
  // Get the pool configuration details from the request body
  const { host, user, password, database } = req.body;

  // Create a new database pool using the provided details
  db = mysql.createConnection({
    host,
    user,
    password,
    database,
    connectionLimit: 10, // Adjust as needed
  });

  // Connect to the database
  db.connect((err) => {
    if (err) {
      console.error("Error connecting to the database:", err);
      return res.status(400).json({ message: 'Could not connect to database' });
    }

    console.log("Connected to MySQL database");
    return res.status(200).json({ message: 'Database connection created' });
  });
});

app.post('/database-metadata', (req, res) => {
  const sql = `
  SELECT 
    C.table_name, 
    C.column_name, 
    C.data_type, 
    C.column_key, 
    RC.referenced_table_name, 
    RC.referenced_column_name
  FROM 
    information_schema.columns C
  LEFT JOIN 
    information_schema.key_column_usage RC
  ON 
    C.table_name = RC.table_name 
    AND C.column_name = RC.column_name
  WHERE 
    C.table_schema = ?;
`;
  
  db.query(sql, [db.config.database], (err, results) => {
    if (err) {
      res.status(500).json({ error: 'Error retrieving database metadata' });
    } else {
      
      const metadata = {};

      results.forEach((row) => {
        const tableName = row.table_name;

        if (!metadata[tableName]) {
          metadata[tableName] = [];
        }

        metadata[tableName].push({
          column_name: row.column_name,
          data_type: row.data_type,
          column_key: row.column_key,
        });
      });

      // Send the metadata as a JSON response
      res.json({ metadata });
    }
  });
});



app.post('/api/save', (req, res) => {
    const {name} = req.body;
    if (!name) {
        console.log("Error")
        return res.status(400).send("Name cannot be empty");
    }
    const sql = "INSERT INTO names (full_name) VALUES (?)";
    db.query(sql, [name], (err, result) => {
        if (err) {
            console.error("Error saving name:", err);
            return res.status(400).send("Error saving name");
        }
        console.log("Name saved");
        res.sendStatus(200);
    });

});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
