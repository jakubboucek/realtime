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
		console.log(data);
		socket.emit('put_message',data);
		message.val('');
		message.focus();
	});

	socket.on('new_message', function (data) {
		console.log('new_message');
		console.log(data);
		$('#log').prepend("<div><strong title=\""+ date2str(new Date(data.createdTime)) +"\">" + data.nickname + ":</strong> " + data.message + "</div>");
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
		console.log('users_list');
		var messages = data.messages;

		console.log(messages);
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