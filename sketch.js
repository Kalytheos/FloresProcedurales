let n = 0;
let c = 4;
let totalPoints = 500;
let startHue;
let petalSize;
let petalSharpness;
let colorVar;

// Surprise Mode Variables
let surpriseMode = false;
let lastGenTime = 0;
let music;
let surpriseBtn;

// 3D Variables
let flowerTiltX;
let flowerTiltY;
let stemControlX;
let stemControlY;

// Text Variables
let fonts = ['Dancing Script', 'Great Vibes', 'Montserrat', 'Playfair Display'];

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
  colorMode(HSB, 360, 100, 100, 100);
  angleMode(DEGREES);
  noStroke();

  // Setup UI
  music = select('#bgMusic');
  surpriseBtn = select('#surpriseBtn');
  if (surpriseBtn) {
    surpriseBtn.mousePressed(toggleSurprise);
  }

  // Handle music ending
  if (music) {
    music.elt.onended = () => {
      surpriseMode = false;
      surpriseBtn.html('Sorpresa');
    };
  }

  generateParams();
}

function toggleSurprise() {
  if (!music) return;

  if (!surpriseMode) {
    music.play();
    surpriseMode = true;
    surpriseBtn.html('Detener');
  } else {
    music.pause();
    surpriseMode = false;
    surpriseBtn.html('Sorpresa');
  }
}

function draw() {
  background(15);

  // Surprise Mode Logic
  if (surpriseMode) {
    if (millis() - lastGenTime > 333) { // ~3 fps
      generateParams();
      lastGenTime = millis();
    }
  }

  // Lighting
  ambientLight(60);
  directionalLight(0, 0, 100, 0, 0, -1);
  pointLight(255, 255, 255, 200, -200, 200);
  pointLight(255, 255, 255, -200, 200, 200);

  orbitControl();

  // Draw Stem (Mesh)
  drawStemMesh();

  // Draw Flower Head
  push();
  // Apply random tilt
  rotateX(flowerTiltX);
  rotateY(flowerTiltY);

  // Draw Calyx (Connection)
  drawCalyx();

  generateFlower();
  pop();
}

function generateParams() {
  startHue = random(360);
  c = random(3, 7);
  totalPoints = floor(random(400, 1000));
  petalSize = random(8, 20);
  petalSharpness = random(0.2, 0.8);
  colorVar = random(20, 60);

  // 3D Randomness
  flowerTiltX = random(-20, 20);
  flowerTiltY = random(-20, 20);

  // Stem curve control points
  stemControlX = random(-100, 100);
  stemControlY = random(100, 300);

  // Update Text Style
  updateTextStyle();
}

function updateTextStyle() {
  let dedication = select('#dedication');
  if (dedication) {
    let font = random(fonts);
    // Color range: Reds to Whites
    // Red is around 0 or 360. White is low saturation, high brightness.
    let isWhite = random() > 0.6;
    let h, s, b;

    if (isWhite) {
      h = random(360);
      s = random(0, 10);
      b = random(90, 100);
    } else {
      // Reddish
      h = random() > 0.5 ? random(0, 20) : random(340, 360);
      s = random(60, 90);
      b = random(80, 100);
    }

    // Convert HSB to CSS HSL/RGB string is tricky manually,
    // but p5 color() object helps.
    let col = color(h, s, b);
    dedication.style('font-family', font);
    dedication.style('color', col.toString());
  }
}

