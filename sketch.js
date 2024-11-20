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
let amplitude; //for volume

//let silenceThreshold = 400; // to exclude background sounds

let bgColor = 220;
let isFirstPlay = true;

let input;

let particles = []; // Array für Partikel

// particle class
class Particle {
  constructor(x, y, size) {
    this.x = x;
    this.y = y;
    this.size = size;
    this.alpha = 255; // transparency
  }

  update() {
    this.x -= 1; // to move to left
    this.alpha -= 5;
  }

  display() {
    fill(255, this.alpha);
    noStroke();
    ellipse(this.x, this.y, this.size);
  }

  isFinished() {
    return this.alpha <= 0; // returns true if finished
  }
}



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
  fft = new p5.FFT(); // new FFT object
  fft.setInput(mic); // apply FFT to mic
  amplitude = new p5.Amplitude(); // initialize new amplitude object
  amplitude.setInput(soundFile); //set input source for amplitude


  let numMountains = 2;
  // init mountain offset
  mountainOffsets = new Array(numMountains); // number of mountain groups
  for (let i = 0; i < numMountains; i++) {
    mountainOffsets[i] = (width / numMountains) * i; // initial mountain positions
  }

  // init cloud offset
  cloudOffsets = new Array(3); // number of cloud groups
  for (let i = 0; i < cloudOffsets.length; i++) {
    cloudOffsets[i] = [random(width), random(20, 100)]; // random x and y positions
  }

  plane = new Plane(); // create plane

  slider = createSlider(1, 10, 1);  // Slider 1 to 10 for speed
  slider.position(10, height + 10);  // Slider position below canvas
  slider.hide();

  let daytimeButton = createButton('Change Daytime');
  daytimeButton.position(width - 100, height + 10);
  daytimeButton.mousePressed(changeDaytime);


  // // Create input field for recording time
  // input = createInput(''); // empty string as default
  // input.position(width / 2, height / 2); // position below canvas center
  // input.size(100);
  // input.attribute('placeholder', 'Recording Time (s)');
  // input.changed(handleInput); // Handle input change
  // input.hide();

}

function changeDaytime() {
  if (isPlaying) {
    bgColor = (bgColor === '#CBE6ED') ? '#11163D' : '#CBE6ED';
  }
}


// function handleInput() {
//   let time = parseFloat(input.value());
//   if (!isNaN(time) && time > 0) { // Check if input is a valid number
//     recordingTime = time; // Set recording time to user input
//     input.hide();
//     startRecording(); // Start recording after input
//   } else {
//     alert('Please enter a valid number greater than 0.');
//   }
// }


function draw() {
  
  mountainSpeed = cloudSpeed = slider.value();
  if (!isPlaying) {
    bgColor = 220;
  }
  background(bgColor); 
  textSize(32);

  if (isPlaying) {
    if (isFirstPlay) {
      bgColor = '#CBE6ED';
      isFirstPlay = false;
    }
  } else {
    bgColor = 220;
  }

  if (!recording && !isPlaying && soundFile.duration() === 0) {
    fill(0);
    textSize(32);
    textAlign(CENTER, CENTER);
    text("Use the + and - keys to change the recording time \n (1-60s). \n\n Click to start recording. \n\n Talk for " + recordingTime + " seconds.", width / 2, height / 2); // centered text
    //input.show(); 
  } else if (recording) {
    // text during recording
    fill(255, 0, 0);
    textSize(32);
    textAlign(CENTER, CENTER);
    text("Recording in progress...", width / 2, height / 2); // centered text
  } else if (isPlaying) {    
    //background(bgColor);  // sky
    slider.show();
    soundFile.rate(slider.value());
    

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
      if (mountainOffsets[i] < -width/mountainOffsets.length) {
        mountainOffsets[i] += width; // reset position at right edge
      }
      drawMountains(mountainOffsets[i]);
    }

    // calculate pitch and adjust plane position
    let spectrum = fft.analyze(); //analyze audio spectrum
    let pitch = fft.getCentroid(); //  calculate dominant frequency (pitch)
    let pitchRange = 200; // range from center
    let pitchMin = 100;
    let pitchMax = 5000;

    // map around canvas center
    //let normalizedPitch = map(pitch, 0, 10000, -pitchRange, pitchRange); // normalize pitch to canvas height

    plane.y = map(pitch, pitchMin, pitchMax, height / 3, height / 4); //plane flies between 1.5 and 4

    // if (pitch < silenceThreshold) {
    //   pitch = 0;
    // }

    let level = amplitude.getLevel();
    //let particleSize = map(pitch, pitchMin, pitchMax, 5, 20); // particle size depending on frequency
    let particleSize = map(level, 0, 1,  5, 50); //particle size depending on volume

    // create new particles at plane
    particles.push(new Particle(plane.x - 20, plane.y-40, particleSize)); // top wing exhaust
    particles.push(new Particle(plane.x - 20, plane.y+40, particleSize)); // bottom wing exhaust

    // update particles and move
    for (let i = particles.length - 1; i >= 0; i--) {
      particles[i].update();
      particles[i].display();
      if (particles[i].isFinished()) {
        particles.splice(i, 1); // remove particle if gone
      }
    }

    // display and fly the plane
    plane.show();

    // let level = amplitude.getLevel();
    // let volumeHeight = map(level, 0, 1, 0, 200); // map so it is a good variable to multiple the clouds with??
    // let cloudSize = map(level, 0, 1, 40, 120);

    fill(0);
    textSize(20);
    textAlign(LEFT, BOTTOM);
    text("Frequency/Pitch: " + pitch.toFixed(2) + " Hz", 10, 50); // Display pitch value    

  } else if (soundFile.duration() > 0) {
    fill(0);
    textSize(32);
    textAlign(CENTER, CENTER);
    text("Click to play the recording.", width / 2, height / 2 + 50); // centered text
  }
}

