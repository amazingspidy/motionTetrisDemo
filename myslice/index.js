var martinez = require('martinez-polygon-clipping');

const polygon = [[[10, -10], [10, 10], [-10, 10], [-10, -10], [10, -10]]];

const line = [[[100, 5], [100, -5], [-100, -5], [-100, 5], [100, 5]]];

var result = martinez.diff(polygon, line);

console.log(result[0]);
console.log(result[1]);