// Asegúrate de que este código se ejecute después de que el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', () => {
    var socket = io.connect('http://localhost:5000');

    // Crear un nuevo objeto de audio para el sonido de notificación
    var notificationSound = new Audio('/uwu.mp3');

    // Variables de elementos del DOM
    var persona = document.getElementById('persona'),
        appChat = document.getElementById('app-chat'),
        panelBienvenida = document.getElementById('panel-bienvenida'),
        mensaje = document.getElementById('mensaje'),
        botonEnviar = document.getElementById('enviar'),
        escribiendoMensaje = document.getElementById('escribiendo-mensaje'),
        output = document.getElementById('output'),
        nombreUsuarioDiv = document.getElementById('nombre-usuario'), // Elemento para mostrar el nombre del usuario
        botonLogin = document.getElementById('boton-login'),
        botonNuevoChat = document.getElementById('boton-nuevo-chat'); // Botón para crear un nuevo chat

    // Evento de inicio de sesión
    botonLogin.addEventListener('click', function() {
        const username = persona.value;
        const password = document.getElementById('contrasena').value; // Obtén la contraseña

        if (username && password) {
            fetch('/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            })
            .then(response => response.json())
            .then(data => {
                if (data.message === 'Acceso permitido') {
                    panelBienvenida.style.display = "none";
                    appChat.style.display = "block";
                    persona.value = username; // Establecer el usuario
                    persona.readOnly = true; // Hacerlo solo lectura

                    // Mostrar el nombre de usuario en el chat
                    nombreUsuarioDiv.innerText = `${username}!`;
                    socket.emit('registerUser', username); // Registrar usuario
                } else {
                    alert('Usuario o contraseña incorrectos');
                }
            })
            .catch(err => {
                console.error('Error al enviar solicitud de inicio de sesión', err);
            });
        }
    });

    // Manejar el envío de mensajes
    botonEnviar.addEventListener('click', function() {
        const chatId = document.getElementById('current-chat-id').value; // Obtener el ID del chat actual
        if (mensaje.value && chatId) {
            socket.emit('chat', {
                mensaje: mensaje.value,
                usuario: persona.value,
                chatId: chatId // Agregar chatId al mensaje
            });

            // Reproducir sonido de notificación al enviar un mensaje
            notificationSound.play();
            
            mensaje.value = ''; // Limpiar el input después de enviar
        }
    });

    // Manejar la escritura
    mensaje.addEventListener('keyup', function() {
        if (persona.value) {
            socket.emit('typing', {
                nombre: persona.value,
                texto: mensaje.value
            });
        }
    });

    // Mostrar mensajes en el chat
    socket.on('chat', function(data) {
        escribiendoMensaje.innerHTML = ''; // Limpiar el mensaje de "escribiendo"
        output.innerHTML += '<p><strong>' + data.usuario + ': </strong>' + data.mensaje + '</p>';
        
        // Reproducir sonido de notificación al recibir un mensaje
        notificationSound.play();
    });

    // Mostrar quién está escribiendo
    socket.on('typing', function(data) {
        escribiendoMensaje.innerHTML = '<p><em>' + data.nombre + ' está escribiendo un mensaje...</em></p>';
    });

    // Cargar los chats previos
    socket.on('previousChats', function(chats) {
        const chatList = document.getElementById('chat-list');
        let chatCounter = 1; // Contador para enumerar los chats
        chatList.innerHTML = ''; // Limpiar la lista de chats antes de agregar nuevos

        chats.forEach(function(chat) {
            const chatItem = document.createElement('li');
            chatItem.textContent = `Chat ${chatCounter} - ${chat.chatId}`; // Modificar para mostrar "Chat 1", "Chat 2", etc.
            chatItem.addEventListener('click', function() {
                output.innerHTML = ''; // Limpiar mensajes anteriores
                document.getElementById('current-chat-id').value = chat.chatId; // Establecer el chat actual
                socket.emit('loadChat', chat.chatId); // Cargar mensajes de ese chat
            });
            chatList.appendChild(chatItem);
            chatCounter++; // Incrementar el contador
        });
    });

    // Cargar mensajes de un chat específico
    socket.on('chatMessages', function(messages) {
        output.innerHTML = ''; // Limpiar los mensajes anteriores
        messages.forEach(function(message) {
            output.innerHTML += '<p><strong>' + message.usuario + ': </strong>' + message.mensaje + '</p>';
        });
    });

    // Crear un nuevo chat
    botonNuevoChat.addEventListener('click', function() {
        socket.emit('createNewChat'); // Emitir evento para crear un nuevo chat
    });

    // Manejar la creación de un nuevo chat
    socket.on('newChatCreated', function(newChatId) {
        const chatList = document.getElementById('chat-list');
        const chatItem = document.createElement('li');
        chatItem.textContent = `Chat - ${newChatId}`;
        chatItem.addEventListener('click', function() {
            output.innerHTML = ''; // Limpiar mensajes anteriores
            document.getElementById('current-chat-id').value = newChatId; // Establecer el chat actual
            socket.emit('loadChat', newChatId); // Cargar mensajes de ese chat
        });
        chatList.appendChild(chatItem); // Agregar nuevo chat a la lista
    });

    // Mostrar la lista de usuarios conectados
    socket.on('updateUserList', function(users) {
        const listaUsuarios = document.getElementById('lista-usuarios');
        listaUsuarios.innerHTML = ''; // Limpiar la lista antes de actualizar

        users.forEach(function(user) {
            const li = document.createElement('li');
            li.textContent = user; // Agregar el nombre del usuario a la lista
            listaUsuarios.appendChild(li); // Añadir a la lista de usuarios
        });
    });
});
