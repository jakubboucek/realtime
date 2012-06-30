
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

	if (!this.queue[user]) {
		this.queue[user] = {};
	}


    timeoutId = setTimeout(function(user, itemId) {
    	self.emit('pop', self.queue[user][itemId].data);
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
	this.queue[user][itemId] = null;
};


Queue.prototype.getUserQueueData = function(user) {
	var data = {messages: []};
	if (this.queue['user']) {
		return data.messages = this.queue['user'];
	}
	return data;
};


module.exports = new Queue();