


const expr = document.getElementById('sqlExpression2')
const button = document.getElementById('parse')
const output = document.getElementById('output')

const col = ['attr1','attr2','attr3','bell1','bell2']
const tables = ['table1','table2', 'table3']
const processVar = [['#status1','complete'],['#status2','incomplete'],['#var',45]]

const suggestionsList = document.getElementById('suggestions');
const keywords = ['select', 'and', 'or', 'not', 'in', 'tuple'];
let currentKeyWords = keywords
let cursorPosition1 = ''
expr.addEventListener('input', function() {
  // Get the current query
  const query = expr.value;
  const cursorPosition = expr.selectionStart
  cursorPosition1=cursorPosition
  // Get the current word being typed
  

  // Clear existing suggestions
  clearSuggestions();

  // Provide suggestions based on the current word
  suggest(query,cursorPosition)
});

expr.addEventListener('keydown', function(event) {
    let pro;
  if (event.key === 'Tab') {
 
    event.preventDefault();
    const selectedSuggestion = suggestionsList.firstChild;
    console.log(selectedSuggestion)
    if (selectedSuggestion) {
      let word = selectedSuggestion.textContent
      if(['select','from','where','and', 'in', 'not', 'tuple','or'].includes(word))
        insertSuggestion(word.toUpperCase());
        else
        insertSuggestion(word);
    }
    else {
        
        pro = parseQueryProgress(expr.value,expr.selectionStart);
        console.log(pro)
        if(pro.cursorAt=='SELECT'){
            showSuggestions(col)
        }
        else if(pro.cursorAt=='FROM'){
            showSuggestions(tables)
        }
        else if(pro.cursorAt=='WHERE'){
            showSuggestions(col.concat(tables))
        }
    }
  }
});

function getCurrentWord(query) {
  const caretPosition = expr.selectionStart;
  const textBeforeCaret = query.substring(0, caretPosition);
  const wordsBeforeCaret = textBeforeCaret.split(/\s/);
  return wordsBeforeCaret[wordsBeforeCaret.length - 1];
}

function getMatchingKeywords(prefix) {
  // Filter keywords that start with the current word
  return currentKeyWords.filter(keyword => keyword.startsWith(prefix));
}

function showSuggestions(suggestions) {
  suggestions.forEach(suggestion => {
    const li = document.createElement('li');
    li.textContent = suggestion;
    li.addEventListener('click', () => insertSuggestion(suggestion));
    suggestionsList.appendChild(li);
  });
}

function insertSuggestion(suggestion) {
  const currentQuery = expr.value;
  const currentWord = getCurrentWord(currentQuery);
  const startIndex = currentQuery.lastIndexOf(currentWord);

  // Check if the current word ends with an operator
  const operators = ['+', '-', '*', '/', '==', '!=', '<', '>', '<=', '>=', '&&', '||',','];
  const endsWithOperator = operators.some(operator => currentWord.endsWith(operator));

  let updatedQuery;

  if (endsWithOperator) {
    // Insert the suggestion after the current word without removing it
    updatedQuery = currentQuery.substring(0, startIndex + currentWord.length) + suggestion + currentQuery.substring(startIndex + currentWord.length);
  } else {
    // Insert the suggestion in the default manner
    updatedQuery = currentQuery.substring(0, startIndex) + suggestion + currentQuery.substring(startIndex + currentWord.length);
  }

  expr.value = updatedQuery;
  clearSuggestions();
}

function clearSuggestions() {
  while (suggestionsList.firstChild) {
    suggestionsList.removeChild(suggestionsList.firstChild);
  }
}

function suggest(expr,cursorPosition){
    const currentWord = getCurrentWord(expr);
    if (currentWord.length > 0) {
    const matchingKeywords = getMatchingKeywords(currentWord);
    showSuggestions(matchingKeywords);
  }
  const pro = parseQueryProgress(expr,cursorPosition)
  console.log(pro)
  if(pro.cursorAt=='SELECT'){
    sel_keyWords =['from'].concat(col)
    currentKeyWords = sel_keyWords
  }
  else if(pro.cursorAt=='FROM'){
    currentKeyWords = ['where'].concat(tables)
  }
  else if(pro.cursorAt=='WHERE'){
    currentKeyWords = ['and', 'or', 'not', 'in', 'tuple'].concat(col).concat(tables);
  }
  else currentKeyWords=keywords
}

