module.exports = function diffObjects(obj1, obj2) {
  function findDifferences(o1, o2) {
    const differences = {};

    // Iterate over the properties of the first object to find removed properties
    for (const key in o1) {
      if (o1.hasOwnProperty(key)) {
        if (o2.hasOwnProperty(key)) {
          if (Array.isArray(o1[key]) && Array.isArray(o2[key])) {
            // Handle array differences
            const missing = o1[key].filter(item => !o2[key].includes(item));
            if (missing.length > 0) {
              differences[key] = missing;
            }
          } else if (typeof o1[key] === 'object' && o1[key] !== null && typeof o2[key] === 'object' && o2[key] !== null) {
            // Handle nested objects
            const nestedDiff = findDifferences(o1[key], o2[key]);
            if (Object.keys(nestedDiff).length > 0) {
              differences[key] = nestedDiff;
            }
          }
        } else {
          differences[key] = o1[key];
        }
      }
    }

    return differences;
  }

  return findDifferences(obj1, obj2);
}

