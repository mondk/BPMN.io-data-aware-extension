import { processVar ,setPro} from "./processVar";
import parseExpression from "./parser";
import { db } from "./db";
const popup = document.getElementById('popup');
const form = document.getElementById('variableForm');
const variableFields = document.getElementById('variableForm');


let evalPre;
let updatedPlaceholder =[]
export function evalPreCondition(pre,col){
    evalPre=false;
    console.log('in')
    const updatedPre = processVar.reduce((acc, [varName, varValue]) => {
        const regex = new RegExp(varName, 'g');
        return acc.replace(regex, varValue);
    }, pre);
    console.log(updatedPre)

    if(updatedPre.includes('SELECT')){

        queryDatabase(updatedPre)

    }

    else{
        try{
            let n = parseExpression(updatedPre,processVar,col)
            console.log(n)
            evalPre=n;
        }catch(Err){
        console.error(Err)
        }
    }

    return evalPre;
}

export async function executeEffects(eff){
    console.log(eff)
    const placeholderList =[]

    const regex = /@(\w+)/g;

    let match;
    let effects;
    while ((match = regex.exec(eff)) !== null) {
    // match[0] contains the full match, match[1] contains the captured variable
    placeholderList .push('@'+match[1]);
    }
    if(placeholderList!=[]){
        console.log('Found variables:', placeholderList);  
        console.log('Simulation paused.')
       
        await openPopup(placeholderList).then((userInput) => {
            console.log('User Input:', userInput);
            updatedPlaceholder=userInput
        });
       effects = replaceVariables(placeholderList,updatedPlaceholder,eff).split(';')
    }
    else{
        effects=eff.split(';')
    }
    

    

    for(let effect of effects){

        if(effect.trim()[0]=='#'){
           
            let newPro = updateVariableValue(processVar,effect)
            console.log(newPro)
            setPro(newPro)
        }
        else{

        if(effect.includes('INSERT')){
        const regex = /(FROM|INTO)\s+(.+)/i;
        let tableName = effect.match(regex)[2]
        console.log(db[tableName.trim()])
        const firstRow = db[tableName.trim()][0];
        const columnDefinitions = Object.keys(firstRow)
            .map((columnName) => `${columnName}`)
            .join(', ');
        
        let t = transformInsertString(tableName,effect,columnDefinitions.split(','));
        console.log(t)
        queryDatabase(t)
        }
        else{
            const regex = /(FROM|INTO)\s+(.+)/i;
            let tableName = effect.match(regex)[2]
            console.log(db[tableName.trim()])
            const firstRow = db[tableName.trim()][0];
            const columnDefinitions = Object.keys(firstRow)
                .map((columnName) => `${columnName}`)
                .join(', ');
            
            let t = transformDeleteString(tableName,effect,columnDefinitions.split(','));
            console.log(t)
            queryDatabase(t)
        }
        }

    }




}

function replaceVariables(variables, values, text) {
    let currentIndex = 0;

    const replacedText = text.replace(/@(\w+)/g, (_, variableName) => {
        const variableIndex = variables.indexOf(`@${variableName}`);
        if (variableIndex !== -1) {
            const value = values[currentIndex];
            currentIndex++;
            return value;
        }
        // If the variable is not found, leave it unchanged
        return `@${variableName}`;
    });
    console.log(replacedText)
    return replacedText;
}
function transformDeleteString(tableName, deleteString, columns) {
    // Extract values from the deleteString using regex
    const valuesMatch = deleteString.match(/\((.*?)\)/);

    if (!valuesMatch || valuesMatch.length < 2) {
        throw new Error('Invalid DELETE string format');
    }

    const values = valuesMatch[1].split(',');

    for (let i = 0; i < values.length; i++) {
        let j = values[i];

        if (isNaN(j)) {
            if (j[0] == '#') {
                values[i] = processVar.find(item => item[0] === j)[1];
            } else if (j == 'false' || j == 'true') {
                // Handle boolean values if needed
            } else {
                values[i] = "'" + values[i] + "'";
            }
        }
    }

    // Build the SQL DELETE statement with a WHERE clause
    if (columns.length !== values.length) {
        throw new Error('Number of columns and values do not match');
    }

    const whereConditions = columns.map((col, index) => `${col.trim()} = ${values[index]}`).join(' AND ');
    const sqlDelete = `DELETE FROM ${tableName} WHERE ${whereConditions};`;

    return sqlDelete;
}
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

  function updateVariableValue(processVar, inputString) {
    // Extract the variable identifier and new value from the input string
    const match = inputString.match(/#(\w+)=(\w+)/);

    if (match) {
        const variableIdentifier = match[1];
        const newValue = match[2];

        // Update the value in the processVar list
        const updatedProcessVar = processVar.map(item => {
            if (item[0] === `#${variableIdentifier}`) {
                return [`#${variableIdentifier}`, newValue];
            }
            return item;
        });

        return updatedProcessVar;
    } else {
        throw new Error('Invalid input string format.');
    }
}

function queryDatabase(query){
    fetch('http://localhost:3000/executeQuery', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: query }),
      })
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json(); // Parse the JSON in the response
      })
      .then(data => {
        console.log('Query Result:', data);
        // Handle the retrieved data as needed (e.g., update the UI)
        if(!(data==[])){
            evalPre=true
        }
      })
      .catch(error => {
        console.error('Fetch error:', error);
      });
}

function openPopup(variables) {
    return new Promise((resolve) => {
        // Clear previous content of the form and variableFields
        form.innerHTML = '';
        variableFields.innerHTML = '';
        console.log(variables)
        // Create text fields for each variable
        variables.forEach((variable) => {
            const input = document.createElement('input');
            input.type = 'text';
            input.placeholder = variable;
            input.value = variable;

            variableFields.appendChild(input);
        });

        // Show the popup
        popup.style.display = 'flex';

        // Resolve the promise when the user clicks "Continue"
        document.getElementById('continue').onclick = () => {
            resolve(getUserInput());
            closePopup();
        };
    });
}

function getUserInput() {
    return Array.from(form.elements).map((input) => input.value);
}

function closePopup() {
    // Hide the popup
    popup.style.display = 'none';
}