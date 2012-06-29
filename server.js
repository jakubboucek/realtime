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
		socket.set('nickname', data.nickname, function() {
			socket.emit('ready');
			socket.broadcast.emit('new_user', {
		    	nickname: data.nickname  
			});
		});  
	});

	socket.on('msg', function (data) {
		data.nickname = socket.get('nickname');
		data.createdTime = new Date.getTime();
		socket.broadcast.emit('new_msg', data)
	});

	sockets.on('disconnect', function (socket) {
		socket.broadcast.emit('lost_user', {
	    	nickname: socket.get('nickname')
	    });
	});
});

