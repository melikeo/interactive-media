let mic;
let recorder;
let soundFile; // file to save audio
let recording = false;
let isPlaying = false;
let recordingTime = 5; // recording time in seconds

let mountainSpeed = 2;  // mountain speed
let cloudSpeed = 1;     // cloud speed

let mountainOffsets = []; // mountain offset
let cloudOffsets = [];  // cloud offset

let plane; // plane object
let fft; // FFT analyzer for frequency analysis

function setup() {
  createCanvas(800, 600);
  noStroke();

  mic = new p5.AudioIn(); // init microphone
  recorder = new p5.SoundRecorder(); // init recorder
  soundFile = new p5.SoundFile();

  // access to mic
  mic.start();
  recorder.setInput(mic);

  // initialize FFT analyzer
  fft = new p5.FFT();
  fft.setInput(mic); // apply FFT to mic

  // init mountain offset
  mountainOffsets = new Array(1); // number of mountain groups
  for (let i = 0; i < mountainOffsets.length; i++) {
    mountainOffsets[i] = i * (width / mountainOffsets.length); // initial mountain positions
  }

  // init cloud offset
  cloudOffsets = new Array(3); // number of cloud groups
  for (let i = 0; i < cloudOffsets.length; i++) {
    cloudOffsets[i] = [random(width), random(20, 100)]; // random x and y positions
  }

  plane = new Plane(); // create plane
}


function draw() {
  background(220); textSize(32);
  if (!recording && !isPlaying && soundFile.duration() === 0) {
    fill(0);
    textSize(32);
    textAlign(CENTER, CENTER);
    text("Click to start recording. Talk for 8 seconds.", width / 2, height / 2); // centered text
  } else if (recording) {
    // text during recording
    fill(255, 0, 0);
    textSize(32);
    textAlign(CENTER, CENTER);
    text("Recording in progress...", width / 2, height / 2); // centered text
  } else if (isPlaying) {
    background('#CBE6ED'); // sky

    // move and regenerate clouds
    for (let i = 0; i < cloudOffsets.length; i++) {
      cloudOffsets[i][0] -= cloudSpeed; // move clouds to the left
      if (cloudOffsets[i][0] < -200) {
        cloudOffsets[i][0] = width + random(200, 400); // new x position off-canvas
        cloudOffsets[i][1] = random(50, 100); // new random y position
      }
      drawClouds(cloudOffsets[i][0], cloudOffsets[i][1]);
    }

    // move and repeat mountains
    for (let i = 0; i < mountainOffsets.length; i++) {
      mountainOffsets[i] -= mountainSpeed; // move mountains to the left
      if (mountainOffsets[i] < -width) {
        mountainOffsets[i] += width; // reset position at right edge
      }
      drawMountains(mountainOffsets[i]);
    }

    // calculate pitch and adjust plane position
    let spectrum = fft.analyze();
    // let pitch = fft.getCentroid(); // calculate dominant frequency (pitch)
    // let normalizedPitch = map(pitch, 0, 10000, height, 0); // normalize pitch to canvas height
    // plane.y = normalizedPitch; // set plane height based on pitch
    let pitch = fft.getCentroid(); // calc dominant frequency
    let pitchRange = 200; // range from center

    // map around canvas center
    let normalizedPitch = map(pitch, 0, 10000, -pitchRange, pitchRange);
    plane.y = height / 1.5 + normalizedPitch; // plane position


    // display and fly the plane
    plane.show();
    plane.fly();
    plane.bounce();

  } else if (soundFile.duration() > 0) {
    fill(0);
    textSize(32);
    textAlign(CENTER, CENTER);
    text("Click to play the recording.", width / 2, height / 2 + 50); // centered text
  }
}

function drawClouds(xOffset, yOffset) {
  fill(255, 255, 255, 200); // white, semi-transparent clouds
  ellipse(xOffset, yOffset, 100, 60);    // cloud 1
  ellipse(xOffset + 40, yOffset, 80, 50); // cloud 2
  ellipse(xOffset - 40, yOffset, 80, 50); // cloud 3

  ellipse(xOffset + 200, yOffset + 50, 120, 70);   // cloud 4
  ellipse(xOffset + 240, yOffset + 50, 100, 60);   // cloud 5
  ellipse(xOffset + 160, yOffset + 50, 100, 60);   // cloud 6
}

