import fs from 'fs';

const model = {};

/**
 * console.log(camelize('hello-world')); // helloWorld
 * @param {string} str 
 */
function camelize(str) {
  return str.replace(/_(\w)/g, (_, c) => c ? c.toUpperCase() : '');
}

/**
 * console.log(capitalize('HelloWorld')) // hello-world
 * @param {string} str 
 */
function capitalize(str) {
  return str.replace(/\B([A-Z])/g, '_$1').toLowerCase();
}

(function () {
  let files = fs.readdirSync('./model');
  let js_files = files.filter((f) => {
    return f.endsWith('.js');
  })

  for (let f of js_files) {
    console.log(`process model: ${f}...`);
    let key = camelize(f.substring(0, f.lastIndexOf('.')));
    key = key.substring(0,1).toUpperCase() + key.substring(1);
    const mapping = require('./model/' + f);
    // console.log(`键值对：${key}-${mapping}`);
    model[key] = mapping;
  }
})();

module.exports = model;