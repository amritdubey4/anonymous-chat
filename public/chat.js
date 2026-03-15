const socket = io();

const name = localStorage.getItem('name');

const messages = document.getElementById('messages');
const users = document.getElementById('users');
const userCount = document.getElementById('userCount');

socket.emit('join', name);

socket.on('load_messages', (msgs) => {
	messages.innerHTML = '';
	msgs.forEach(add);
});

socket.on('chat_message', (msg) => {
	add(msg);
});

socket.on('refresh_messages', (msgs) => {
	messages.innerHTML = '';
	msgs.forEach(add);
});

socket.on('user_list', (list) => {
	users.innerHTML = '';

	list.forEach((u) => {
		const li = document.createElement('li');

		li.innerText = u;

		users.appendChild(li);
	});

	userCount.innerText = 'Online: ' + list.length;
});

function add(msg) {
	const div = document.createElement('div');

	div.className = 'message';

	div.innerHTML = '<b>' + msg.name + '</b>: ' + msg.text;

	messages.appendChild(div);
}

function send() {
	const text = document.getElementById('msg').value;

	socket.emit('chat_message', {
		name: name,
		text: text,
	});

	document.getElementById('msg').value = '';
}

function toggleTheme() {
	document.body.classList.toggle('dark');
}

setInterval(() => {
	const now = Date.now();

	const expire = 30 * 60 * 1000;

	let remaining = expire - (now % expire);

	let minutes = Math.floor(remaining / 60000);

	let seconds = Math.floor((remaining % 60000) / 1000);

	document.getElementById('timer').innerText =
		'Messages reset in ' + minutes + ':' + seconds;
}, 1000);
