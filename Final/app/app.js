import BpmnModeler from 'bpmn-js/lib/Modeler';

import { getBusinessObject } from 'bpmn-js/lib/util/ModelUtil';

import customModule from './custom';

import diagramXML from '../resources/newDiagram.bpmn';

import taPackage from '../ta.json';
import { evalPreCondition,executeEffects } from './parsers/effExuecute.js';
import data_store from '../resources/data-store.js'
import getAll from "./parsers/finalPreEff.js"

import { processVar,setPro } from './parsers/processVar.js';
import { db,setDb } from './parsers/db.js';

import parseExpression  from './parsers/parser.js'

// https://codesandbox.io/s/compassionate-marco-4qwvrj?file=/src/custom/CustomElementFactory.js

let col ;
let tables;

let isConnected = false
const containerEl = document.getElementById('container')
const containerE2 = document.getElementById('textContainer')
const connection = document.getElementById('connection')
const init = document.getElementById('init')
const process = document.getElementById('process-button')

const jsonData = document.getElementById('jsonData')

let con = true
function extractAttributesAndTables(jsonText) {
  const result = {
      attributeNames: [],
      tables: []
  };

  try {
      const jsonData = JSON.parse(jsonText);

      if (typeof jsonData === 'object') {
          for (const key in jsonData) {
              if (jsonData.hasOwnProperty(key) && Array.isArray(jsonData[key])) {
                  result.tables.push(key);

                  if (jsonData[key].length > 0 && typeof jsonData[key][0] === 'object') {
                      const attributes = Object.keys(jsonData[key][0]);
                      result.attributeNames.push(...attributes);
                  }
              }
          }
      }
  } catch (error) {
      console.error('Error parsing JSON:', error.message);
  }

  return result;
}
init.addEventListener('click',()=>{

   setDb(JSON.parse(jsonData.value))
   const res = extractAttributesAndTables(jsonData.value)
   col=res.attributeNames;
   tables=res.tables;
   console.log(db)
  if (!con){
  con = true
  const customDate = JSON.parse(jsonData.value)
  fetch('http://localhost:3000/api/save', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({ customData:customDate }),
})
.then(response => {
    if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
    }
    console.log(response.json())
    return response.json();
})
.then(data => {
    console.log('Name saved successfully:', data);
    // You can perform additional actions after saving the name
})
.catch(error => {
    console.error('Error saving name:', error);
});
  }
  else {
    const sqlQuery = `
    CREATE TABLE IF NOT EXISTS new_table (
      id INTEGER PRIMARY KEY,
      name TEXT,
      age INTEGER
    )
  ;
    INSERT INTO new_table (name, age) VALUES
    ('John Doe', 25),
    ('Jane Smith', 30),
    ('Alice Johnson', 22)
  `; // Replace with your SQL query

    // Make a POST request to execute the SQL query
    fetch('http://localhost:3000/executeQuery', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: sqlQuery }),
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
    })
    .catch(error => {
      console.error('Fetch error:', error);
    });
  }
  
})



document.addEventListener("DOMContentLoaded", function() {
  const variableInput = document.getElementById("variableInput");
  const processButton = document.getElementById("processButton");

  processButton.addEventListener("click", function() {
    const inputText = variableInput.value;
    const variables = inputText.split(";").map(variable => variable.trim());
    const tupleList = [];
    let hasError = false;

    for (const variable of variables) {
      const match = variable.match(/#(\w+):\s*(string|number|\w+)/);
      if (match) {
        const name = "#" + match[1];
        let value;
        if (Number.isInteger(parseInt(match[2]))) {
          value = parseInt(match[2]);
        } else {
          value = match[2];
        }
        tupleList.push([name, value]);
      } else {
        hasError = true;
        break;
      }
    }

    if (hasError) {
      // Handle the error here, for example, by highlighting the input field in red.
      variableInput.style.borderColor = "red";
      variableInput.style.borderWidth = "2px";
    } else {
      // If no error, remove the red highlight (if any).
      setPro(tupleList)
      variableInput.style.borderColor = "";
      variableInput.style.borderWidth = "";
    }
    console.log(processVar)
  });
});



process.addEventListener("click", function(){

  
  if (varpanel.classList.contains('hidden')){
    varpanel.classList.remove('hidden');
  }
  else {
    varpanel.classList.add('hidden');
  }
});


const databaseButton = document.getElementById('database-button')



databaseButton.addEventListener('click', function () {
   

    if (connection.classList.contains('hidden')){
      connection.classList.remove('hidden');
    }
    else if (!isConnected){
      connection.classList.add('hidden');
    }
    
    else{
      fetchDataAndOpenWindow();
    }
});
async function fetchDataAndOpenWindow() {
  try {
    const json = await fetchData(); // Wait for the data to be fetched
    const encodedData = encodeURIComponent(JSON.stringify(json));
    const newWindow = window.open('databaseInfo.html?data=' + encodedData, 'New Window', 'width=600, height=400');
  } catch (error) {
    console.error(error);
  }
}



async function fetchData() {
  try {
    const repo = await fetchDatabaseMetadata();
    return repo;
  } catch (error) {
    console.error(error);
  }
}


function fetchDatabaseMetadata() {
  // Make a fetch request to your server to retrieve database metadata
  return fetch('http://localhost:3000/database-metadata',{
    method: "POST",
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({name: 'niggrt'})
    
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error('Fetch request failed');
      }
      return response.json();
    });
}



