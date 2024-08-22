/**
 * Make a map and return a function for checking if a key
 * is in that map.
 */
module.exports = function makeMap (str, expectsLowerCase) {
  const set = new Set(str.split(','))
  return expectsLowerCase
    ? val => set.has(val.toLowerCase())
    : val => set.has(val)
}
