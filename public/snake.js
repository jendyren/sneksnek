var socket = io();

socket.emit('joinRandom');

let backgroundColor, playerSnake, goodApple, badApples, obstacles, gSize, gameOver;
let colors = ["#dc5844", "#df8449", "#ead759", "#7eeb59", "#6ccfeb", "#476ee6", "#643ce5", "#b74be7"];


socket.on('starting', numPlayers => {
	
	console.log('starting');
	document.getElementById('players').innerHTML = "Players: " + numPlayers;

	let p = new p5(s);
});



let s = function(sketch){
  sketch.setup = function() {
		// Canvas & color settings
    gameOver = false;
		let vmin = Math.min(window.innerWidth, window.innerHeight);
		const canvSize = 40 * Math.floor((vmin - window.innerHeight/5)/40);
		sketch.createCanvas(canvSize, canvSize);
		gSize = sketch.width/40;
		console.log(gSize);
		sketch.colorMode(sketch.HSB, 360, 100, 100);
		backgroundColor = 95;
		sketch.frameRate(10);
		playerSnake = new Snake();
		obstacles = [];
		goodApple = new Apple(false);
		badApples = [new Apple(true)];
	}

	sketch.draw = function(){
    if(!gameOver){
      sketch.background(backgroundColor);

      playerSnake.move();
      playerSnake.checkCollisions();
      playerSnake.checkApples();
      //console.log(obstacles.length + "|" + badApples.length);
    
      for(let o of obstacles)
        o.show();
      goodApple.show();
      for(let ba of badApples)
        ba.show();
    }
	}

	class Snake {
		constructor() {
			this.size = 1;
			this.x = sketch.round(sketch.width/(gSize*2));
			this.y = sketch.round(sketch.height/gSize - 1);
			this.dir = sketch.createVector(0,-1);
			this.isBegin = true;
			this.tail = [new TailSegment(this.x, this.y)];
		}
		move(){
			var w = sketch.round(sketch.width/gSize);
			var h = sketch.round(sketch.height/gSize)
			this.x += this.dir.x;
			this.y += this.dir.y;
			this.x = (this.x + w)%w;
			this.y = (this.y + h)%h;
			if(this.isBegin) this.extendTail();
			this.tail.unshift(new TailSegment(this.x, this.y))
			this.tail.pop()
			this.show();
		}
		show() {
			sketch.stroke(240, 100, 100)
			sketch.noFill()
			sketch.rect(this.x*gSize, this.y*gSize, this.size*gSize)
			sketch.noStroke()
			for (let i = 0; i < this.tail.length; i++) {
				this.tail[i].showSelf(i)
			}
		}
		checkApples() {
			// If the head of the snake collides with the apple...
			if(this.collideApple(goodApple))
				goodApple.place();
			for(let ba of badApples)
				if(this.collideApple(ba))
					ba.place();
		}
		collideApple(a){
			if (sketch.collideRectRect(this.x, this.y, this.size-0.1, this.size-0.1, a.x, a.y, a.size-0.1, a.size-0.1)) {
				if(a.isBad){
					playerSnake.tail.pop();
          if(playerSnake.tail.length == 0) sketch.end("GAME OVER");
				}else{
					var rng = sketch.round(sketch.random(2));
					if(obstacles.length == 0) rng = 1;
					if(badApples.length == 1) rng = 0;
					if(obstacles.length == 0 && badApples.length == 1) rng = 2;

					if(rng == 0){
						obstacles.pop();
						socket.emit("addBlock");
					}else if(rng == 1){
						badApples.pop();
						socket.emit("addPoisonApple");
					}else{
						if(sketch.round(sketch.random(2)) == 0) socket.emit("addBlock");
						else socket.emit("addPoisonApple");
					}
					this.extendTail()
				}
				return true;
			}
			else return false;
		}
		checkCollisions() {
			if (this.tail.length > 2)
				for (let i=1; i < this.tail.length; i++)
					if (this.x == this.tail[i].x && this.y == this.tail[i].y)
						sketch.end("GAME OVER");
			for(let o of obstacles)
				if(sketch.collideRectRect(this.x, this.y, this.size-0.1, this.size-0.1, o.x, o.y, o.size-0.1, o.size-0.1))
					sketch.end("GAME OVER");
		}
		extendTail() {
			let lastTailSegment = this.tail[this.tail.length - 1]
			this.tail.push(new TailSegment(lastTailSegment.x, lastTailSegment.y));
			if(playerSnake.tail.length >= 8) 
				this.isBegin = false;
			// if(playerSnake.tail.length%5 == 0)
			// 	obstacles.push(new Obstacle());
		}
	}

	class TailSegment {
		constructor(x, y) {
			this.x = x;
			this.y = y;
			this.size = 1;
		}
		showSelf(i) {
			sketch.fill(colors[i%8]);
			sketch.rect(this.x*gSize, this.y*gSize, this.size*gSize);
		}
	}

	class Apple {
		constructor(n) {
			this.place();
			this.size = 1;
			this.isBad = n;
			if(this.isBad) this.c = sketch.color(120,80,80);
			else this.c = sketch.color(0,80,80)
		}
		
		place(){
			this.x = sketch.round(sketch.random(sketch.width/gSize- 1))
			this.y = sketch.round(sketch.random(sketch.height/gSize - 1))
			for(let o of obstacles)
				if(sketch.collideRectRect(this.x,this.y, this.size-0.1, this.size-0.1, o.x, o.y, o.size-0.1, o.size-0.1)){
					this.x = sketch.round(sketch.random(sketch.width/gSize - 1))
					this.y = sketch.round(sketch.random(sketch.height/gSize - 1))
				}
		}
		show() {
			sketch.fill(this.c)
			sketch.rect(this.x*gSize, this.y*gSize, this.size*gSize)
		}
	}

	class Obstacle{
		constructor(){
			this.x = sketch.round(sketch.random(sketch.width/gSize-1))
			this.y = sketch.round(sketch.random(sketch.height/gSize-1))
			this.size = 1
		}
		place(){
			this.x = sketch.round(sketch.random(sketch.width/gSize-1))
			this.y = sketch.round(sketch.random(sketch.height/gSize-1))
			while(sketch.collideRectRect(this.x,this.y, this.size-0.1, this.size-0.1, goodApple.x, goodApple.y, goodApple.size-0.1, goodApple.size-0.1)){
				this.x = sketch.round(sketch.random(sketch.width/gSize-1))
			  this.y = sketch.round(sketch.random(sketch.height/gSize-1))
			}
			for(ba of badApples){
				while(sketch.collideRectRect(this.x,this.y, this.size-0.1, this.size-0.1, ba.x, ba.y, ba.size-0.1, ba.size-0.1)){
				  this.x = sketch.round(sketch.random(sketch.width/gSize-1))
			  this.y = sketch.round(sketch.random(sketch.height/gSize-1))
				}
			}
			for(t of playerSnake.tail){
				while(collideRectRect(this.x,this.y, this.size-0.1, this.size-0.1, t.x, t.y, t.size-0.1, t.size-0.1)){
					this.x = sketch.round(sketch.random(sketch.width/gSize-1))
			  this.y = sketch.round(sketch.random(sketch.height/gSize-1))
				}
			}
			while(collideRectRect(this.x,this.y, this.size-0.1, this.size-0.1, playerSnake.x, playerSnake.y, playerSnake.size-0.1, playerSnake.size-0.1)){
				this.x = sketch.round(sketch.random(sketch.width/gSize-1))
			  this.y = sketch.round(sketch.random(sketch.height/gSize-1))
			}
		}
		show(){
			sketch.fill(70);
			sketch.rect(this.x*gSize, this.y*gSize, this.size*gSize);
		}
	}

	sketch.keyPressed = function() {
		switch(sketch.keyCode){
			case sketch.UP_ARROW:
				if(playerSnake.dir.y == 0) playerSnake.dir.set(0,-1);
				break;
			case sketch.DOWN_ARROW:
				if(playerSnake.dir.y == 0) playerSnake.dir.set(0,1);
				break;
			case sketch.RIGHT_ARROW:
				if(playerSnake.dir.x == 0) playerSnake.dir.set(1,0);
				break;
			case sketch.LEFT_ARROW:
				if(playerSnake.dir.x == 0) playerSnake.dir.set(-1,0);
				break;
			default:
				break;
		}
	}

	sketch.end = function(t){
    sketch.background(backgroundColor);
		sketch.stroke(0);
    sketch.textSize(sketch.width/10)
    sketch.textAlign(sketch.CENTER);
    console.log(t);
		sketch.text(t, sketch.width/2, sketch.height/2);
    if(t != "YOU WON")
      socket.emit('die');
    sketch.noLoop();
    gameOver = true;
	}

  sketch.gameOver = function(){
    sketch.noLoop();
  }

	socket.on('players', numPlayers => {
		document.getElementById('players').innerHTML = "Players: " + numPlayers;
	});
	socket.on('gameOver', numPlayers => {
    if(!gameOver){
      sketch.end("YOU WON");
    }
		// sketch.gameOver();
	})
	socket.on('addBlock', () => {
		obstacles.push(new Obstacle());
		obstacles.push(new Obstacle());
	});
	socket.on('addPoisonApple', () => {
		badApples.push(new Apple(true));
	});
}