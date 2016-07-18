'use strict';
const PREFIX = 'DEPLOY_';
const ENVPREFIX = 'DEPLOY_ENV_';

const packageJson = require('../package.json');
const argv = require('yargs')
.usage('Usage: $0 [options]')
.help('h')
.alias('h', 'help')

.describe('balancer', 'The name of the load balancer service. Default: lb')
.nargs('balancer', 1)
.default('balancer', 'lb')

.describe('environment', 'The id of environment which should be updated. Defaults to cachena.')
.nargs('environment', 1)
.default('environment', '1a45')

.describe('service', 'The service name which should be updated.')
.alias('service', 's')
.nargs('service', 1)
.demand('service')

.describe('mode', 'The updater mode. (\'balanced\', \'init\', \'initBalanced\', \'service\'')
.alias('mode', 'm')
.nargs('mode', 1)
.default('mode', 'balanced')

.describe('version', 'The version tag to which you want to update.')
.alias('version', 'v')
.nargs('version', 1)
.demand('version')

.describe('port', 'The service port.')
.alias('port', 'p')
.nargs('port', 1)

.describe('build', 'Build number to add to service name. Allows redeploy of same version.')
.nargs('build', 1)

.describe('env', `Additional environment variables for the docker-compose template. Process environment variables prefixed with '${ENVPREFIX}' will be respected as well. Must be in the format KEY=someValue`)
.alias('env', 'e')
.nargs('env', 1)

.describe('docker-service', 'Path to docker-compose template for the service.')
.nargs('docker-service', 1)
.default('docker-service', './service.docker.tpl.yml')
.describe('rancher-service', 'Path to rancher-compose template for the service.')
.nargs('rancher-service', 1)
.default('rancher-service', './service.rancher.tpl.yml')

.describe('docker-balancer', 'Path to docker-compose template for the load balancer.')
.nargs('docker-balancer', 1)
.default('docker-balancer', './balancer.docker.tpl.yml')
.describe('rancher-balancer', 'Path to rancher-compose template for the load balancer.')
.nargs('rancher-balancer', 1)
.default('rancher-balancer', './balancer.rancher.tpl.yml')

.describe('access-key', 'The API access key. Environment variable: RANCHER_ACCESS_KEY')
.nargs('access-key', 1)

.describe('secret-key', 'The API secret key. Environment variable: RANCHER_SECRET_KEY')
.nargs('secret-key', 1)

.epilog(`
You can also use process environment variables prefixed with ${PREFIX} for any additional variables not covered by commandline arguments.

Created with love <3 by entrecode. Version: ${packageJson.version}`)
  .argv;

String.prototype.toCamel = function toCamel() {
  return this.toLowerCase().replace(/(_[a-z])/g, ($1) => $1.toUpperCase().replace('_', ''));
};

argv.serviceName = `${argv.service}-${argv.version.split('.').join('-')}`;
if (argv.build) {
  argv.serviceName += `-build-${argv.build}`;
}

for (let env in process.env) {
  if (process.env.hasOwnProperty(env)) {
    if (env.indexOf(ENVPREFIX) !== -1) {
      if (!argv.env) {
        argv.env = [];
      }
      if (!Array.isArray(argv.env)) {
        argv.env = [argv.env];
      }

      argv.env.push(`${env.slice(ENVPREFIX.length)}=${process.env[env]}`);
    } else if (env.indexOf(PREFIX) !== -1) {
      argv[env.slice(PREFIX.length).toCamel()] = process.env[env];
    }
  }
}

if (argv.env) {
  if (!Array.isArray(argv.env)) {
    argv.env = [argv.env];
  }

  const envObj = {};
  argv.env.map((env) => {
    if (env.indexOf('=') === -1) {
      console.error('Environment variables need to be in the format key=value');
      process.exit(1);
    }
    const split = env.split('=');
    envObj[split[0]] = split[1];
    return envObj;
  });
  argv.e = argv.env = envObj;
}

argv.accessKey = argv.accessKey || process.env.RANCHER_ACCESS_KEY;
argv.secretKey = argv.secretKey || process.env.RANCHER_SECRET_KEY;

if (!argv.accessKey || !argv.secretKey) {
  console.error('Please provide access key and secret key\n');
  process.exit(1);
} else {
  console.info(`Using access key ${argv.accessKey}\n`);
}

module.exports = argv;