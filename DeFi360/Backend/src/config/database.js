const { Sequelize } = require('sequelize');
require('dotenv').config();

class DatabaseConnection {
  constructor() {
    if (DatabaseConnection.instance) {
      return DatabaseConnection.instance;
    }

    this.sequelize = new Sequelize(
      process.env.DB_NAME,
      process.env.DB_USER,
      process.env.DB_PASSWORD,
      {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        dialect: 'postgres',
        logging: false,
        pool: {
          max: 5,
          min: 0,
          acquire: 30000,
          idle: 10000
        }
      }
    );

    DatabaseConnection.instance = this;
  }

  async testConnection() {
    await this.sequelize.authenticate();
    console.log(`PostgreSQL conectado a la base '${process.env.DB_NAME}'`);
  }
}

const connection = new DatabaseConnection();
Object.freeze(connection);

module.exports = {
  connection,
  sequelize: connection.sequelize,
  testConnection: () => connection.testConnection()
};