// Hide the panel when clicking outside of it
window.addEventListener('click', (event) => {
  const { target } = event;

  if (!connection.contains(target) && target !== databaseButton ) {
    connection.classList.add('hidden');
    
  }
  if (!varpanel.contains(target) && target !== process) {
    varpanel.classList.add('hidden');
  }
 
});

let textFields =[]
import download from 'downloadjs';

// create modeler
const bpmnModeler = new BpmnModeler({
  container: containerEl,

  additionalModules: [customModule],

  moddleExtensions: {
    ta: taPackage
  }
  
});
const moddle = bpmnModeler.get('moddle'),
        modeling = bpmnModeler.get('modeling');

bpmnModeler.importXML(diagramXML, (err) => {
    if (err) {
      console.error(err);
    }
})



function updateQueryFieldById(elementId, text) {

  // Get the BPMN model element by its ID using the element registry
  const element = bpmnModeler.get('elementRegistry').get(elementId);

  // Check if the element exists, has a business object, and is of type 'ta:DataTask'
  if (element && element.businessObject && element.businessObject.$instanceOf('ta:DataTask')) {

    // Get the business object associated with the BPMN element
    const businessObject = getBusinessObject(element);

    // Retrieve or create the ExtensionElements element
    const extensionElements = businessObject.extensionElements || moddle.create('bpmn:ExtensionElements');

    // Retrieve or create the 'ta:DataTask' element within ExtensionElements
    let dataTask = getExtensionElement(element.businessObject, 'ta:DataTask');
    if (!dataTask) {
      dataTask = moddle.create('ta:DataTask');
      extensionElements.get('values').push(dataTask);
    }

    // Update the BPMN model element properties to include the 'query' text
    modeling.updateProperties(element, {
      extensionElements,
      query: text
    });
  }

  // Exit the function
  return;
}

function getExtensionElement(element, type) {
  if (!element.extensionElements) {
    return;
  }

  return element.extensionElements.values.filter((extensionElement) => {
    return extensionElement.$instanceOf(type);
  })[0];
}

// Function to download the BPMN diagram
 function downloadDiagram() {
 


  for(var i =0;i<textFields.length;i++){
    
     updateQueryFieldById(textFields[i].id, textFields[i].value);
  }
 

  // Save and download the BPMN diagram
  bpmnModeler.saveXML({ format: true }, function (err, xml) {
    if (!err) {
      download(xml, 'diagram.bpmn', 'application/xml');
    }
  });
}

var downloadButton = document.getElementById("download-button");

// Add a click event listener to the button
downloadButton.addEventListener("click", function() {
  // Your function code here
  
  downloadDiagram();
});

var overlays = bpmnModeler.get('overlays');
// import XML


// Attach event listener to handle element clicks
// Function to handle button clicks


// Function to create a new button
// Import the database functions from your database.js file



