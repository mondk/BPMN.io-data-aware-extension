import mysql from 'mysql2';
import dotenv from 'dotenv'
dotenv.config()
// https://www.youtube.com/watch?v=Hej48pi_lOc
// Check enviroment variables, instead of hardcodeing variables
const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE
}).promise()

async function getNames(){
const result = await pool.query("select * from names")

return result[0]
}

// prepered statement
async function getName(id){
    const [result] = await pool.query('select * from names where id =?',[id])
    return result[0]
}

async function createName(name){
    const result = await pool.query('insert into names (full_name) values (?)',name)
    return result
}


export { getNames, getName, createName };