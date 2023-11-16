import {validateQuery,isCondition} from './pre.js'
import parsesqlEditoression from './parser.js'
import parseExpressions from './eff.js'



export default function getAll(container,col,tables,processVar,tableData){
     
   const topDiv = document.createElement('div')
   const sqlEditor = document.createElement('textarea')
   sqlEditor.className='pre'
   const suggestTop = document.createElement('ul')
   topDiv.appendChild(sqlEditor);topDiv.appendChild(suggestTop);

   const bottomDiv = document.createElement('div')
   const effEditor = document.createElement('textarea')
   effEditor.className = 'eff'
   const suggestBottom = document.createElement('ul')
   bottomDiv.appendChild(effEditor);bottomDiv.appendChild(suggestBottom);

   container.appendChild(topDiv);container.appendChild(bottomDiv)

   effEditor.addEventListener('input',function(){
    effEditor.classList.remove('parsed')
    let valid = false
    

    try{
        valid = parseExpressions(effEditor.value,processVar,tables,tableData)
        sqlEditor.classList.remove("error");
    }catch(error){
        console.log(error)
 
    
    }
    
    if(valid){
        effEditor.classList.add('parsed')
        let n = effEditor.value
        container.eff={'isPared':true,n}
    }
    
   
});
sqlEditor.addEventListener('input', function () {
    // Clear previous errors and error highlights
    sqlEditor.classList.remove('parsed')
    let valid = false
    let inputValue = sqlEditor.value;
    // Check for errors and highlight them
    if (isCondition(inputValue, [])) {
        try {
            parsesqlEditoression(inputValue, processVar);
            valid = true;
        } catch (Err) {
            throw new Error( Err);
            
        }
    } else {
        try{
            valid = validateQuery(inputValue,col,tables,processVar);
        }catch(Err){
            console.log(Err)
        }

    }

    if(valid) { 
        console.log('PARSED!')
        sqlEditor.classList.add('parsed')
        let n = sqlEditor.value
        container.pre={'isPared':true,n}
}       
   
  });
sqlEditor.addEventListener('input', function() {
    // Get the current query
    const query = sqlEditor.value;
    const cursorPosition = sqlEditor.selectionStart
   
    // Get the current word being typed
    
  
    // Clear existing suggestions
    clearSuggestions(suggestTop);
  
    // Provide suggestions based on the current word
    suggest(sqlEditor,cursorPosition,suggestTop)

    
  });
  effEditor.addEventListener('input',function(){
    clearSuggestions(suggestBottom)
    console.log('nig')
    suggestEff(effEditor,effEditor.selectionStart,suggestBottom)
  });


  effEditor.addEventListener('keydown',function(event){
    let pro;
    if(event.key ==='Tab'){
        event.preventDefault();

        const selectedSuggestion = suggestBottom.firstChild;

        if(selectedSuggestion){
            let word = selectedSuggestion.textContent;
            if(['insert','into','delete','from'].includes(word)){
                insertSuggestion(word.toUpperCase(),effEditor,suggestBottom)
            }
            else if(word.indexOf(0)=='#'){
                console.log('hrl')
            }
            else{
                insertSuggestion(word,effEditor,suggestBottom)
            }
        }
        
        else{
            pro = parseQueryProgressEff(effEditor.value,effEditor.selectionStart);
            console.log(pro)

            if(pro.cursorAt=='INSERT'){
                
            }
            else if(pro.cursorAt=='INTO'){
                showSuggestions(tables,suggestBottom,effEditor)
            }
            else if(pro.cursorAt=='DELETE'){

            }
            else if(pro.cursorAt=='FROM')
                showSuggestions(tables,suggestBottom,effEditor)
        }
    }
  });


  sqlEditor.addEventListener('keydown', function(event) {
      let pro;
    if (event.key === 'Tab') {
   
      event.preventDefault();
      const selectedSuggestion = suggestTop.firstChild;
      console.log(selectedSuggestion)
     
      if (selectedSuggestion) {
        let word = selectedSuggestion.textContent
        if(['select','from','where','and', 'in', 'not', 'tuple','or'].includes(word))
          insertSuggestion(word.toUpperCase(),sqlEditor,suggestTop);
          else
          insertSuggestion(word,sqlEditor,suggestTop);
      }
      else {
          
          pro = parseQueryProgress(sqlEditor.value,sqlEditor.selectionStart);
          console.log(pro)
          
          if(pro.cursorAt=='SELECT'){
              showSuggestions(col,suggestTop,sqlEditor)
          }
          else if(pro.cursorAt=='FROM'){
              showSuggestions(tables,suggestTop,sqlEditor)
          }
          else if(pro.cursorAt=='WHERE'){
              showSuggestions(col.concat(tables),suggestTop,sqlEditor)
          }
      }
    }
  });

  ////////////////
  const suggestionsList = document.getElementById('suggestions');
  const keywords = ['select', 'and', 'or', 'not', 'in', 'tuple','from','where'];
  const keywordsEff = ['insert', 'into', 'delete', 'from']
  let processVarNames = processVar.map(item => item[0]);
  let currentKeyWordsEff = keywordsEff

  let currentKeyWords = keywords
 
 
  
  
  function getCurrentWord(query,Editor) {
    const caretPosition = Editor.selectionStart;
  
    const textBeforeCaret = Editor.value.substring(0, caretPosition);
    const wordsBeforeCaret = textBeforeCaret.split(/\s/);

    return  wordsBeforeCaret[wordsBeforeCaret.length - 1];
    
  }
  
  function getMatchingKeywords(prefix,currentKeyWords) {
    // Filter keywords that start with the current word
    return currentKeyWords.filter(keyword => keyword.startsWith(prefix));
  }
  
  function showSuggestions(suggestions,suggestionsList,editor) {
    suggestions.forEach(suggestion => {
      const li = document.createElement('li');
      li.textContent = suggestion;
      li.addEventListener('click', () => {insertSuggestion(suggestion,editor); clearSuggestions(suggestionsList) });
      suggestionsList.appendChild(li);
    });
  }
  
  function insertSuggestion(suggestion,Editor,suggestionsList) {
   
    const currentQuery = Editor.value;
    const currentWord = getCurrentWord(currentQuery,Editor);
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
    if(keywords.includes(suggestion)){
        Editor.value = updatedQuery.toUpperCase()
    }
    else {Editor.value = updatedQuery;}

    clearSuggestions(suggestionsList);
  }
  
  function clearSuggestions(suggestionsList) {
    while (suggestionsList.firstChild) {
      suggestionsList.removeChild(suggestionsList.firstChild);
    }
  }
  
  function suggest(editor,cursorPosition,suggestionsList){
   
    let sel_keyWords;
      const currentWord = getCurrentWord(sqlEditor.value,editor);
      if (currentWord.length > 0) {

        if(currentWord[0]=='#'){
            
            currentKeyWords = processVarNames;
        }
      const matchingKeywords = getMatchingKeywords(currentWord,currentKeyWords);
      showSuggestions(matchingKeywords,suggestionsList,editor);
    }
    const pro = parseQueryProgress(sqlEditor.value,cursorPosition)
  
    
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
  
  function suggestEff(editor,cursorPosition,suggestionsList){
   
    let sel_keyWords;
      const currentWord = getCurrentWord(sqlEditor.value,editor);
      console.log(currentWord)
      if (currentWord.length > 0) {
        if(currentWord[0]=='#'){
            
            currentKeyWordsEff = processVarNames;
        }
      const matchingKeywords = getMatchingKeywords(currentWord,currentKeyWordsEff);
      
      showSuggestions(matchingKeywords,suggestionsList,editor);
    }
    const pro = parseQueryProgressEff(editor.value,cursorPosition)
    console.log(pro)
    if(pro.cursorAt=='INSERT'){
      sel_keyWords =['into']
      currentKeyWordsEff = sel_keyWords
    }
    else if(pro.cursorAt=='INTO'){
      currentKeyWordsEff = tables
    }
    else if(pro.cursorAt=='DELETE'){
      currentKeyWordsEff = ['from']
    }
    else if(pro.cursorAt=='FROM'){
        currentKeyWordsEff=tables
    }
    else if(currentWord.indexOf(0)=='#'){
        currentKeyWordsEff = processVar.map(item => item[0]);
    }
    else currentKeyWordsEff=keywordsEff
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


  function parseQueryProgressEff(queryText, cursorPosition) {
    console.log(queryText)
    const keywordsForInsert = ['INSERT', 'INTO'];
    const keywordsForDelete = ['DELETE', 'FROM'];
    let progress = {};
    let cursorPositionInfo = '';
  
    for (const keyword of keywordsForInsert) {
      const keywordIndex = queryText.indexOf(keyword);
      if (keywordIndex !== -1 && cursorPosition >= keywordIndex + keyword.length) {
        cursorPositionInfo = keyword;
      }
  
      progress[keyword] = keywordIndex !== -1;
    }
  
    if (!progress.INSERT) {
      for (const keyword of keywordsForDelete) {
        const keywordIndex = queryText.indexOf(keyword);
        if (keywordIndex !== -1 && cursorPosition >= keywordIndex + keyword.length) {
          cursorPositionInfo = keyword;
        }
  
        progress[keyword] = keywordIndex !== -1;
      }
    }
  
    progress.cursorAt = cursorPositionInfo;
    return progress;
  }
  
  


};






