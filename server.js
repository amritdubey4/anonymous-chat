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

	// Send existing (non-expired) messages on connect
	socket.emit('load_messages', messages);

	socket.on('chat_message', (data) => {
		const message = {
			id: Date.now() + '-' + Math.random().toString(36).slice(2, 7),
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

// Purge messages older than 30 min every 10s
setInterval(() => {
	const cutoff = Date.now() - 30 * 60 * 1000;
	const before = messages.length;
	messages = messages.filter((msg) => msg.time >= cutoff);

	if (messages.length !== before) {
		io.emit('refresh_messages', messages);
	}
}, 10000);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
	console.log(`Server running on http://localhost:${PORT}`);
});
