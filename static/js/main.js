$(function(){
	var socket = io.connect('/');

	$('input').each(function(){
		var $el = $(this);
		if($el.attr('data-onenter')) {
			$el.keypress(function(e) {
				if (e.keyCode == '13') {
					$('#'+$(this).attr('data-onenter')).click();
				}
			});
		}
	});

	var resetMessageTime = function(){
		var message_time_element = $('#message_time');
		message_time_element.val(date2str(new Date()));
	};

	$('.message_time_increment').click(function(e){
		e.preventDefault();
		var $link = $(this);
		var increment_value = parseInt($link.attr('data-increment-value'));
		if(increment_value == 0) {
			return false;
		}
		var message_time_element = $('#message_time');
		var current_time = str2date(message_time_element.val());
		if(!current_time) {
			current_time = new Date();
		}
		if(current_time < new Date()) {
			current_time = new Date();
		}
		//Date to timestamp
		current_time = current_time.getTime();

		current_time += increment_value * 1000;


		message_time_element.val(date2str(new Date(current_time)));
	});

	socket.on('init', function (data) {
		console.log('init');
		$('#login').attr('disabled', false); //for refresh
		$('#login').focus().select();
	});

	$('#login_submit').click(function(){
		var nickname = $('#login').val();
		if(nickname == "") {
			alert("Please fill your nickname.");
			$('#login').focus();
			return false;
		}

		socket.emit('login', {nickname: nickname});
	});

	socket.on('ready', function (data) {
		console.log('ready');

		$('#login').attr('disabled', true);
		$('#login_submit').hide();
		$('#messagebox').show();
		$('#message').focus();
		resetMessageTime();
		$('#log').text("");
	});

	socket.on('new_user', function (data) {
		console.log('new_user');
		$('#log').prepend("<div class=\"system\">User " + data.nickname + " is now connected :-)</div>");
	});

	socket.on('lost_user', function (data) {
		console.log('lost_user');
		$('#log').prepend("<div class=\"system\">User " + data.nickname + " leave the room :-(</div>");
	});

	$('#reset').click(resetMessageTime);

	$('#message').keyup(function(){
		var field = $(this);
		var token = field.attr('data-writing-token');
		var nickname = $('#login').val();
		var prev_message = field.attr('data-previous-message');
		var message = field.val();
		if( ! token) {
			token = hex_md5(nickname + "." + new Date().getTime());
			field.attr('data-writing-token', token);
			field.attr('data-previous-message', "");
			prev_message = "";
		}
		if(message == prev_message) {
			return;
		}
		field.attr('data-previous-message', message);
		var data =  {
			writingToken: token,
			message: message
		};
		socket.emit('notify_writing', data);
	});

	socket.on('notify_writing', function (data) {
		var edit_el = $('#' + data.writingToken);
		if(edit_el.length == 0) {
			edit_el = $('<div class="preview"><strong class="name">' + data.nickname + ':</strong> <span class="message"></span></div>');
			edit_el.attr('id', data.writingToken);
			$('#log').prepend(edit_el);
		}
		$('.message', edit_el).text(data.message);
	});

	socket.on('delete_notify_writing', function (data) {
		var edit_el = $('#' + data.writingToken);
		if(edit_el.length) {
			edit_el.remove();
		}
	});

	$('#message_submit,#message_submit_later').click(function(){
		var now = $(this).attr('id') == 'message_submit';
		console.log(now?"send message NOW":"send message DELAY");
		var message = $('#message');
		if(message.val() == "") {
			alert("Please fill your message.");
			$('#message').focus();
			return false;
		}
		var data =  {message: message.val()};
		if(!now) {
			var publishTime = str2date($('#message_time').val());
			if(!isFinite(publishTime)) {
				alert("Please fill valid time.");
				$('#message_time').focus();
				return false;

			}
			data.publishTime = publishTime.getTime();
		}
		var token = message.attr('data-writing-token');
		if(token) {
			data.writingToken = token;
		}
		console.log(data);
		socket.emit('put_message',data);
		message
			.removeAttr('data-writing-token')
			.removeAttr('data-previous-message')
			.val('')
			.focus();
		resetMessageTime();
	});

	socket.on('new_messages', function (data) {
		console.log(data);
		var messages = data.messages;
		for(messageid in messages) {
			var message = messages[messageid];
			var chatLine = $('<div><strong class="name">' + message.nickname + ':</strong> <span class="time">('+ date2str(new Date(message.createdTime)) +')</span> <span class="message"></span></div>');
			$('.message', chatLine).text( message.message );
			$('#log').prepend(chatLine);
		}
	});

	socket.on('user_list', function (data) {
		console.log('users_list');
		var users = data.users;

		var user_list_ul = $('<ul />');
		$('#userlist').html(user_list_ul);

		for(userid in users) {
			var user = users[userid];
			var nickname = user.nickname;
			if('undefined' == typeof nickname) continue;
			console.log(nickname);
			var nickhash = hex_md5(nickname);
			var image_url = "http://www.gravatar.com/avatar/" + nickhash + "?s=16&d=identicon";
			user_list_ul.append('<li><img src="' + image_url + '"> ' + nickname + '</li>');
		}
	});

	socket.on('user_waiting_messages', function (data) {
		console.log('user_waiting_messages');
		var messages = data.messages;
		var messages_list_ul = $('<ul />');
		$('#messageslist').html(messages_list_ul);

		for(messageid in messages) {
			var message = messages[messageid];
			if('undefined' == typeof message.publishTime) {
				continue;
			}
			messages_list_ul.append('<li>'  + timestamp2str(message.publishTime) + '</li>');
		}
	});

});

function str2date(str) {
	var reg = /(\d+)[.\/ ]\s*(\d+)[.\/ ]\s*(\d+)\s+(\d+)[.-: ](\d+)([.-: ](\d+))?/;
	var strips = str.match(reg);
	console.log(strips);
	if(!strips)
		return null;
	return new Date(strips[3],strips[2]-1,strips[1],strips[4],strips[5], strips[7]);
}

function date2str(date) {
	var d = date.getDate();
    var m = date.getMonth()+1;
    var y = date.getFullYear();
    var datedate = ''+ d +'. '+ m +'. ' + y;

	var h = date.getHours();
    var i = date.getMinutes();
    var s = date.getSeconds();
	var datetime = '' + (h<=9?'0'+h:h) +':'+ (i<=9?'0'+i:i) +':'+ (s<=9?'0'+s:s);
	return datedate + " " + datetime;
}

function timestamp2str(timestamp) {
	return date2str(new Date(timestamp));
}

function str2timestamp(str) {
	return str2date(str).getTime();
}