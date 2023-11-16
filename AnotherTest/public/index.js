import getAll from "./finalPreEff.js"
import parseExpression from './parser.js'

const col = ['*','id','username','email','age','isActive']
const tables = ['users']
const processVar = [['#status1',0],['#status2','incomplete'],['#var',45]]
const container = document.getElementById('container')
const button = document.getElementById('create')
const init = document.getElementById('Initialize')
const sim = document.getElementById('sim')


sim.addEventListener('click',function(){
    console.log(container.pre)
    console.log(container.eff)

    const jsonData = document.getElementById('jsonData').value
    let db = JSON.parse(jsonData)

    const firstRow = db['users'][0];
    const columnDefinitions = Object.keys(firstRow)
        .map((columnName) => `${columnName}`)
        .join(', ');
    console.log(columnDefinitions)
  console.log(transformInsertString('users',container.eff.n,columnDefinitions.split(',')))
})

function transformInsertString(tableName,insertString, columns) {
  // Extract values from the insertString using regex
  console.log(insertString)
  console.log(columns)
  const valuesMatch = insertString.match(/\((.*?)\)/);
  
  if (!valuesMatch || valuesMatch.length < 2) {
    throw new Error('Invalid INSERT string format');
  }

  const values = valuesMatch[1].split(',');
  console.log(values)
  for(let i =0;i< values.length;i++){
    let j = values[i]
    if(isNaN(j)){
      if(j[0]=='#'){
        values[i]=processVar.find(item => item[0] === j)[1];
      }
      else if(j[0]=='@'){
        console.log('Placeholder')
      }
      else if (j=='false'||j=='true'){}

      else{
        values[i]="'"+values[i]+"'"
      }
      
    }
  }
  console.log(values)
  // Build the SQL INSERT statement
  const sqlInsert = `INSERT INTO ${tableName} (${columns}) VALUES (${values.join(', ')});`;

  return sqlInsert;
}

init.addEventListener('click',function(){
    const jsonData = document.getElementById('jsonData').value;

    try {
        
        database = JSON.parse(jsonData);
        db.insert(jsonData)
        db.find({ "users.username": "john_doe" }, (err, docs) => {
            if (err) {
              console.error(err);
              return;
            }
          
            console.log("Query result:");
            console.log(docs);
          });
      
      } catch (error) {
        console.error('Error initializing database:', error);
        // You can handle the error as needed, e.g., log an error or display an error message
      }
})

button.addEventListener('click', function(){
    console.log(processVar)
    const jsonData = document.getElementById('jsonData').value
    let db = JSON.parse(jsonData)

    console.log(db['users'])
  
    getAll(container,col,tables,processVar,db)
})
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

function queryData(tableName, selectAttributes, condition) {
    if (!database[tableName]) {
      throw new Error(`Table ${tableName} not found.`);
    }
  
    return database[tableName]
      .filter(row => {
        // Apply the condition for filtering
        // You might need to customize this based on the type of condition you want to support
        return eval(condition); // Using eval for simplicity; use caution with user-input conditions
      })
      .map(row => {
        // Project the selected attributes
        const resultRow = {};
        selectAttributes.forEach(attr => {
          resultRow[attr] = row[attr];
        });
        return resultRow;
      });
  }