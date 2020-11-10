#!/usr/bin/env node
import * as dotenv from 'dotenv';
dotenv.config(); //make sure this is loaded ASAP

import commander from 'commander';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import * as path from 'path';
import { version } from '../drivenet-details.json';
import { openRoutesRouter } from './Express/openRoutesRouter';
import { protectedRoutesRouter } from './Express/protectedRoutesRouter';
import { refreshTokenRouter } from './Express/refreshTokenRouter';
import { strictFilterInt } from './Utils/utils';

// include the passport.use for auth handling
require('./Utils/auth');

// Example commands
// node dist\src\drivenet.js serve
// node dist\src\drivenet.js serve -p 8000

interface ServeCommandOptions
{
  port: number;
}

function serveMain(): void
{
  try {
    const cli = new commander.Command();
    cli.storeOptionsAsProperties(false)
      .version(version, '-v, --version', 'Output the current version')
      .description('Main Fabnet Server')
      .requiredOption('-p, --port <port number>', 'Server port on which to listen', strictFilterInt, 8080)
      .helpOption('-h, --help', 'Display help for command')
      .parse(process.argv);

    const options = cli.opts() as ServeCommandOptions;
    console.log('Server options', options);

    // Setup the express app and it's config
    const app = express();
    app.use(helmet());
    app.use(cookieParser());
    app.use(cors());
    app.use(express.json());

    // handles react static files
    app.use(express.static(path.join(__dirname, '/Express/Client-UI/build')));

    // handles routes with auth e.g. login and pings
    app.use('/api/v1', openRoutesRouter);

    // handles routes with auth e.g. login and pings
    app.use('/api/v1', refreshTokenRouter);

    // handles all drivenet routes
    app.use('/api/v1', protectedRoutesRouter);

    // Handles any requests that don't match the ones above
    app.get('*', (_,res) =>{
      res.sendFile(path.join(__dirname, '/Express/Client-UI/build/index.html'));
    });

    // Start listening
    app.listen(options.port, () =>
    {
      console.log(`Listening on port ${options.port}`);
    });

    return;
  } catch (err) {
    console.log('Error whilst running the "serve" command:', err);
  }
}
void serveMain();
