// Mock file to stub native C++ database modules on Cloudflare Workers
export class Database {
  constructor() {
    console.log('Mock Database initialized');
  }
  run() {}
  all() {}
  close() {}
}

export function verbose() {
  return {
    Database
  };
}

export const connect = () => {};
export const Pool = class {};
export const Client = class {};

export default {
  Database,
  verbose,
  connect,
  Pool,
  Client
};