function drawClouds(xOffset, yOffset) {

  let level = amplitude.getLevel(); //get volume of audio
  let cloudSize = map(level, 0, 1, 100, 200); // size of clouds based on volume
  
  fill(255, 255, 255, 200); // white, semi-transparent clouds
  
  ellipse(xOffset, yOffset, cloudSize, cloudSize * 0.6); // cloud 1
  ellipse(xOffset + 40, yOffset, cloudSize * 0.8, cloudSize * 0.5); // cloud 2
  ellipse(xOffset - 40, yOffset, cloudSize * 0.8, cloudSize * 0.5); // cloud 3

  ellipse(xOffset + 200, yOffset + 50, cloudSize * 1.2, cloudSize * 0.7); // cloud 4
  ellipse(xOffset + 240, yOffset + 50, cloudSize, cloudSize * 0.6); // cloud 5
  ellipse(xOffset + 160, yOffset + 50, cloudSize, cloudSize * 0.6); // cloud 6
  
  fill(0);
  textSize(20);
  textAlign(LEFT, CENTER);
  text("Volume: " + level.toFixed(2), 10, 10); // Display volume value (0-1)
}

function drawMountains(offset) {
  let mountainWidth = width / mountainOffsets.length; // width of a single mountain
  let mountainHeight = height / 5; // height of mountains
  
  // larger mountain in the back
    fill('#7C5948');
    let secondRangeHeight = mountainHeight * 1.4;
    for (let i = 0; i <= mountainOffsets.length; i++) {
      let x = offset + i * mountainWidth;
      triangle(
        x, height,
        x + mountainWidth / 2, height - secondRangeHeight,
        x + mountainWidth, height
      );
    }
    
    // Third mountain range (mountains with offset)
  fill('#5D483F');
  let thirdRangeHeight = mountainHeight * 1.2; // even taller for depth effect
  for (let i = 0; i <= mountainOffsets.length; i++) {
    let x = offset + i * mountainWidth + mountainWidth / 2; // offset for peak positioning
    triangle(
      x, height,
      x + mountainWidth / 2, height - thirdRangeHeight,
      x + mountainWidth, height
    );
  }

  // First mountain range (foreground)
  fill('#A57F6E');
  noStroke();
  for (let i = 0; i <= mountainOffsets.length; i++) {
    let x = offset + i * mountainWidth;
    triangle(
      x, height,
      x + mountainWidth / 2, height - mountainHeight,
      x + mountainWidth, height
    );
  }

  // Move mountains to the left
  for (let i = 0; i < mountainOffsets.length; i++) {
    mountainOffsets[i] -= mountainSpeed;
    if (mountainOffsets[i] < -mountainWidth) {
      mountainOffsets[i] += mountainWidth * mountainOffsets.length;
    }
  }

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
     fill('#bebfc2');
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
    fill('#bebfc2');
    triangle(this.x + 15, this.y, this.x - 15, this.y, this.x - 30, this.y + 80);

    // rear wing
    triangle(this.x - 10, this.y + 15, this.x - 45, this.y - 50, this.x - 45, this.y + 15);
    
  }
}

// start audio recording
function startRecording() {
  if (mic.enabled) {
    recorder.record(soundFile); // record audio
    recording = true;
    setTimeout(stopRecording, recordingTime * 1000);    
  }
  else {
    console.error("Mic is not ready.");
  }
  
  daytimeButton.hide()
  //input.hide()
}

// stop recording
function stopRecording() {
  recorder.stop();
  recording = false;

  setTimeout(() => { // 
    if (soundFile.duration() > 0) {
      playRecording();
    } else {
      console.error("Recording is empty or failed.");
    }
  }, 1000); // timeout for 1000ms to let file load
  //input.hide();
  daytimeButton.show();
}

// start recording or playing recording with mouse click
function mousePressed() {
  if (!recording) {
    if (!isPlaying && soundFile.duration() === 0) {
      startRecording();
      //input.hide();
      daytimeButton.hide();
    } else if (!isPlaying) {
      playRecording();
      //input.hide();
      daytimeButton.show();
    }
  }
}

// play recording
function playRecording() {
  if (soundFile.duration > 0) {
    soundFile.loop(); // loop sound playback
    fft.setInput(soundFile); // set FFT analyzer to recording
    isPlaying = true;

  }
  else {
    console.error("Soundfile is empty or invalid.");
  }  
    //input.hide();
    daytimeButton.show();


}

function keyPressed() {
  if (key === '+') {
    mountainSpeed += 1; // increase speed
    recordingTime = min(recordingTime + 1, 60); // increase recording time by 1 second, max 60 seconds
  } else if (key === '-') {
    mountainSpeed = max(mountainSpeed - 1, 1); // decrease speed, minimum value 1
    recordingTime = max(recordingTime - 1, 1); // decrease recording time by 1 second, minimum 1 second
     } 
  // else if (key === 'ArrowUp') {
  //   mountainSpeed += 1; // increase mountain speed with ArrowUp
  // } else if (key === 'ArrowDown') {
  //   mountainSpeed = max(mountainSpeed - 1, 1); // decrease mountain speed with ArrowDown, minimum value 1
  // }
}