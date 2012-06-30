

function MessageHistory(){
	this.data = [];
}

MessageHistory.prototype.add = function(data) {
	this.data.push(data);
};


MessageHistory.prototype.getHistoryData = function() {
	return this.data;
};

module.exports = new MessageHistory();