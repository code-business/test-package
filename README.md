# test-package

This package can be used to :

1. Remove last element of an array
2. Get array flattened by one level
3. Get array flattened recursively till it cannot be flattened anymore

Installation:

1. Open your terminal.
2. Go to your project root directory
3. Type npm i test-package

Example:

const { arrayManipulation } = require("test-package");

let array = [[1],[[2,3],4],[5]];
let flattened = arrayManipulation(array, "flatten");
let lastElementRemoved = arrayManipulation(array, "removeLastElement");
let flattenedDeep = arrayManipulation(array,"flattenDeep");

console.log(flattened);
//output: [1,[2,3],4,5]

console.log(flattenedDeep);
//output: [1,2,3,4,5]

console.log(lastElementRemoved);
//output: [[1],[[2,3],4]]
