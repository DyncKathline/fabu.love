'use strict';
import "./index.css";
 
export function formatContent(container, content) {
  const contentArray = content.split(' ');
  let formattedContent = document.createElement('div');
  contentArray.map(function (word) {
    formattedContent.appendChild(createWord(word));
  });
  console.log(contentArray);
 
  container.replaceChild(formattedContent, container.firstChild);
};
 
function createWord(characters) {
  let word = document.createElement('div');
  const wordArray = characters.split('');
  wordArray.map(function (char) {
    word.appendChild(formatCharacter(char));
  });
  word.appendChild(formatCharacter(' '));
  return word;
}
 
function formatCharacter(str) {
  const text = str === ' ' ? ' ' : str;
  let character = document.createElement('span');
  character.innerHTML = text;
  return character;
}
 
// var container = document.querySelector('.content');
// var content = container.innerText;
// formatContent(container, content);