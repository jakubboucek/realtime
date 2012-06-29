var app = require('http').createServer(handler)
  , io = require('socket.io').listen(app)
  , fs = require('fs')

app.listen(8080);

function handler (req, res) {
  fs.readFile(__dirname + '/index.html',
  function (err, data) {
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
		});  
	});
	socket.on('msg', function (data) {
		socket.broadcast.emit('new_msg', data)
	});
});