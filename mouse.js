let path = [];  // saving mouse movements in an array
let recording = true;
let index = 0;  // current position of object on the route
let speed = 1;  // speed of object
let slider;  // for speed control

function setup() {
  createCanvas(800, 600);
  slider = createSlider(1, 10, 1);  // Slider 1 to 10 for speed
  slider.position(10, height + 10);  // Slider position below canvas
}

function draw() {
  background(220);

  speed = slider.value();

  // save mouse movements
  if (recording && mouseIsPressed) {
    path.push(createVector(mouseX, mouseY));  // save current mouse position
  }

  // draw route
  noFill();
  stroke(0);
  beginShape();
  for (let i = 0; i < path.length; i++) {
    vertex(path[i].x, path[i].y);
  }
  endShape();

  // move object (plane) along route Flugzeug
  if (path.length > 0 && index < path.length) {
    fill(255, 0, 0);  // color of plane (red)
    ellipse(path[index].x, path[index].y, 20, 20);  // plane to be replaced (circle)
    index += speed;  // speed of plane (adjustable with slider)
  }

  // restart route when plane reached the end
  if (index >= path.length) {
    index = 0;  // goes back to the start
  }
}

// start and stop recording with space key
function keyPressed() {
  if (key == ' ') {
    recording = !recording;
  }
}