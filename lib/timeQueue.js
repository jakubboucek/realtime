
var EventEmitter = process.EventEmitter;

function Queue() {
	this.queue = {};

	this.getHash = function(user) {
		var time = new Date();
		return user + time.getTime();
	};
}


Queue.prototype.__proto__ = EventEmitter.prototype;

Queue.prototype.add = function(user, timestamp, data, callback) {
	var timeoutId;
	var now = new Date();
	var wait = timestamp>now.getTime() ? timestamp-now.getTime() : 1;
	var self = this;
	var itemId = this.getHash(user);
    console.log(wait);
	if (!this.queue[user]) {
		this.queue[user] = {};
	}
    
    timeoutId = setTimeout(function(user, itemId) {
    	self.emit('pop', user, itemId, self.queue[user][itemId].data);
    }, wait, user, itemId);

    
    this.queue[user][itemId] = {
    	timeoutId: timeoutId,
    	data: data 
    };

    callback(itemId);
};


Queue.prototype.delete = function(user, itemId){
    var data = this.queue[user][itemId];
	clearTimeout(data.timeoutId);
	delete this.queue[user][itemId];
};


Queue.prototype.getUserQueueData = function(user) {
	var data = {messages: {}};
	if (this.queue[user]) {
		for (var i in this.queue[user]) {
			console.log(this.queue[user][i].data);
			data.messages[i] = this.queue[user][i].data;
		}
	}
	return data;
};


module.exports = new Queue();