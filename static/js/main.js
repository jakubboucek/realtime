$(function(){
	var socket = io.connect('/');
	socket.on('init', function (data) {
		console.log('init');
		$('#login').attr('disabled', false); //for refresh
		$('#login').focus().select();
	});

	$('#login_submit').click(function(){
		socket.emit('login', { nickname: $('#login').val() });
	});

	socket.on('ready', function (data) {
		console.log('ready');

		$('#login').attr('disabled', true);
		$('#messagebox').show();
		$('#message').focus();
		$('#log').text("");
	});

	socket.on('new_user', function (data) {
		console.log('new_user');
		$('#log').prepend("<div class=\"system\">User " + data.nickname + " is now connected :-)</div>");
	});

	socket.on('lost_user', function (data) {
		console.log('lost_user');
		$('#log').prepend("<div class=\"system\">Some user " + /*data.nickname +*/ " leave the room :-(</div>");
	});

	$('#message_submit').click(function(){
		var message = $('#message');
		socket.emit('put_message', { message: message.val() });
		message.val('');
		message.focus();
	});

	socket.on('new_message', function (data) {
		console.log('new_message');
		$('#log').prepend("<div><strong>" + data.nickname + ":</strong> " + data.message + "</div>");
	});

});

