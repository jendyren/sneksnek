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
		addBlock(socket){
			console.log('sending wall');
			let rn = Math.floor(Math.random() * this.players.length);
			if (rn == this.players.indexOf(socket)) rn = (rn+1) % this.players.length;
			io.to(this.players[rn].id).emit('addBlock');
		}
		addPoisonApple(socket){
			console.log('sending poison apple');
			let rn = Math.floor(Math.random() * this.players.length);
			if (rn == this.players.indexOf(socket)) rn = (rn+1) % this.players.length;
			io.to(this.players[rn].id).emit('addPoisonApple');
		}
		died(socket){
			let ind = this.players.indexOf(socket);
			this.players.splice(ind, 1);
			io.in(this.id).emit('players', this.players.length);

			if (this.players.length <= 1){
				io.in(this.id).emit('gameOver', this.players.length);
			}
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
				console.log('starting');
				io.in(roomId).emit('starting', rooms[roomId].players.length);
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
				if (ind >= 0) delete rooms[group].players[ind];
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