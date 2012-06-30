var app = require('http').createServer(handler)
  , url = require('url')
  , io = require('socket.io').listen(app)
  , fs = require('fs')
  , queue = require('./lib/timeQueue.js')


app.listen(8080);

function handler (req, res) {
    var parsedUrl = url.parse(req.url);
    var patt = new RegExp('^/static');
    var filename = '';

    if (patt.test(parsedUrl.pathname)) {
    	filename = __dirname + parsedUrl.pathname;
    } else {
		filename = __dirname + '/index.html';
	}
	fs.readFile(filename, function (err, data) {
		if (err) {
		  res.writeHead(500);
		  return res.end('Error loading index.html');
		}

		res.writeHead(200);
		res.end(data);
	});
}


queue.on('pop', function(user, itemId, data){
	io.sockets.emit('new_message', data);
	queue.delete(user, itemId);
	var clients = io.sockets.clients();
	for (var i in clients) {
		if (clients[i].nickname == user) {
    		clients[i].emit('user_waiting_messages', queue.getUserQueueData(clients[i].nickname));
		}
	}
});


io.sockets.on('connection', function (socket) {
	socket.emit('init');
	socket.emit('user_waiting_messages', queue.getUserQueueData(socket.nickname));
	socket.on('login', function (data) {
		socket.nickname = data.nickname;
		socket.emit('ready');
		var users = [];
		var clients = io.sockets.clients();
		for (var i in clients) {
        	users.push({nickname: clients[i].nickname});
		}
		console.log(users);
		io.sockets.emit('user_list', {users: users});
		socket.broadcast.emit('new_user', {
		    nickname: data.nickname  
		});  
	});

	socket.on('put_message', function (data) {
		if (data.writingToken) {
			sockets.broadcast.emit('delete_notify_writing', {
				writingToken: data.writingToken
			});
		}

		data.nickname = socket.nickname;
		data.createdTime = new Date().getTime();
		queue.add(socket.nickname, data.publishTime, data, function() {
			socket.emit('user_waiting_messages', queue.getUserQueueData(socket.nickname));
		});
		
	});


	socket.on('notify_writing', function (data){
		socket.broadcast.emit('notify_writing', data);
	});



	socket.on('disconnect', function () {
		if (socket.nickname) {
			var users = [];
			var clients = io.sockets.clients();
			for (var i in clients) {
				if (clients[i] != socket) {
	        		users.push({nickname: clients[i].nickname});
	        	}
			}
			io.sockets.emit('user_list', {users: users});
    		io.sockets.emit('lost_user', {nickname: socket.nickname});
    	}
  	});
});

