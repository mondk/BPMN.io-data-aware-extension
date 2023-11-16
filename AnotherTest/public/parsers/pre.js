
import parseExpression from './parser.js'

export function validateQuery(query,col,tables,processVar){

    
    //regular to match specifc patterns
    const selectPattern = /SELECT\s+([^]+?)\s+FROM/i;
    const fromPattern = /FROM\s+([^]+?)(?:\s+WHERE|$)/i;
    const wherePattern = /WHERE\s+(.+)/i;

    const selectMatch = selectPattern.exec(query)
    const fromMatch = fromPattern.exec(query)
    const whereMatch = wherePattern.exec(query)

    //checks for spelling of keywords
    if(!selectMatch || !fromMatch || !whereMatch){
        throw new Error('Syntax Error', 'Mispelled or missing either SELECT, FROM, or WHERE.');
        
    }
    

    const selectAttributes = selectMatch[1].split(/\s*,\s*/);
    const fromTables = fromMatch[1].trim().split(/\s*,\s*/);

   

    //Checks for comma errors
    for(let j =0; j<selectAttributes.length;j++){
        if(/(\S+\s)+\S+/.test(selectAttributes[j])){
          
            throw new Error('Syntax Error', 'Missing commas and spaces between attributes or tables in the query.');
          
        }
    }
    for(let j =0; j<fromTables.length;j++){
        if(/(\S+\s)+\S+/.test(fromTables[j])){
            throw new Error('Syntax Error', 'Missing commas and spaces between attributes or tables in the query.');
            
        }
    }
   
    //cross referrences with metadata
    for(const a of selectAttributes){
        if(!col.includes(a)){
            throw new Error('Attribute Error', 'Attribute ' + a + ' does not exist in the database.');
    }
        }
    
    for(const t of fromTables){
        if(!tables.includes(t)){
            throw new Error('Table Error', 'Table ' + t + ' does not exist in the database.');
        }
    }

    
    if(whereMatch==null){
      throw new Error('FILTER ERROR','Missing Filter.')
    }
   
    parseFilter(whereMatch[1],processVar,col,tables)

    return true;
  
  
}
function splitExpression(expression) {
    return  expression.split(/\b(AND|OR)\b/).map(token => token.trim());
    
  }

function parseFilter(expression,processVar,col,tables) {
    const tokens = splitExpression(expression)
    console.log(tokens)
    const andOr = ['AND', 'OR']

    if(tokens.includes('')) {
        throw new Error('Syntax Error', 'fliter cannot begin or end with logical operator')
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
                throw new Error('Condition Error',Err)
            }
        }
        else if(isTuple(token,tables)){
            console.log('Tupple')
        }
        else{
            throw new Error('Syntax Error', 'Invalid filter')
        }
    }
    

  }
  
  export function isCondition(inputString) {
    const legalOperators = ["<", "<=", ">", ">=", "==", "!=", "=", "+", "-", "*", "/", "&&", "||", "!"];
    const operatorRegex = new RegExp(legalOperators.map(op => `\\${op}`).join('|'));
    const operators = inputString.match(operatorRegex);

  return (operators !== null && operators.length > 0)&&!(/\bTUPLE\b/i.test(inputString)||inputString.includes('IN')||inputString.includes('NOT')||inputString.includes('SELECT')||inputString.includes('FROM')||inputString.includes('WHERE'));
}
  
  function isTuple(expression,tables) {
    console.log(expression)
    const tupleMatch = expression.match(/TUPLE\(([^)]+)\)\s+(IN|NOT IN)\s+([^]+)/);
    if(tupleMatch==null) {
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
      if(!tables.includes(relation.trim())){
        throw new Error('TABLE ERROR','The table '+relation+' does not exist in database.')
        
      }
     return true;
    } else {
      throw new Error('Syntax Error',"Invalid TUPLE expression.");
    }
  }
  

 