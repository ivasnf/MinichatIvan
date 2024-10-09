const { MongoClient } = require('mongodb');

const url = 'mongodb://localhost:27017'; // Cambia esto si tu MongoDB no está en localhost
const dbName = 'Minichat'; // Cambia esto por el nombre de tu base de datos

let db;

const connectToDatabase = async () => {
    const client = new MongoClient(url, { useNewUrlParser: true, useUnifiedTopology: true });
    await client.connect();
    db = client.db(dbName);
    console.log('Conectado a la base de datos');
};

const getDb = () => {
    return db;
};

module.exports = { connectToDatabase, getDb };
