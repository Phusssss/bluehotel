const { DataSource } = require('typeorm');
const { config } = require('./src/config/env');

module.exports = new DataSource({
  type: 'mysql',
  host: config.database.host,
  port: config.database.port,
  username: config.database.username,
  password: config.database.password,
  database: config.database.name,
  synchronize: false,
  logging: true,
  entities: ['dist/entities/**/*.js'],
  migrations: ['dist/migrations/**/*.js'],
  charset: 'utf8mb4',
  timezone: '+00:00',
});