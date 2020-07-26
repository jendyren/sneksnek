let backgroundColor, playerSnake, currentApple, badApple, score, obstacles, highScore;


function setup() {
  // Canvas & color settings
  createCanvas(400, 400);
  colorMode(HSB, 360, 100, 100);
  backgroundColor = 95;
  frameRate(10);
  playerSnake = new Snake();
  obstacles = [];
  goodApple = new Apple(false);
  badApples = [new Apple(true)];
  score = 0;
}

function draw(){
  background(backgroundColor)
  // The snake performs the following four methods:
  playerSnake.move();
  playerSnake.checkCollisions()
  playerSnake.checkApples()
  // The apple needs fewer methods to show up on screen.
  for(let o of obstacles)
    o.show();
  
  if(Math.floor(playerSnake.tail.length/5) > obstacles.length)
    obstacles.push(new Obstacle());
  
  goodApple.show()
  badApples[0].show()
  // We put the score in its own function for readability.
  displayScore()
}
function displayScore() {
  fill(0)
  text(`Score: ${score}`, 20, 20)
  text(`High score: ${highScore}`, 20, 40)
}


class Snake {
  constructor() {
    this.size = 10;
    this.x = round(width/20);
    this.y = round(height/10 - 1);
    this.dir = createVector(0,-1);
    this.tail = [new TailSegment(this.x, this.y, color(random(360),80,80))];
  }
  move(){
    var w = round(width/10);
    var h = round(height/10)
    this.x += this.dir.x;
    this.y += this.dir.y;
    this.x = (this.x + w)%w;
    this.y = (this.y + h)%h;
    this.tail.unshift(new TailSegment(this.x, this.y, color(random(360),80,80)))
    this.tail.pop()
    this.show();
  }
  show() {
    stroke(240, 100, 100)
    noFill()
    rect(this.x*10, this.y*10, this.size)
    noStroke()
    for (let i = 0; i < this.tail.length; i++) {
      this.tail[i].showSelf()
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
    if (collideRectRect(this.x, this.y, this.size, this.size, a.x, a.y, a.size, a.size)) {
      if(a.isBad) score -= 2;
      else{
        score += 1
        highScore = Math.max(highScore, score);
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
          gameOver();
    for(let o of obstacles)
      if(collideRectRect(this.x, this.y, this.size, this.size, o.x, o.y, o.sizeX, o.sizeY))
        gameOver();
  }
  extendTail() {
    let lastTailSegment = this.tail[this.tail.length - 1]
    this.tail.push(new TailSegment(lastTailSegment.x, lastTailSegment.y, color(random(360),80,80)))
  }
}

class TailSegment {
  constructor(x, y, c) {
    this.x = x;
    this.y = y;
    this.c = c;
    this.size = 10;
  }
  showSelf() {
    fill(this.c);
    rect(this.x*10, this.y*10, this.size);
  }
}

class Apple {
  constructor(n) {
    this.place();
    this.size = 10;
    this.isBad = n;
    if(this.isBad) this.c = color(120,80,80);
    else this.c = color(0,80,80)
  }
  
  place(){
    this.x = round(random(width/10- 1))
    this.y = round(random(height/10 - 1))
    for(let o of obstacles)
      if(collideRectRect(this.x,this.y, this.size, this.size, o.x, o.y, o.sizeX, o.sizeY)){
        this.x = round(random(width/10 - 1))
        this.y = round(random(height/10 - 1))
      }
  }
  show() {
    fill(this.c)
    rect(this.x*10, this.y*10, this.size)
  }
}

class Obstacle{
  constructor(){
    this.x = round(random(width/10-1))
    this.y = round(random(height/10-1))
    this.size = 10
  }
  show(){
    fill(70);
    rect(this.x*10, this.y*10, this.size);
  }
}

function keyPressed() {
  switch(keyCode){
    case UP_ARROW:
      if(playerSnake.dir.y == 0) playerSnake.dir.set(0,-1);
      break;
    case DOWN_ARROW:
      if(playerSnake.dir.y == 0) playerSnake.dir.set(0,1);
      break;
    case RIGHT_ARROW:
      if(playerSnake.dir.x == 0) playerSnake.dir.set(1,0);
      break;
    case LEFT_ARROW:
      if(playerSnake.dir.x == 0) playerSnake.dir.set(-1,0);
      break;
    case 32:
      restartGame();
      break
    default:
      break;
  }
}


function restartGame() {
  score = 0
  playerSnake = new Snake()
  currentApple = new Apple()
  loop()
  obstacles = [new Obstacle()]
}

function gameOver() {
  stroke(0)
  text("GAME OVER", 50, 70)
  noLoop()
}
function die(){
	socket.emit('die');
}

socket.on('addBlock', () => {
  obstacles.push(new Obstacle());
});
socket.on('addPoisonApple', () => {
  
});