var app = require('http').createServer(handler)
  , url = require('url')
  , io = require('socket.io').listen(app)
  , fs = require('fs')

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


io.sockets.on('connection', function (socket) {
	socket.emit('init');
	
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
		data.nickname = socket.nickname;
		data.createdTime = new Date().getTime();
		io.sockets.emit('new_message', data);
	});

	socket.on('disconnect', function () {
		if (socket.nickname) {
			var users = [];
			var clients = io.sockets.clients();
			for (var i in clients) {
				if (soc != socket) {
	        		users.push({nickname: clients[i].nickname});
	        	}
			}
			io.sockets.emit('user_list', {users: users});
    		io.sockets.emit('lost_user', {nickname: socket.nickname});
    	}
  	});
});

