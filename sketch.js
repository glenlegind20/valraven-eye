let video;
let detector;
let detections = [];

let glitchTimer = 0;
let glitchInterval = 5000;
let glitchActive = false;

let possessionActive = false;
let snapshot;
let ghostFigures = [];
let lastPossessionTime = 0;
let possessionCooldown = 2000;

let visitorMemories = [];

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
  if (possessionActive) {
    fill(0, 20);
    rect(0, 0, width, height);
  } else {
    background(0);
  }

  let now = millis();

  if (!possessionActive && now - glitchTimer > glitchInterval) {
    glitchActive = true;
    glitchTimer = now;
    glitchInterval = random(4000, 6000);
  }

  if (glitchActive && now - glitchTimer < 300) {
    drawGlitchFlash();
  } else if (glitchActive && now - glitchTimer >= 300) {
    glitchActive = false;
  }

  if (hasCloseFace(detections)) {
    possessionActive = true;
    if (now - lastPossessionTime > possessionCooldown) {
      triggerPossession();
      lastPossessionTime = now;
    }
    drawVisitorMemories();
    drawPossessedPhoto();
    drawFloatingSpirits();
  } else {
    possessionActive = false;
  }
}

function drawGlitchFlash() {
  noStroke();
  for (let i = -3; i <= 3; i++) {
    let x = width / 2 + i * 20;
    let green = map(i, -3, 3, 80, 180);
    fill(80, green, 60, 180);
    rect(x, 0, 15, height);
  }

  for (let i = 0; i < 10; i++) {
    let y = random(height * 0.1, height * 0.5);
    let x = width / 2 + random(-100, 100);
    fill(50, random(180, 255), 50, 60);
    rect(x, y, random(30, 80), 2);
  }

  for (let i = 0; i < 5; i++) {
    let x = width / 2 + random(-80, 80);
    let y = height - random(20, 60);
    fill(random(120, 160), 80, 40, 80);
    ellipse(x, y, random(40, 80), 10);
  }
}

function drawPossessedPhoto() {
  let ghost = snapshot;
  ghost.loadPixels();

  for (let y = 0; y < ghost.height; y += 5) {
    for (let x = 0; x < ghost.width; x += 5) {
      let i = (y * ghost.width + x) * 4;
      let r = ghost.pixels[i];
      let g = ghost.pixels[i + 1];
      let b = ghost.pixels[i + 2];
      let gray = (r + g + b) / 3;
      gray = gray > 128 ? 255 : 0;
      if (random() < 0.2) gray = 255 - gray;
      let offset = int(random(-30, 30));
      let target = ((y * ghost.width + constrain(x + offset, 0, ghost.width - 1)) * 4);
      ghost.pixels[target] = gray;
      ghost.pixels[target + 1] = gray;
      ghost.pixels[target + 2] = gray;
    }
  }

  ghost.updatePixels();
  tint(255, 255, 255, 220);
  image(ghost, 0, 0, width, height);
}

function drawVisitorMemories() {
  for (let i = 0; i < visitorMemories.length; i++) {
    let img = visitorMemories[i];
    let alpha = map(i, 0, visitorMemories.length, 30, 100);
    tint(255, alpha);
    image(img, 0, 0, width, height);
  }
}

function drawFloatingSpirits() {
  noStroke();
  for (let g of ghostFigures) {
    fill(30, 30, 30, 60);
    ellipse(g.x, g.y, g.w, g.h);
    g.y += sin(frameCount * 0.002 + g.offset) * 0.1;
    g.x += cos(frameCount * 0.001 + g.offset) * 0.05;
  }
}

function detect() {
  detector.detect(video, (err, results) => {
    if (err) {
      console.error(err);
      return;
    }
    detections = results;
    detect();
  });
}

function hasCloseFace(results) {
  return results.some(obj => obj.label === "person" && obj.width > width / 3);
}

function triggerPossession() {
  snapshot = video.get();
  possessionActive = true;
  visitorMemories.push(snapshot.get());
  if (visitorMemories.length > 10) {
    visitorMemories.shift(); // keep last 10
  }
  generateGhostFigures();
}

function generateGhostFigures() {
  ghostFigures = [];
  let count = int(random(3, 6));
  for (let i = 0; i < count; i++) {
    ghostFigures.push({
      x: random(width * 0.2, width * 0.8),
      y: random(height * 0.3, height * 0.9),
      w: random(40, 80),
      h: random(80, 160),
      offset: random(TWO_PI)
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
