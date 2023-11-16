const dotenv = require('dotenv');
const express = require('express');
const sqlite3 = require('sqlite3');
const fs = require('fs');
const cors = require('cors');
dotenv.config();

const app = express();

const corsOptions = {
    origin: 'http://localhost:8080', // Replace with your frontend's domain and port
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
};

app.use(cors(corsOptions));
app.use(express.json());

// SQLite database configuration
const db = new sqlite3.Database('database.db');

app.post('/getUsers', (req, res) => {
    // Query data from the "users" table
    db.all('SELECT * FROM users', (err, rows) => {
      if (err) {
        console.error('Error querying users:', err);
        res.status(500).send('Internal Server Error');
      } else {
        res.json(rows); // Send the result as JSON in the response
        console.log(rows)
      }
    });
  });

  app.post('/getTables', (req, res) => {
    // Query the names of all tables in the database
    db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
      if (err) {
        console.error('Error querying tables:', err);
        res.status(500).send('Internal Server Error');
      } else {
        const tableNames = tables.map(table => table.name);
        console.log(tableNames)
        res.json(tableNames); // Send the result as JSON in the response
      }
    });
  });

  app.post('/executeQuery', express.json(), (req, res) => {
    const { query } = req.body;
  
    if (!query) {
      return res.status(400).json({ error: 'Missing query parameter' });
    }
  
    // Execute the provided SQL query
    db.all(query, (err, result) => {
      if (err) {
        console.error('Error executing query:', err);
        return res.status(500).json({ error: 'Internal Server Error' });
      }
      console.log(result)
      res.json(result);
    });
  });
app.post('/api/save', (req, res) => {
    const { customData } = req.body;
    if (!customData) {
        console.log("Error b");
        return res.status(400).send("Data cannot be empty");
    }
    
    try{
       //
    }catch(err){
        console.log('drop')
        console.log(err)
    }

    try{
        populateDatabase(customData);
        
    res.sendStatus(200);
    }catch(err){
        console.log('insert')
        console.log(err)
        res.sendStatus(400).send('Error inserting data.')
    }

  
});
const populateDatabase = (data) => {

  
  Object.keys(data).forEach((tableName) => {
    const tableData = data[tableName];

    if (tableData.length > 0) {
      const firstRow = tableData[0];
      const columnDefinitions = Object.keys(firstRow)
        .map((columnName) => `${columnName} ${getType(firstRow[columnName])}`)
        .join(', ');

      // Create the table if it doesn't exist
      db.run(`CREATE TABLE IF NOT EXISTS ${tableName} (${columnDefinitions})`, (error) => {
        if (error) {
          console.error(`Error creating table ${tableName}:`, error);
        } else {
          // Prepare and run the INSERT statement to insert data into the table
          const keys = Object.keys(firstRow);
          const placeholders = keys.map(() => '?').join(', ');
          const insertStatement = `INSERT INTO ${tableName} (${keys.join(', ')}) VALUES (${placeholders})`;

          const stmt = db.prepare(insertStatement);
          tableData.forEach((row) => {
            const values = keys.map((key) => row[key]);
            stmt.run(values, (insertError) => {
              if (insertError) {
                console.error(`Error inserting data into ${tableName}:`, insertError);
              } else {
                console.log(`Data inserted into ${tableName} successfully`);
              }
            });
          });
          console.log('Finalized Statement:', insertStatement);
          stmt.finalize(); // Finalize the statement to release resources
        }
      });
    }
  });

}

// Function to infer SQLite data type based on JavaScript type
const getType = (value) => {
  if (typeof value === 'number') {
    return 'INTEGER';
  } else if (typeof value === 'string') {
    return 'TEXT';
  } else if (typeof value === 'boolean') {
    return 'BOOLEAN';
  } else {
    return 'TEXT'; // Default to TEXT for other types
  }
};

  
  const dropTables = (callback) => {
    db.serialize(() => {
      db.run('PRAGMA foreign_keys=off');
      db.run('BEGIN TRANSACTION');
  
      // Get a list of all tables in the database
      const tables = [];
      db.each("SELECT name FROM sqlite_master WHERE type='table'", (err, row) => {
        if (row.name !== 'sqlite_sequence') {
          tables.push(row.name);
        }
      }, () => {
        // Drop each table
        tables.forEach(table => {
          db.run(`DROP TABLE IF EXISTS ${table}`);
        });
  
        db.run('COMMIT');
        db.run('PRAGMA foreign_keys=on');
        
      });
    });
  };
  


const port = process.env.PORT || 3000;



app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
