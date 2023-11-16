import BpmnModeler from 'bpmn-js/lib/Modeler';

import { getBusinessObject } from 'bpmn-js/lib/util/ModelUtil';

import customModule from './custom';

import diagramXML from '../resources/newDiagram.bpmn';

import taPackage from '../ta.json';

import data_store from '../resources/data-store.js'
// https://codesandbox.io/s/compassionate-marco-4qwvrj?file=/src/custom/CustomElementFactory.js

const HIGH_PRIORITY = 1500;

const containerEl = document.getElementById('container')
const containerE2 = document.getElementById('textContainer')

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



function createDropdown(param) {
  const dropdown = document.createElement('div');
  dropdown.className = 'dynamicDropdown';


  
  const textInput = document.createElement('input');
  textInput.type = 'text';
  textInput.placeholder = 'Enter query';
  textInput.id=param;
  containerE2.appendChild(textInput);
 
  textInput.addEventListener('keydown', (event) => {
    if (event.keyCode === 32) {
      event.preventDefault();
      textInput.value+=' ';
    }
  });
  textFields.push(textInput);
  alert(textFields[0].id)
  const submitButton = document.createElement('button');
  submitButton.textContent = 'Submit';

  submitButton.addEventListener('click', () => {
    const enteredQuery = textInput.value;

    if (enteredQuery.trim() !== '') {
      
       
        fetch("http://localhost:3000/api/save",{
          method: "POST",
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({name: enteredQuery})
          
        }).then(res =>{
          if (res.ok) {
            alert('Query executed successfully');
            textInput.value=''
          }
          else {
            alert('Query could not be executed');
          }
        }).catch(err =>{
          console.log("Error: ",err)
        })

        
      } 
     else {
      alert('Please enter a query.');
    }
  });


  dropdown.appendChild(textInput);
  dropdown.appendChild(submitButton);

  return dropdown;
}

function createButton(param) {
  const button = document.createElement('button');


  const icon = document.createElement('i');
  icon.className = 'fa-solid fa-caret-down';
  button.appendChild(icon);
  button.className = 'dynamicButton';
  const dropdown = createDropdown(param);
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



bpmnModeler.get('eventBus').on('shape.added', (event) => {
  const shape = event.element;

  // Check if the shape is a BPMN element (excluding labels)
  if (shape.businessObject && shape.businessObject.$instanceOf('ta:DataTask')) {
    const button = createButton(shape.id);
    alert(shape.id);
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
});

