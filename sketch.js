let video;
let detector;
let detections = [];
let lastFlash = 0;
let flashInterval = 10000;
let eyeVisible = false;
let blinkTimer = 0;
let blinking = false;

let possessionTriggered = false;
let snapshot;
let possessionTimer = 0;
let ghostDuration = 1500;
let ghostFigures = [];

function setup() {
  let cnv = createCanvas(windowWidth, windowHeight);
  cnv.style('display', 'block');
  cnv.position(0, 0);

  video = createCapture(VIDEO);
  video.size(width, height);
  video.hide();

  video.elt.addEventListener('loadeddata', () => {
    detector = ml5.objectDetector('cocossd', () => {
      console.log("Model loaded");
      detect();
    });
  });
}

function draw() {
  background(0);
  let now = millis();

  if (possessionTriggered && now - possessionTimer < ghostDuration) {
    drawPossessedPhoto();
    return;
  }

  if (eyeVisible && now - lastFlash < 1000) {
    drawIdleEye();
  }

  if (now - lastFlash > flashInterval) {
    eyeVisible = true;
    lastFlash = now;
    flashInterval = random(8000, 15000);
  }

  if (eyeVisible && now - lastFlash > 1000) {
    eyeVisible = false;
  }

  if (hasCloseFace(detections)) {
    triggerPossession();
  }
}

function drawIdleEye() {
  fill(30, 0, 60);
  ellipse(width / 2, height / 2, 160, 100);

  fill(120, 0, 200);
  ellipse(width / 2, height / 2, 60, 60);

  fill(0);
  ellipse(width / 2, height / 2, 20, 20);

  if (blinking) {
    fill(0);
    rect(0, 0, width, height);
    if (millis() - blinkTimer > 300) {
      blinking = false;
    }
  } else if (random(1) < 0.002) {
    blinking = true;
    blinkTimer = millis();
  }
}

function drawPossessedPhoto() {
  let ghost = snapshot;
  ghost.filter(GRAY);
  ghost.filter(BLUR, 3);
  tint(255, 180);
  image(ghost, 0, 0, width, height);

  noStroke();
  for (let g of ghostFigures) {
    fill(255, 255, 255, 20);
    ellipse(g.x, g.y, g.w, g.h);
  }
}

function detect() {
  detector.detect(video, (err, results) => {
    if (err) {
      console.error(err);
      return;
    }
    detections = results;
    detect(); // loop
  });
}

function hasCloseFace(results) {
  return results.some(obj => obj.label === "person" && obj.width > width / 3);
}

function triggerPossession() {
  snapshot = video.get();
  possessionTriggered = true;
  possessionTimer = millis();
  generateGhostFigures();
}

function generateGhostFigures() {
  ghostFigures = [];
  let count = int(random(2, 5));
  for (let i = 0; i < count; i++) {
    ghostFigures.push({
      x: random(width * 0.2, width * 0.8),
      y: random(height * 0.3, height * 0.9),
      w: random(40, 80),
      h: random(80, 160)
    });
  }
}

function touchStarted() {
  if (!fullscreen()) {
    fullscreen(true);
  } else {
    triggerPossession();
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

document.ontouchmove = function (event) {
  event.preventDefault();
};
