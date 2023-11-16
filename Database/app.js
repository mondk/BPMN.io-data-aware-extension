import express from 'express'
import {getNames, getName, createName} from './database.js'
const app = express()

app.get("/names", async (req, res)=>{
    const names = await getNames()
    res.send(names)
})

app.listen(8080, () =>{
    console.log('Server is running on port 8080')
})

app.use(express.json())

app.post("/names", async (req, res)=>{
    const {full_names} = req.body
    const name = await createName(full_names)
    res.status(201).send(name)
})

app.use((err,req,res,next) =>{
    console.error(err.stack)
    res.status(500).send('Something broke!')
})