function parseQueryProgress(queryText, cursorPosition) {
const keyWords = ['SELECT', 'FROM', 'WHERE'];
let progress = {};
let cursorPositionInfo = '';

for (const keyword of keyWords) {
const keywordIndex = queryText.indexOf(keyword);
if (keywordIndex !== -1 && cursorPosition >= keywordIndex + keyword.length) {
  cursorPositionInfo = keyword;
}

progress[keyword] = keywordIndex !== -1;
}

progress.cursorAt = cursorPositionInfo;
return progress;
}
//////////////
expr.addEventListener('input', function () {
  // Clear previous errors and error highlights
  clearErrors();
  if(output.errorArray!=null){
    output.errorArray=[]
  }
  output.textContent=''
  // Get the current input value
  const inputValue = expr.value;

  // Check for errors and highlight them
  if (isCondition(inputValue, [])) {
      try {
          parseExpression(inputValue, processVar);
          output.textContent = 'Parsed.';
      } catch (Err) {
          throwError('CONDITION ERROR', Err);
          
      }
  } else {
      validateQuery(inputValue);
  }
});

function highlightError() {
  expr.classList.add('error');
}

function clearErrors() {
  expr.classList.remove('error');
  output.textContent = '';
  // You can also clear any other error-specific styles here.
}
function validateQuery(query){

    
    
    //regular to match specifc patterns
    const selectPattern = /SELECT\s+([^]+?)\s+FROM/i;
    const fromPattern = /FROM\s+([^]+?)(?:\s+WHERE|$)/i;
    const wherePattern = /WHERE\s+(.+)/i;

    const selectMatch = selectPattern.exec(query)
    const fromMatch = fromPattern.exec(query)
    const whereMatch = wherePattern.exec(query)

    //checks for spelling of keywords
    if(!selectMatch || !fromMatch || !whereMatch){
        throwError('Syntax Error', 'Mispelled or missing either SELECT, FROM, or WHERE.');
        
    }
    

    const selectAttributes = selectMatch[1].split(/\s*,\s*/);
    const fromTables = fromMatch[1].trim().split(/\s*,\s*/);

   

    //Checks for comma errors
    for(let j =0; j<selectAttributes.length;j++){
        if(/(\S+\s)+\S+/.test(selectAttributes[j])){
          
            throwError('Syntax Error', 'Missing commas and spaces between attributes or tables in the query.');
            break;
        }
    }
    for(let j =0; j<fromTables.length;j++){
        if(/(\S+\s)+\S+/.test(fromTables[j])){
            throwError('Syntax Error', 'Missing commas and spaces between attributes or tables in the query.');
            break;
        }
    }
   
    //cross referrences with metadata
    for(const a of selectAttributes){
        if(!col.includes(a)){
            throwError('Attribute Error', 'Attribute ' + a + ' does not exist in the database.');
    }
        }
    
    for(const t of fromTables){
        if(!tables.includes(t)){
            throwError('Table Error', 'Table ' + t + ' does not exist in the database.');
        }
    }

    
    if(whereMatch==null){
      throwError('FILTER ERROR','Missing Filter.')
    }
   
    parseFilter(whereMatch[1])

    if(output.textContent==''){
      output.textContent='Parsed.'
  }
  
  
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
  

  function parseExpression(expr,processVar) {
    let legalOp = [
      "<", "<=", ">", ">=", "==", "!=", "=", "+", "-", "*", "/", "&&", "||", "!"
    ];
  
    // Define regular expression patterns
    let numPattern = /\d+(\.\d+)?/; // Match numbers, including decimals
    let opPattern = new RegExp(`(?:${legalOp.map(escapeRegExp).join('|')})`);
    let stringPattern = /'([^']+)'/;

    // Add parentheses around subexpressions enclosed in parentheses
    expr = addParenthesesAroundSubexpressions(expr);
  
    let tokens = tokenize(expr.trim());
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
      } else  {
        // Handle string literals starting with '#'
        throw new Error('Invalid string not in quoutes.');
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
  
    // Create a regular expression pattern to match operators, identifiers, numbers, strings, and parentheses, and single-quoted terms
    const pattern = new RegExp(
      `(${operators.map(op => op.source).join('|')})|\\w+|\\d+|#\\w+|\\s+|\\(|\\)|'[^']*'`, 'g'
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
    console.log(filteredTokens)
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
  