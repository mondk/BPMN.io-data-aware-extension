
export default function parseExpressions(value,processVar,tables) {
   
    const expressions = value.split(';');

    expressions.forEach(expression => {
        expression = expression.trim();
        if (expression.startsWith('INSERT')) {
            const matches = expression.match(/INSERT \(([^)]+)\) INTO (\w+)/);
            if (matches && matches.length === 3) {
                const values = matches[1].split(',').map(value => value.trim());
                const tableName = matches[2];

                if (!tables.includes(tableName)) {
                    throw new Error('Error. Table does not exist.')
                } else {
                   //database handeling
                }
            } else {
            
                throw new Error('Error. Invalid INSERT expression')
            }
         } else if (expression.startsWith('DELETE')) {
            const matches = expression.match(/DELETE \(([^)]+)\) FROM (\w+)/);
            if (matches && matches.length === 3) {
                const values = matches[1].split(',').map(value => value.trim());
                const tableName = matches[2];

                if (!tables.includes(tableName)) {
                    throw new Error('Error. Table does not exist.')
                } else {
                   //database handeling
                }
            } else {
            
                throw new Error('Error. Invalid DELETE expression')
            }
        }
        else if (expression.startsWith('#')) {
            const matches = expression.trim().split('=');
            console.log(matches)
            if (matches && matches.length === 2) {
                const variableName = matches[0].trim();
                const variableValue = matches[1].trim();
         
                if (!(processVar.find(([key]) => key === variableName))) {
                   
                    throw new Error('Error. Process variable does not exist.')
                } else {
                    const isNumber = /^[-+]?\d*\.?\d+(?:[eE][-+]?\d+)?$/.test(variableValue)
                    console.log(isNumber)
                    if(!isNumber){
                        console.log((/^'[^']*'|"[^"]*"$/.test(variableValue)))
                        if(!(/^'[^']*'|"[^"]*"$/.test(variableValue))){
                       
                            throw new Error('Invalid assignment value. Strings should be enclosed in single or double quotes, or it should be a valid number.');
                        }

                    }

                    for (let i = 0; i < processVar.length; i++) {
                        if (processVar[i][0] === variableName) {
                            processVar[i][1] = variableValue;
                            console.log(processVar)
                            break; // Exit the loop once the update is done
                        }
                    }
                }
            } else {
                throw new Error('Invalid assignment.')
            }
        } else {
            throw new Error('Invalid expression')
        }
    });

    return true;

   
}