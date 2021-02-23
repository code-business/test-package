const _ = require("lodash");
const path = require("path");
console.log(__dirname);
const arrayManipulation = (array, option) => {
  if (_.isArray(array)) {
    switch (option) {
      case "flatten":
        return _.flatten(array);
      case "flattenDeep":
        return _.flattenDeep(array);
      case "removeLastElement":
        return _.slice(array, (start = 0), array.length - 1);
    }
  } else {
    return "Not an array";
  }
};

module.exports = { arrayManipulation };