function drawStemMesh() {
  push();
  fill(100, 70, 40); // Greenish
  noStroke();

  // Calculate Bezier points manually to create a tube
  let steps = 40;
  // Thicker stem as requested - significantly increased
  let radiusBase = 25;
  let radiusTop = 10;

  // Control points matching the previous logic
  let startX = 0; let startY = height / 2 + 100; let startZ = 0;
  let cp1x = stemControlX * 0.5; let cp1y = height / 2 - 100; let cp1z = 50;
  let cp2x = -flowerTiltY * 2; let cp2y = 100; let cp2z = -flowerTiltX * 2;
  let endX = 0; let endY = 0; let endZ = 0;

  // We'll draw rings along the curve
  let prevRing = [];

  for (let i = 0; i <= steps; i++) {
    let t = i / steps;
    let x = bezierPoint(startX, cp1x, cp2x, endX, t);
    let y = bezierPoint(startY, cp1y, cp2y, endY, t);
    let z = bezierPoint(startZ, cp1z, cp2z, endZ, t);

    // Calculate tangent for rotation (approximate)
    let tx = bezierTangent(startX, cp1x, cp2x, endX, t);
    let ty = bezierTangent(startY, cp1y, cp2y, endY, t);
    let tz = bezierTangent(startZ, cp1z, cp2z, endZ, t);

    // Create a basis for the ring
    let tangent = createVector(tx, ty, tz).normalize();
    let up = createVector(0, 1, 0);
    let axis1 = up.cross(tangent).normalize();
    let axis2 = tangent.cross(axis1).normalize();

    let currentRadius = lerp(radiusBase, radiusTop, t);
    let ring = [];
    let segments = 12; // Smoother cylinder

    for (let j = 0; j <= segments; j++) {
      let angle = map(j, 0, segments, 0, TWO_PI);
      let r = currentRadius;

      // Add thorns occasionally
      // Thorns mostly in the middle/lower part
      if (t > 0.1 && t < 0.8 && random() < 0.05) {
        r *= 1.5; // Smaller spike relative to the thick stem
      }
      let cx = cos(angle) * r;
      let cy = sin(angle) * r;

      // Transform ring point to 3D space
      let px = x + axis1.x * cx + axis2.x * cy;
      let py = y + axis1.y * cx + axis2.y * cy;
      let pz = z + axis1.z * cx + axis2.z * cy;

      ring.push(createVector(px, py, pz));
    }

    if (i > 0) {
      beginShape(TRIANGLE_STRIP);
      for (let j = 0; j <= segments; j++) {
        vertex(prevRing[j].x, prevRing[j].y, prevRing[j].z);
        vertex(ring[j].x, ring[j].y, ring[j].z);
      }
      endShape();
    }

    prevRing = ring;
  }
  pop();
}

function drawCalyx() {
  push();
  fill(90, 70, 50); // Slightly different green
  translate(0, 0, 1); // Just below petals
  rotateX(180); // Point down
  cone(8, 15); // Simple cone for the base
  pop();
}

function generateFlower() {
  // In WEBGL, (0,0) is center.
  for (let i = 0; i < totalPoints; i++) {
    let a = i * 137.5;
    let r = c * sqrt(i);

    let x = r * cos(a);
    let y = r * sin(a);

    // Add a slight Z offset to petals to avoid z-fighting and give volume
    // Curve the petals up slightly at the edges (cup shape)
    let z = -i * 0.05 + (r * r * 0.002);

    let isSeed = i < 40;

    push();
    translate(x, y, z);
    rotate(a);

    if (isSeed) {
      fill(20, 60, 40);
      ellipse(0, 0, c * 0.8, c * 0.8);
    } else {
      let distFactor = i / totalPoints;
      let h = (startHue + (distFactor * colorVar)) % 360;
      let s = 90 - (distFactor * 20);
      let b = 50 + (distFactor * 50);

      fill(h, s, b, 90);
      noStroke();

      let noiseVal = random(0.9, 1.1);
      let currentSize = (petalSize + (i * 0.02)) * noiseVal;

      // Tilt petals slightly up/down based on distance from center
      rotateX(map(r, 0, 200, -20, 10));

      drawPetal(currentSize, petalSharpness);
    }

    pop();
  }
}

function drawPetal(size, sharpness) {
  let len = size;
  let wid = size * 0.6;

  let cp1x = len * 0.2;
  let cp1y = -wid * (1 - sharpness * 0.5);
  let cp2x = len * 0.8;
  let cp2y = -wid * (1 - sharpness);
  let cp3x = len * 0.8;
  let cp3y = wid * (1 - sharpness);
  let cp4x = len * 0.2;
  let cp4y = wid * (1 - sharpness * 0.5);

  beginShape();
  vertex(0, 0);
  bezierVertex(cp1x, cp1y, 0, cp2x, cp2y, 0, len, 0, 0);
  bezierVertex(cp3x, cp3y, 0, cp4x, cp4y, 0, 0, 0, 0);
  endShape(CLOSE);
}

function mousePressed() {
  generateParams();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