function drawMountains(offset) {
  fill('#A57F6E');
  triangle(0 - 30 + offset, height - 60, width / 4 - 30 + offset, height * 3 / 4 - 60, width / 2 - 30 + offset, height - 60);
  triangle(width / 3 - 30 + offset, height - 60, width / 4 + width / 3 - 30 + offset, height * 3 / 4 - 60, width / 2 + width / 3 - 30 + offset, height - 60);
  triangle(width * 2 / 3 - 30 + offset, height - 60, width / 4 + width * 2 / 3 - 30 + offset, height * 3 / 4 - 60, width / 2 + width * 2 / 3 - 30 + offset, height - 60);

  fill('#7C5948');
  triangle(0 + offset, height, 0 + offset, height * 5 / 8, width / 4 + offset, height); 
  triangle(width / 5 + offset, height, width / 4 + width / 5 + offset, height * 5 / 8, width / 2 + width / 5 + offset, height); 
  triangle(width * 5 / 10 + offset, height, width / 4 + width * 5 / 10 + offset, height * 5.5 / 8, width / 2 + width * 5 / 10 + offset, height);

  //fill('#7C5948');
  //rect(0, height * 9 / 10, width, height / 10);
  fill('#5D483F');
  //rect(0, height * 9 / 10, width, height / 10); // rect(x, y, width, height)
  
  triangle(0 + offset, height, width / 4 + offset, height * 3 / 4, width / 2 + offset, height); //triangle (x1, y1, x2, y2, x3, y3)  
  triangle(width / 3 + offset, height, width / 4 + width / 3 + offset, height * 3 / 4, width / 2 + width / 3 + offset, height); 
  triangle(width * 2 / 3 + offset, height, width / 4 + width * 2 / 3 + offset, height * 3 / 4, width / 2 + width * 2 / 3 + offset, height); 

}

class Plane {
  constructor() {
    this.x = width / 2; // center of canvas
    this.y = 0; // above mountains
    this.speedx = 0;     // speed in x-direction
    this.speedy = 0;     // no movement in y-direction
  }
  show() {

    // //nose of plane
     fill(120);
     noStroke();

    // wing upwards
    triangle(this.x + 15, this.y, this.x - 15, this.y, this.x - 18, this.y - 60);

    // plane body
    rectMode(CENTER);
    rect(this.x+ 30, this.y, 120, 30, 0, 50, 20, 0);

    // cockpit window
    fill(255);
    rect(this.x + 75, this.y - 5, 15, 5, 0, 4, 0, 0);

    // passenger windows
    fill(255);    
    rect(this.x + 48, this.y - 5, 5, 5, 4);
    rect(this.x + 40, this.y - 5, 5, 5, 4);
    rect(this.x + 32, this.y - 5, 5, 5, 4);
    rect(this.x + 24, this.y - 5, 5, 5, 4);    
    rect(this.x + 16, this.y - 5, 5, 5, 4);
    // rect(this.x + 8, this.y - 5, 5, 5, 4);
    // rect(this.x, this.y - 5, 5, 5, 4);

    // wing downwards
    fill(120);
    triangle(this.x + 15, this.y, this.x - 15, this.y, this.x - 30, this.y + 80);

    // rear wing
    triangle(this.x - 10, this.y + 15, this.x - 45, this.y - 50, this.x - 45, this.y + 15);
    
  }
  fly() {
    this.x += this.speedx;
  }
  bounce() {
    if (this.x > width || this.x < 0) {
      this.speedx *= -1; // plane bounces at screen edges
    }
  }
}

// start audio recording
function startRecording() {
  recorder.record(soundFile); // record audio
  recording = true;
  setTimeout(stopRecording, recordingTime * 1000);
}

// stop recording
function stopRecording() {
  recorder.stop();
  recording = false;
  playRecording(); 
}

// start recording or playing recording with mouse click
function mousePressed() {
  if (!recording) {
    if (!isPlaying && soundFile.duration() === 0) {
      startRecording();
    } else if (!isPlaying) {
      playRecording();
    }
  }
}

// play recording
function playRecording() {
  soundFile.loop(); // loop sound playback
  fft.setInput(soundFile); // set FFT analyzer to recording
  isPlaying = true;
}

function keyPressed() {
  if (key === '+') {
    mountainSpeed += 1; // increase speed
  } else if (key === '-') {
    mountainSpeed = max(mountainSpeed - 1, 1); // decrease speed, minimum value 1
  }
}
