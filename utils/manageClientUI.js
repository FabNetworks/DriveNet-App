// we need this to avoid calling npm install when installed the pack'd version of the fabtools
// or uploading to nodeshift which will otherwise fail to build
const fs = require('fs');
const exec = require('child_process');

if (process.env['npm_lifecycle_event'])
{
  // only defined when run from NPM
  console.log('Running:', process.env['npm_lifecycle_event'].toUpperCase());
}

// simple command processing. We only accept one argument
let command = process.argv[2];
if (!command)
{
  console.log('Command argument not passed, exiting.');
  return;
}

// make sure we know what the command is
if (command === 'build' || command === 'lint')
{
  command = `npm run ${command}`;
}
else if (command === 'install')
{
  command = `npm ${command}`;
}
else
{
  console.log(`Unknown Command argument ${command} exiting.`);
}

// where the client UI is relative to the server base
const basePath = './src/Express/Client-UI/';

if (fs.existsSync(basePath + '/package.json'))
{
  console.log(`Executing '${command}' for the Client-UI: please wait a little while...`);

  // This will stream the output so the user can see what's going on in colour! :-)
  // Note there is no return as stdout is already output to the console
  exec.execSync(command, { cwd: basePath, encoding: 'utf8', stdio: [process.stdin, process.stdout, process.stderr] });
} else
{
  // we are probably running the install from a packed image or uploading to openshift
  console.log(`Skipping '${command}' for Client UI`);
}
