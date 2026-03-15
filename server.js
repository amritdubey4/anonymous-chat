const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

let messages = [];
let users = {};

io.on('connection', (socket) => {
	socket.on('join', (name) => {
		users[socket.id] = name;
		io.emit('user_list', Object.values(users));
	});

	socket.emit('load_messages', messages);

	socket.on('chat_message', (data) => {
		const message = {
			name: data.name,
			text: data.text,
			time: Date.now(),
		};

		messages.push(message);

		io.emit('chat_message', message);
	});

	socket.on('disconnect', () => {
		delete users[socket.id];
		io.emit('user_list', Object.values(users));
	});
});

setInterval(() => {
	const now = Date.now();

	messages = messages.filter((msg) => now - msg.time < 30 * 60 * 1000);

	io.emit('refresh_messages', messages);
}, 10000);

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
	console.log('Server running');
});
