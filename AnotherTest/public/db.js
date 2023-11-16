import express  from 'express';
import bodyParser from 'body-parser';
import { createClient } from 'redis';
import cors from 'cors'
const app = express();
const port = 3000;
app.use(cors());
const client = createClient({
    
    password: 'vNlQpz6JoXE6NfuHnGdaGyko1fPy7geV',
    socket: {
        host: 'redis-11136.c304.europe-west1-2.gce.cloud.redislabs.com',
        port: 11136
    }
});

if(!client.isOpen){
    client.connect()
}
client.on('error', (err)=>console.log(err))

client.on('connect',()=>console.log('Connected to Redis database'))
// Middleware to parse JSON requests
app.use(bodyParser.json());

// Endpoint to handle initializing the Redis database
app.post('/initialize', async (req, res) => {
  const jsonData = req.body.data;

  try {
    const parsedData = JSON.parse(jsonData);
    
   
    // Assuming the JSON data is an object with a "users" property
    if (parsedData.users) {
      const u = parsedData.users
        for (let user of parsedData.users) {
            let userID = user.id;
            let record = []
            let nigger = u[i]
            for(let i in user){
                record.push({i,nigger})
            }
            let userEmail = user.email;
            console.log(userID);
            console.log(userEmail);
            console.log(record)
            const uniqueKey = `user-session:${userID}`;
            await client.set(uniqueKey, JSON.stringify(record));
        }

      

      res.json({ message: 'Database initialized successfully.' });
    } else {
      res.status(400).json({ message: 'Invalid JSON format. Expected "users" property.' });
    }
  } catch (error) {
    console.error('Error parsing JSON:', error);
    res.status(400).json({ message: 'Error parsing JSON.' });
  }
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
