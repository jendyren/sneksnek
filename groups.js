function clean(str){
	str = str.trim().replace(/</g, '&lt').replace(/>/g, '&gt');
	return str;
}

function cleanName(str){
	console.log(typeof(str))
	str = clean(str);
	if(str.length > 15) str = str.substr(0, 15);
	return str;
}
var numpeople = 3;

module.exports = (http) => {
	var io = require('socket.io')(http);

	class Room{
		constructor(id, sockets){
			this.id = id;
			this.players = sockets;
		}
		start(){
			io.in(this.id).emit('starting', this.names);
		}
		addBlock(socket){
			let rn = Math.floor(Math.random() * this.players.length);
			if (rn == this.players.indexOf(socket)) rn = (rn+1) % this.players.length;
			this.players[rn].emit('addBlock');
		}
		addPoisonApple(socket){
			let rn = Math.floor(Math.random() * this.players.length);
			if (rn == this.players.indexOf(socket)) rn = (rn+1) % this.players.length;
			this.players[rn].emit('addPoisonApple');
		}
		died(socket){
			let ind = this.players.indexOf(socket);
			this.players.splice(ind, 1);
			io.in(this.id).emit('players', this.players.length);
		}
	}

	var rooms = {};
	var stor = {};
	var waiting = [];
	var countdown = 0;

	io.on('connection', (socket) => {
		let name = "";

		socket.on('joinRandom', () => {
			waiting.push(socket);
			socket.emit('waiting');
			console.log('waiting', waiting.length);
			if (waiting.length >= numpeople) {
				roomId = Math.round(Math.random()*1e10);
				rooms[roomId] = new Room(roomId, waiting.splice(0, numpeople));
				for (let s of rooms[roomId].players){
					s.join(roomId);
					stor[s.id] = roomId;
				}
				rooms[roomId].start();
			}
		});

		socket.on('addBlock', () => {
			let room = rooms[stor[socket.id]];
			room.addBlock(socket);
		});

		socket.on('addPoisonApple', () => {
			let room = rooms[stor[socket.id]];
			room.addPoisonApple(socket);
		});

		socket.on('die', () => {
			let room = rooms[stor[socket.id]];
			room.died(socket);
		});
		
		socket.on('disconnect', () => {
			if (socket.id in stor){
				let group = stor[socket.id];
				socket.leave(group);
				ind = rooms[group].players.indexOf(socket);
				delete rooms[group].players[ind];
				if (rooms[group].players.length == 0) delete rooms[group];
				delete stor[socket.id];
			}
			else {
				if (waiting.includes(socket)){
					waiting.splice(waiting.indexOf(socket), 1);
				}
			}
		});
		
	});
}