'use strict';

var fs = require('fs');

if (process.env.npm_package_version) {
  var details = {
    "version": process.env.npm_package_version,
    "description": process.env.npm_package_description
  };

  fs.writeFileSync("drivenet-details.json", JSON.stringify(details, null, 2));
  console.log("drivenet-details.json written");

} else {
  console.log("Not run from npm run script, exiting!");
}