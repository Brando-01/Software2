const { Sequelize } = require('sequelize');
require('dotenv').config();

class DataBaseConnection{
  constructor(){
    if (!DataBaseConnection.instance){
      this._initialize();
      DataBaseConnection.instance = this;
    }
    return DataBaseConnection.instance;
  }



  _initialize(){
    this.sequelize = new Sequelize(
      process.env.DB_NAME,
      process.env.DB_USER,
      process.env.DB_PASSWORD,
      {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        dialect: 'postgres',
        dialectOptions: {
          ssl: false,
          authentication: 'md5'

        },
        logging:false,
        pool: {
          max: 5,
          min: 0,
          acquire: 30000,
          idle: 10000
        }
      }
    );
  }


  async testConnection(){
    try {
      await this.sequelize.authenticate();
      console.log('PostgreSQL conectado exitosamente (Patrón Singleton)');
    } catch(error){
      console.error('Error al conectar con PostgreSQL: ', error);
      }

  }


  getSequelizeInstance(){
    return this.sequelize;
  }
}
const instance = new DataBaseConnection();
Object.freeze(instance);

module.exports = instance;