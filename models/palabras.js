// models/Chat.js
const mongoose = require('mongoose');

const ChatSchema = new mongoose.Schema({
    nombre: String, // Nombre del chat
    participantes: [String], // Lista de participantes
    fechaCreacion: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Chat', ChatSchema);
