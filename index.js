var express = require('express');
var cors = require('cors');
var app = express();
var server = app.listen(5000, function() {
    console.log("Puerto 5000 abriendo...");
});

app.use(cors({
    origin: 'http://localhost:5000'
}));

app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

var socket = require('socket.io');
var io = socket(server);

const { connectToDatabase, getDb } = require('./config/db');

connectToDatabase()
    .then(() => {
        console.log('Conexión a la base de datos exitosa');
    })
    .catch(err => {
        console.error('Error al conectar a la base de datos', err);
    });

const connectedUsers = {}; // Almacenar usuarios conectados

io.on('connection', async function(socket) {
    console.log('Hay una conexión', socket.id);

    socket.on('registerUser', function(username) {
        connectedUsers[socket.id] = username; // Guardar usuario en la lista de conectados
        // Emitir la lista de usuarios conectados a todos los clientes
        io.emit('updateUserList', Object.values(connectedUsers));
    });

    socket.on('disconnect', function() {
        delete connectedUsers[socket.id]; // Eliminar el usuario de la lista al desconectarse
        // Emitir la lista actualizada de usuarios conectados
        io.emit('updateUserList', Object.values(connectedUsers));
    });

    const db = getDb();
    
    // Cargar chats previos desde la base de datos
    try {
        const chats = await db.collection('chats').find().toArray();
        socket.emit('previousChats', chats);
    } catch (error) {
        console.error('Error al cargar los chats previos', error);
    }

    // Evento para manejar nuevos mensajes
    socket.on('chat', async function(data) {
        console.log(data);
        
        // Insertar el mensaje en la colección 'messages'
        try {
            await db.collection('messages').insertOne({
                usuario: data.usuario,
                mensaje: data.mensaje,
                chatId: data.chatId, // Agregar el chatId para asociar el mensaje al chat
                timestamp: new Date()
            });
            console.log('Mensaje almacenado en la base de datos');
        } catch (error) {
            console.error('Error al almacenar el mensaje', error);
        }

        io.sockets.emit('chat', data);
    });

    // Evento para manejar la escritura
    socket.on('typing', function(data) {
        socket.broadcast.emit('typing', data);
    });

    // Evento para crear un nuevo chat
    socket.on('createNewChat', async function() {
        const newChatId = Date.now().toString();
        
        // Insertar el nuevo chat en la colección 'chats'
        try {
            await db.collection('chats').insertOne({ chatId: newChatId });
            console.log('Nuevo chat almacenado en la base de datos');
        } catch (error) {
            console.error('Error al almacenar el nuevo chat', error);
        }

        // Emitir el nuevo chat a todos los clientes
        socket.emit('newChatCreated', newChatId);
        socket.broadcast.emit('newChatCreated', newChatId);
    });

    // Evento para cargar mensajes de un chat específico
    socket.on('loadChat', async function(chatId) {
        try {
            const mensajes = await db.collection('messages').find({ chatId }).sort({ timestamp: 1 }).toArray();
            socket.emit('chatMessages', mensajes);
        } catch (error) {
            console.error('Error al cargar los mensajes del chat', error);
        }
    });
});

// Ruta para el login
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const db = getDb();

    try {
        const user = await db.collection('usuarios').findOne({ username, password });
        if (user) {
            res.status(200).json({ message: 'Acceso permitido' });
        } else {
            res.status(401).json({ message: 'Usuario o contraseña incorrectos' });
        }
    } catch (error) {
        console.error('Error al autenticar usuario', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
});
