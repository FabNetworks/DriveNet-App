const copy = require('copy');
const del = require('del');

// remove existing content
const deletedPaths = del.sync(['build/**'], { cwd: '../../../dist/src/Express/Client-UI/'}); // also allows dryRun: true
// console.log('Files and directories to be deleted:\n', deletedPaths.join('\n'));

console.log('Copying build output to dist folder');

// copy in new content
copy('build/**/*', '../../../dist/src/Express/Client-UI/build', function (err, files)
{
  if (err) throw err;
});
