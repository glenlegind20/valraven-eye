let video;
let detector;
let detections = [];

let glitchTimer = 0;
let glitchInterval = 5000;
let glitchActive = false;

let possessionActive = false;
let snapshot;
let ghostFigures = [];

function setup() {
  createCanvas(windowWidth, windowHeight);
  video = createCapture(VIDEO);
  video.size(width, height);
  video.hide();

  video.elt.addEventListener('loadeddata', () => {
    detector = ml5.objectDetector('cocossd', () => {
      detect();
    });
  });

  glitchTimer = millis();
}

function draw() {
  background(0);
  let now = millis();

  // Glitch flash logic
  if (!possessionActive && now - glitchTimer > glitchInterval) {
    glitchActive = true;
    glitchTimer = now;
    glitchInterval = random(4000, 8000);
  }

  if (glitchActive && now - glitchTimer < 300) {
    drawGlitchFlash();
  } else {
    glitchActive = false;
  }

  // Possession logic
  if (hasCloseFace(detections)) {
    if (!possessionActive) {
      triggerPossession();
    }
    drawPossessedPhoto();
  } else {
    possessionActive = false;
  }
}

function drawGlitchFlash() {
  fill(random(100, 255), 0, random(100, 255));
  rect(0, 0, width, height);
}

function drawPossessedPhoto() {
  let ghost = snapshot;
  ghost.filter(GRAY);
  ghost.filter(BLUR, 4);
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
  possessionActive = true;
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
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

document.ontouchmove = function (event) {
  event.preventDefault();
};
