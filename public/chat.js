const socket = io();

const name = localStorage.getItem('name');

const messages = document.getElementById('messages');

socket.on('load_messages', (msgs) => {
	msgs.forEach(add);
});

socket.on('chat_message', (msg) => {
	add(msg);
});

socket.on('refresh_messages', (msgs) => {
	messages.innerHTML = '';

	msgs.forEach(add);
});

function add(msg) {
	const div = document.createElement('div');

	div.innerHTML = '<b>' + msg.name + '</b>: ' + msg.text;

	messages.appendChild(div);
}

function send() {
	const text = document.getElementById('msg').value;

	socket.emit('chat_message', {
		name: name,

		text: text,
	});
}
