#!/usr/bin/env node

import commander from 'commander';
import details from '../drivenet-details.json';

function main(): void
{
  try {
    const cli = new commander.Command();
    cli.storeOptionsAsProperties(false)
      .version(details.version, '-v, --version', 'Output the current version')
      .description(details.description)
      .command('serve', 'Start a server to host the DriveNet client application and launch REST endpoints')
      .helpOption('-h, --help', 'Display help for command')
      .parse(process.argv);

    //add in 'stats', 'maintenance'? (denied users add/remove)?
    //for 'stats' we want to count ibm and non-ibm users and totals. 'delete' network needs to add to stats before removing users
    // also add some stats about pending VS actual users (pending drop out rate)

    return;
  } catch (err) {
    console.log('Error whilst running the "fabtools" command:', err);
  }
}
void main();