function createDropdown(param,db) {
  const dropdown = document.createElement('div');
  dropdown.className = 'dynamicDropdown';
  
  getAll(dropdown,col,tables,processVar,db)
  
  

  const submitButton = document.createElement('button');
  submitButton.textContent = 'Execute';

  submitButton.addEventListener('click', () => {
    console.log('power')
    console.log(dropdown.pre)
    console.log(dropdown.eff)
    let n = false
    if(dropdown.pre!=undefined&&dropdown.eff!=undefined){
      if(dropdown.pre.isPared&&dropdown.eff.isPared){
        n=  evalPreCondition(dropdown.pre.n,col)
        console.log('Precondition is: '+n)
        if(n){
          executeEffects(dropdown.eff.n)
        }
      }
    }

    


  });

  dropdown.appendChild(submitButton);

  

  return dropdown;
}

function createButton(func,param,db) {
  const button = document.createElement('button');


  const icon = document.createElement('i');
  icon.className = 'fa-solid fa-caret-down';
  button.appendChild(icon);
  button.className = 'dynamicButton';

  let dropdown =null;
  if(param==null){
    dropdown = func();
  }
  else {
    dropdown = func(param,db)
  }

  dropdown.style.visibility = 'hidden';
  dropdown.style.pointerEvents = 'none';
  button.appendChild(dropdown);
  dropdown.addEventListener('click', (event) => {
    event.stopPropagation();
  });
  
  button.addEventListener('click', () => {
    if (dropdown.style.visibility === 'hidden') {
      dropdown.style.visibility = 'visible';
      dropdown.style.pointerEvents = 'auto';
      icon.style.transform='rotate(180deg)';
    } else {
      dropdown.style.visibility = 'hidden';
      dropdown.style.pointerEvents = 'none';
      icon.style.transform='rotate(0deg)';
    }
  });

  return button;
}

function createCondition(){
  const cond = document.createElement('div')
  const textarea = document.createElement('textarea');textarea.placeholder='Write condition e.g. #var !=5';textarea.style.width='178px';textarea.style.height='60px';
  textarea.position='relative';textarea.stopPropagation
  const evaluate = document.createElement('button'); evaluate.textContent='Evaluate condition'
  evaluate.addEventListener("click", function(){
    alert(parseExpression(textarea.value,processVar,col))
  })

  cond.appendChild(textarea);cond.appendChild(evaluate);
  return cond;
}

bpmnModeler.get('eventBus').on('shape.added', (event) => {
  const shape = event.element;

  /*
  if(shape.businessObject && shape.businessObject.$instanceOf('bpmn:ExclusiveGateway')) {

   
    let cond = createButton(createCondition)
    overlays.add(shape.id, 'note', {
      position: {
        bottom: 5,
        right: 67
      },
      show: {
        minZoom: 0.7
      },
      html: cond 
    });
  }
  */
  
  // Check if the shape is a BPMN element (excluding labels)
  if (shape.businessObject && shape.businessObject.$instanceOf('ta:DataTask')) {
    
    
    const button = createButton(createDropdown,shape.id,db);
   
    document.getElementById('buttonContainer').appendChild(button);

    // Use a unique event name based on the shape's ID
    const eventName = `buttonPressed:${shape.id}`;

    // Add an event listener to the button to trigger the custom event
    button.addEventListener('click', () => {
      bpmnModeler.get('eventBus').fire(eventName);
    });

   

    overlays.add(shape.id, 'note', {
      position: {
        bottom: 5,
        right: 67
      },
      show: {
        minZoom: 0.7
      },
      html: button 
    });

    overlays.add(shape.id,"note", {
      position:{
        bottom: 75,
        right:95
      },
      show:{
        minZoom: 0.7
      },
      html: data_store
    });
  }


  //alert('Must initalize database before creating datatask.')
});



bpmnModeler.get('eventBus').on('element.changed', (event) => {
  const element = event.element;

  if (/.*data$/.test(element.id)) {
    // Add the button
    let cond = createButton(createCondition);
    cond.id = element.id + 'cond';
    overlays.add(element.id, 'note', {
      position: {
        bottom: 6,
        right: 67,
      },
      show: {
        minZoom: 0.7,
      },
      html: cond,
    });
  } else if (/^sid.*/.test(element.id)) {
    // Remove the button
    const buttonId = element.id + 'datacond';
    const button = document.getElementById(buttonId);

    if (button) {
      button.remove();
    }
  }
});
