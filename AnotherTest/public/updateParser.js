
const expr = document.getElementById('sqlExpression')
const button = document.getElementById('parse')
const output = document.getElementById('output2')

const col = ['a1','a2','a3','b1','b2']
const tables = ['table1','table2', 'table3']
const processVar = [['#status1','complete'],['#status2','incomplete'],['#var',45]]

expr.addEventListener('input' ,function(){
  clearErrors()
  if(output.errorArray!=null){
    output.errorArray=[]
  }
  output.textContent=''
    validateUpdate(expr.value)
});

function validateUpdate(update){
    

    const updatePattern = /UPDATE\s+([^]+?)\s+SET/i;
    const setPattern = /SET\s+([^]+?)(?:\s+WHERE|$)/i;
    const wherePattern = /WHERE\s*(.*)/i;


    const updateMatch = updatePattern.exec(update)
    const setMatch = setPattern.exec(update)
    const whereMatch = wherePattern.exec(update)

    if(!updateMatch || !setMatch ){
        throwError('Syntax Error', 'Mispelled or missing either UPDATE, SET.');
        
    }

    if (updateMatch[1].includes(" ") || /\W/.test(updateMatch[1])) {
      throwError('UPDATE ERROR',"Invalid table name. Table name should not contain spaces or special characters and only ONE table per UPDATE");
    }else{
      if(!tables.includes(updateMatch[1])){
        throwError('UPDATE ERROR', 'Invalid table name, does not exist in database.')
      }
    }



    console.log(updateMatch[1])
    console.log(setMatch[1])

    
    const asignList = setMatch[1].split(',')
    const variableList = []
    for(let i of asignList){
      const as = i.split('=')
      variableList.push(as[1])
    }
    console.log('varlist')
    console.log(variableList)
   
    for(let i of variableList){
      if(i.trim()==''){
        throwError('ASING ERROR', 'Missing value.')
      }
    }

    
    if(whereMatch) {

      if (whereMatch[1]==''){
        throwError('FILTER ERROR','Missing filter.')
      }
      else if(whereMatch[1].includes('CASE')){
        let placeholderPromise = true
        try{
        const n = parseCase(whereMatch[1])
        console.log(n)
        

        
        }catch(Err){
          throwError('CASE ERROR', Err)
        placeholderPromise = false
          
        }

        if(placeholderPromise){
          const n = parseCase(whereMatch[1])
        try{
          let o = parseAssignments(n.elseClause.trim(),variableList.concat(processVar))
          console.log(o)
          placeholderPromise = areAllItemsInListAInListB(variableList,o)
         
          
        }catch(Err){
          throwError('ASIGN ERROR',Err)
        }
        console.log(placeholderPromise)
        for(let i of n.whenThenPairs){
          parseFilter(i.condition)
          console.log(i.condition)
          try{
            let o = parseAssignments(i.result.trim(),variableList.concat(processVar))
            console.log(o)
            if(placeholderPromise){
              placeholderPromise = areAllItemsInListAInListB(variableList,o)
            }
          }catch(Err){
            throwError('ASIGN ERROR',Err)
          }
        }
        console.log(placeholderPromise)
        if(!placeholderPromise){
          throwError('PROMISE ERROR','There exists cases where a placeholder variable is not asigned.')
          
        }

      }
    }
      
      else {
        parseFilter(whereMatch[1])
      }
    
    }

    const setClause = setMatch[1];

    const updateAttributes = setClause.split(',');

  const validUpdateAttributes = updateAttributes.map(attr => {
  const parts = attr.trim().split('=');

  if (parts.length !== 2) {
    throwError('Invalid attribute format',' Use tablename.attribute = value.');
  }

  const attributeName = parts[0].trim();
  const attributeValue = parts[1].trim();

  if(!(/^[#@]?[^!@#$%^&*()_ +{}\[\]:;<>,.?~\\\-/]*$/.test(attributeValue))){
    throwError('Value ERROR', 'Attribute value cannot contain a special char, expert when defining process var or placeholder var.')
  }


  const [table, attribute] = attributeName.split('.');
  
  if (table !== updateMatch[1]) {
    throwError('ATTRIBUTE ERROR',`Table name in the assignment does not match the table being updated.`);
  }

  if (!attribute.match(/^\w+$/)) {
    throwError('SYNTAX ERROR',`Invalid attribute format: ${attribute}. Use 'attribute' format.`);
  }

  if (!isNaN(attributeValue)) {
    return { attribute, value: parseFloat(attributeValue) };
  } else {
    return { attribute, value: attributeValue };
  }
});

console.log(validUpdateAttributes)
if(output.textContent==''){
  clearErrors()
  output.textContent='Parsed.'
}
}
function areAllItemsInListAInListB(listA, listB) {
  for (const itemA of listA) {
    if (!listB.includes(itemA)) {
      return false; // Found an item in list A that is not in list B
    }
  }
  return true; // All items in list A are in list B
}
function parseAssignments(expr, variableList) {
  const assignments = expr.split(',');
  const parsedAssignments = [];

  for (const assignment of assignments) {
    const parts = assignment.split('=');

    if (parts.length !== 2) {
      throw new Error('Invalid expression. It should be in the format: variable=assignment');
    }

    const [variable, assignmentValue] = parts;
    variable=variable.trim()
    if (variableList.includes(variable)) {
      if ((/^#/.test(variable) && !variable.startsWith('#')) || (/^@/.test(variable) && !variable.startsWith('@'))) {
        throw new Error('Value ERROR: Variable type mismatch');
      }

      // Add the variable and its assignment to the result
      parsedAssignments.push( variable);
    } else {
      throw new Error('Value ERROR: Variable is not in the list of allowed variables');
    }
  }

  return parsedAssignments;
}


function parseCase(sqlQuery) {
  console.log(sqlQuery)
  const caseStartIndex = sqlQuery.indexOf('CASE');
  if (caseStartIndex === -1) {
    throw new Error("No CASE expression found in the SQL query.");
  }

  const caseEndIndex = sqlQuery.indexOf('END', caseStartIndex);

  if (caseEndIndex === -1) {
    throw new Error("No END found for the CASE expression.")
  }

  const caseExpression = sqlQuery.slice(caseStartIndex, caseEndIndex + 3); // +3 to include "END"

  // Split the CASE expression into WHEN-THEN conditions and the ELSE clause
  const whenThenAndElse = caseExpression.slice(4, -3); // Remove "CASE" and "END"

  const whenThenClauses = whenThenAndElse.split('ELSE')[0].trim();
  const elseClause = whenThenAndElse.split('ELSE')[1].trim();

  // Split the WHEN-THEN clauses
  const whenThenPairs = whenThenClauses.split('WHEN').slice(1).map(pair => {
    const [condition, result] = pair.split('THEN');
    return { condition: condition.trim(), result: result.trim() };
  });

  return {
    whenThenPairs: whenThenPairs,
    elseClause: elseClause
  };
}


function throwError(errorType, errorMessage) {
    clearErrors()
    highlightError();
    if (!output.errorArray) {
      output.errorArray = [];
    }
  
    const error = `${errorType}: ${errorMessage}`;
  
    if (!output.errorArray.includes(error)) {
      output.errorArray.push(error);
      output.textContent = output.errorArray.join(' ');
      
    }
  }
  function clearErrors() {
    expr.classList.remove('error');
    output.textContent = '';
    // You can also clear any other error-specific styles here.
  }
  function highlightError() {
    expr.classList.add('error');
  }

  
  
  function splitExpression(expression) {
    return  expression.split(/\b(AND|OR)\b/).map(token => token.trim());
    
  }

function parseFilter(expression) {
    const tokens = splitExpression(expression)
    console.log(tokens)
    const andOr = ['AND', 'OR']

    if(tokens.includes('')) {
        throwError('Syntax Error', 'fliter cannot begin or end with logical operator')
        return null;
    }

    for(let token of tokens){

        if(andOr.includes(token)) continue;
        if(isCondition(token)){
            console.log('cond')
            try{
                let n = parseExpression(token,processVar)
                console.log(n)
            }catch(Err){
                throwError('Condition Error',Err)
            }
        }
        else if(isTuple(token)){
            console.log('Tupple')
        }
        else{
            throwError('Syntax Error', 'Invalid filter')
        }
    }
    

  }
  
  function isCondition(inputString) {
    const legalOperators = ["<", "<=", ">", ">=", "==", "!=", "=", "+", "-", "*", "/", "&&", "||", "!"];
const operatorRegex = new RegExp(legalOperators.map(op => `\\${op}`).join('|'));
const operators = inputString.match(operatorRegex);

  return (operators !== null && operators.length > 0)&&!(/\bTUPLE\b/i.test(inputString)||inputString.includes('IN')||inputString.includes('NOT')||inputString.includes('SELECT')||inputString.includes('FROM')||inputString.includes('WHERE'));
}
  
  function isTuple(expression) {
    console.log(expression)
    const tupleMatch = expression.match(/TUPLE\(([^)]+)\)\s+(IN|NOT IN)\s+([^]+)/);
    if(tupleMatch==null) {
    throwError('Syntax Error',"Invalid TUPLE expression");
    return false;
    }
    if (tupleMatch) {
      // Extract the components of the TUPLE expression
      const attributes = tupleMatch[1].split(',');
      const operator = tupleMatch[2];
      const relation = tupleMatch[3];
      console.log('tup')
      console.log(attributes)
      console.log(operator)
      console.log(relation)
      if(!tables.includes(relation)){
        throwError('TABLE ERROR','The table '+relation+' does not exist in database.')
        
      }
     return true;
    } else {
      throwError('Syntax Error',"Invalid TUPLE expression.");
    }
  }

function parseExpression(expr,processVar) {
  let legalOp = [
    "<", "<=", ">", ">=", "==", "!=", "=", "+", "-", "*", "/", "&&", "||", "!"
  ];

  // Define regular expression patterns
  let numPattern = /\d+(\.\d+)?/; // Match numbers, including decimals
  let opPattern = new RegExp(`(?:${legalOp.map(escapeRegExp).join('|')})`);
  let stringPattern = /([A-Za-z0-9_]+)/;

  // Add parentheses around subexpressions enclosed in parentheses
  expr = addParenthesesAroundSubexpressions(expr);

  let tokens = tokenize(expr);
  console.log('tokes')
  console.log(tokens)
 
  for(let j =0;j<tokens.length;j++){
    let token = tokens[j];
    if(token.includes("#")){
      
      let exists = false;
      for(let i =0;i<processVar.length;i++){
        let tuple = processVar[i];
       
          if(tuple[0]==token){
            exists=true;
            tokens[j]=tuple[1];

          }
      }
      if(!exists){
        throw new Error("Process variable does not exists.");
      }
    }
  }

  // Helper function to check if a token is a logical operator or NOT operator
  function isLogicalOperator(token) {
    return ["&&", "||", "!"].includes(token);
  }

  // Helper function to check if an operator is a logical "and" or "or" operator or NOT operator
  function isLogicalAndOrNotOperator(operator) {
    return operator === "&&" || operator === "||" || operator === "!";
  }

  // Helper function to check if an operator is a unary operator
  function isUnaryOperator(operator) {
    return operator === "!";
  }

  // Helper function to check if an operator has higher precedence
  function hasHigherPrecedence(op1, op2) {
    let precedence = {
      "!": 1,
      "||": 2,
      "&&": 3,
      "==": 4,
      "!=": 4,
      "<": 5,
      "<=": 5,
      ">": 5,
      ">=": 5,
      "+": 6,
      "-": 6,
      "*": 7,
      "/": 7,
    };
    return precedence[op1] >= precedence[op2];
  }

  // Evaluate the boolean expression using a stack
  let valueStack = [];
  let operatorStack = [];

  for (let token of tokens) {
    console.log(token)
    if (numPattern.test(token)) {
      valueStack.push(parseFloat(token));
    } else if (stringPattern.test(token)) {
      
      // For simplicity, treat variables as undefined
      valueStack.push(token);
    } else if (opPattern.test(token)) {
      if (token === "(") {
        operatorStack.push(token);
      } else if (token === ")") {
        while (operatorStack.length > 0 && operatorStack[operatorStack.length - 1] !== "(") {
          let operator = operatorStack.pop();
          let operand2 = valueStack.pop();
          let operand1 = valueStack.pop();
          if(operand1==undefined){
            throw new Error('Missing right term.')
          }
          if(operand2==undefined){
            throw new Error('Missing left term.')
          }
          if (isLogicalOperator(operator)) {
            // Evaluate the logical expression
            switch (operator) {
              case "&&":
                valueStack.push(operand1 && operand2);
                break;
              case "||":
                valueStack.push(operand1 || operand2);
                break;
              case "!":
                valueStack.push(!operand2);
                break;
            }
          } else {
            // Evaluate other operators
            switch (operator) {
              case "+":
                valueStack.push(operand1 + operand2);
                break;
              case "-":
                valueStack.push(operand1 - operand2);
                break;
              case "*":
                valueStack.push(operand1 * operand2);
                break;
              case "/":
                valueStack.push(operand1 / operand2);
                break;
              case "<":
                valueStack.push(operand1 < operand2);
                break;
              case "<=":
                valueStack.push(operand1 <= operand2);
                break;
              case ">":
                valueStack.push(operand1 > operand2);
                break;
              case ">=":
                valueStack.push(operand1 >= operand2);
                break;
              case "==":
                valueStack.push(operand1 === operand2);
                break;
              case "!=":
                valueStack.push(operand1 !== operand2);
                break;
            }
          }
        }
        // Pop the open parenthesis "("
        operatorStack.pop();
      } else {
        while (
          operatorStack.length > 0 &&
          !isLogicalAndOrNotOperator(token) &&
          hasHigherPrecedence(operatorStack[operatorStack.length - 1], token)
        ) {
          let operator = operatorStack.pop();
          let operand2 = valueStack.pop();
          let operand1 = valueStack.pop();
          if(operand1==undefined){
            throw new Error('Missing right term.')
          }
          if(operand2==undefined){
            throw new Error('Missing left term.')
          }
          if (isLogicalOperator(operator)) {
            // Evaluate the logical expression
            switch (operator) {
              case "&&":
                valueStack.push(operand1 && operand2);
                break;
              case "||":
                valueStack.push(operand1 || operand2);
                break;
              case "!":
                valueStack.push(!operand2);
                break;
            }
          } else {
            // Evaluate other operators
            switch (operator) {
              case "+":
                valueStack.push(operand1 + operand2);
                break;
              case "-":
                valueStack.push(operand1 - operand2);
                break;
              case "*":
                valueStack.push(operand1 * operand2);
                break;
              case "/":
                valueStack.push(operand1 / operand2);
                break;
              case "<":
                valueStack.push(operand1 < operand2);
                break;
              case "<=":
                valueStack.push(operand1 <= operand2);
                break;
              case ">":
                valueStack.push(operand1 > operand2);
                break;
              case ">=":
                valueStack.push(operand1 >= operand2);
                break;
              case "==":
                valueStack.push(operand1 === operand2);
                break;
              case "!=":
                valueStack.push(operand1 !== operand2);
                break;
            }
          }
        }
        operatorStack.push(token);
      }
    } else if (stringPattern.test(token)) {
      // Handle string literals starting with '#'
      valueStack.push(token);
    }
  
  }

  if(operatorStack.length==0){
    throw new Error('Missing logical operator.')
  }
  console.log('value '+valueStack)
  console.log(operatorStack)
  while (operatorStack.length > 0) {
    let operator = operatorStack.pop();
    let operand2 = valueStack.pop();
    let operand1 = valueStack.pop();

    if (operand1==undefined&&operand2==undefined){
      throw new Error('Missing right and left term.')
    }
    if(operand1==undefined){
      throw new Error('Missing right term.')
    }
    if(operand2==undefined){
      throw new Error('Missing left term.')
    }
    if (isLogicalOperator(operator)) {
      // Evaluate the logical expression
      switch (operator) {
        case "&&":
          valueStack.push(operand1 && operand2);
          break;
        case "||":
          valueStack.push(operand1 || operand2);
          break;
        case "!":
          valueStack.push(!operand2);
          break;
      }
    } else {
      // Evaluate other operators
      switch (operator) {
     
        case "+":
          valueStack.push(operand1 + operand2);
          break;
        case "-":
          valueStack.push(operand1 - operand2);
          break;
        case "*":
          valueStack.push(operand1 * operand2);
          break;
        case "/":
          valueStack.push(operand1 / operand2);
          break;
        case "<":
          valueStack.push(operand1 < operand2);
          break;
        case "<=":
          valueStack.push(operand1 <= operand2);
          break;
        case ">":
          valueStack.push(operand1 > operand2);
          break;
        case ">=":
          valueStack.push(operand1 >= operand2);
          break;
        case "==":
          valueStack.push(operand1 == operand2);
          console.log(operand1+' '+operand2)
          break;
        case "!=":
          valueStack.push(operand1 != operand2);
          break;
      }
    }
  }

  if (valueStack.length === 1) {
    
    return valueStack[0] ;
  } else {
    // Handle invalid expressions here
    throw new Error("Invalid expression");
  }
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function tokenize(input) {
  const operators = [
    /<=|>=|==|!=|&&|\|\|/, // Multi-character operators
    /[-+*/<>=!]/, // Single-character operators
    /=/, // Single-character operator '='
  ];

  // Create a regular expression pattern to match operators, identifiers, numbers, strings, and parentheses
  const pattern = new RegExp(
    `(${operators.map(op => op.source).join('|')})|\\w+|\\d+|#\\w+|\\s+|\\(|\\)`, 'g'
  );

  // Tokenize the input string
  const tokens = input.match(pattern) || [];

  // Remove any whitespace tokens
  const filteredTokens = tokens.filter(token => !/^\s+$/.test(token));

  // Check for two operators in a row
  for (let i = 0; i < filteredTokens.length - 1; i++) {
    if (filteredTokens[i].match(/^(<=|>=|==|!=|&&|\|\||[-+*/<>=!]=?)$/) && filteredTokens[i + 1].match(/^(<=|>=|==|!=|&&|\|\||[-+*/<>=!]=?)$/)) {
      throw new Error("Two operators in a row are not allowed.");
    }
  }

  return filteredTokens;
}

function addParenthesesAroundSubexpressions(expr) {
  const pattern = /(\([^\(\)]*\))/g;
  const matches = expr.match(pattern);

  if (matches) {
    for (const match of matches) {
      expr = expr.replace(match, `(${match})`);
    }
  }

  return expr;
}