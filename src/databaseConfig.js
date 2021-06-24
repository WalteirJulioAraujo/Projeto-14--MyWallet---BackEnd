import pg from 'pg';

const { Pool } = pg;
const databaseConfig = {
    user:'postgres',
    password:'1234567',
    host:'localhost',
    port:5432,
    database:'mywallet'
}
const connection = new Pool(databaseConfig);

export default connection;