let allCircles = [];  // Array to store all apple circles
let lines = [];       // Array to store tree branch line segments
let generateBtn;      // Button to generate apple tree
let playBtn;          // Button to play/pause music
let sound;            // Sound object
let fft;              // Audio spectrum analyzer
let appleFallen = false; // Flag to track if apples have fallen to ground

// Game variables
let container = {x: 0, y: 0, width: 120, height: 60}; // Container object
let gameStarted = false; // Flag to track if game has started
let dropQueue = []; // Queue of apples to drop
let dropTimer = 0; // Timer for dropping apples sequentially
let dropInterval = 60; // Frames between each apple drop (1 second at 60fps)

// Responsive canvas properties
let drawingProps = {
  centerX: 0,
  centerY: 0,
  scale: 1,
  cardWidth: 525,
  cardHeight: 718,
  cardX: 37,
  cardY: 35
};

function preload() {
  // Preload audio file
  sound = loadSound("/red_velvet_dumb_dumb.mp3");
}

function setup() {
  // Create responsive canvas that fits window
  createCanvas(windowWidth, windowHeight);
  drawBackground();

  // Initialize tree branch line data
  lines = [
    {x1: 0, y1: -340, x2: 0, y2: 0}, // trunk (top to bottom)
    {x1: -120, y1: -250, x2: 130, y2: -250}, // main horizontal branch
    {x1: -135, y1: -430, x2: -120, y2: -250}, // left main branch
    {x1: 130, y1: -420, x2: 130, y2: -250}, // right main branch
    {x1: -54, y1: -340, x2: 54, y2: -340}, // upper horizontal branch
    {x1: -54, y1: -340, x2: -54, y2: -380}, // left small branch
    {x1: 54, y1: -340, x2: 54, y2: -370}, // right small branch
    {x1: -100, y1: 0, x2: 100, y2: 0}, // bottom base branch
    {x1: -220, y1: -410, x2: -135, y2: -430}, // far left branch
    {x1: 130, y1: -420, x2: 180, y2: -421}, // far right branch
    {x1: 180, y1: -421, x2: 190, y2: -520}, // top rightmost branch
    {x1: -220, y1: -410, x2: -220, y2: -440}, // top leftmost branch
  ];

  // Create UI buttons
  generateBtn = createButton('🌲 Generate Apple Tree 🍎');
  generateBtn.position(80, 700);
  generateBtn.mousePressed(drawApple); // Bind apple tree generation function
  styleButton(generateBtn);

  playBtn = createButton('▶️ Play/Pause Music');
  playBtn.position(350, 700);
  playBtn.mousePressed(toggleSound); // Bind music control function
  styleButton(playBtn);

  // Initialize audio FFT analyzer
  fft = new p5.FFT();
  
  // Initialize container position
  container.x = width / 2 - container.width / 2;
  container.y = height / 2 + 200 - container.height;
  
  // Calculate initial drawing properties
  calculateImageDrawProps();
}

function styleButton(btn) {
  // Set button visual styles
  btn.style('background-color', '#FFB6B9');
  btn.style('color', '#ffffff');
  btn.style('font-size', '16px');
  btn.style('padding', '10px 20px');
  btn.style('border', 'none');
  btn.style('border-radius', '12px');
  btn.style('cursor', 'pointer');
  btn.style('box-shadow', '2px 2px 8px rgba(0, 0, 0, 0.2)');
  btn.style('transition', 'all 0.3s ease-in-out');
  btn.style('font-family', 'Helvetica, sans-serif');
  
  // Set hover effect
  btn.mouseOver(() => btn.style('background-color', '#ff9aa2'));
  btn.mouseOut(() => btn.style('background-color', '#FFB6B9'));
}

function drawBackground() {
  // Draw sky background
  background(199, 244, 255);
  noStroke();
  
  // Draw blue card-like background with responsive dimensions
  fill('#7E94BE');
  rect(drawingProps.cardX, drawingProps.cardY, drawingProps.cardWidth, drawingProps.cardHeight, 20 * drawingProps.scale);

  // Translate origin and draw ground and tree base
  push();
  translate(drawingProps.centerX, drawingProps.centerY + 200 * drawingProps.scale);
  
  // Draw green ground with responsive scaling
  fill('#65C18D');
  stroke('#373A7D');
  strokeWeight(2 * drawingProps.scale);
  rect(-262 * drawingProps.scale, 0, 523 * drawingProps.scale, 86 * drawingProps.scale);
  
  // Draw yellow tree base with responsive scaling
  fill('#FFF28C');
  noStroke();
  rect(-115 * drawingProps.scale, 0, 225 * drawingProps.scale, 70 * drawingProps.scale);
  pop();
}

// Generate Apple Tree
function drawApple() {
  // Redraw background
  drawBackground();
  // Clear existing apple array and reset game state
  allCircles = [];
  appleFallen = false;
  gameStarted = false;
  dropQueue = [];
  dropTimer = 0;

  push();
  // Translate origin to lower center of canvas with responsive scaling
  translate(drawingProps.centerX, drawingProps.centerY + 200 * drawingProps.scale);
  
  // Generate apples on each line segment with responsive scaling
  for (let lineSegment of lines) {
    drawCirclesOnLine(lineSegment.x1 * drawingProps.scale, lineSegment.y1 * drawingProps.scale, 
                     lineSegment.x2 * drawingProps.scale, lineSegment.y2 * drawingProps.scale, allCircles);
  }

  // Draw tree branch lines with responsive scaling
  stroke(234, 204, 70);
  strokeWeight(2 * drawingProps.scale);
  for (let lineSegment of lines) {
    line(lineSegment.x1 * drawingProps.scale, lineSegment.y1 * drawingProps.scale, 
         lineSegment.x2 * drawingProps.scale, lineSegment.y2 * drawingProps.scale);
  }
  pop();
}

// Generate Apple Circles on Lines
function drawCirclesOnLine(x1, y1, x2, y2, allCircles) {
  // Calculate line length and direction vector
  let len = dist(x1, y1, x2, y2);
  let dx = (x2 - x1) / len; // Unit vector in x direction
  let dy = (y2 - y1) / len; // Unit vector in y direction
  let pos = 0; // Current position on line

  // Generate apples along the line
  while (pos < len) {
    // Random radius for apple (15–40 pixels) scaled responsively
    let r = random(15, 40) * drawingProps.scale;
    // Compute apple center
    let cx = x1 + dx * (pos + r);
    let cy = y1 + dy * (pos + r);

    // Check if beyond line end
    if (pos + r * 2 > len) {
      let remaining = len - pos;
      r = remaining / 2; // Adjust radius to fit space
      if (r < 3) break; // Stop if too small
      cx = x1 + dx * (pos + r);
      cy = y1 + dy * (pos + r);
    }

    // Check overlap with existing apples
    let overlapping = false;
    for (let c of allCircles) {
      // If too close and not near intersection, mark as overlapping
      if (dist(cx, cy, c.x, c.y) < (r + c.r) * 0.8 && !isNearIntersection(cx, cy)) {
        overlapping = true;
        break;
      }
    }
    
    while(overlapping){
      // decrease circle radius
      r = r * 0.9; // decrease radius by 10%
      
      // if radius is too small, stop adding circles
      if (r < 20) {
        overlapping = false;
        break;
      }
      
      // calculate new position of the circle
      cx = x1 + dx * (pos + r);
      cy = y1 + dy * (pos + r);
      
      // check if the circle overlaps
      overlapping = false;
      for (let existingCircle of allCircles) {
        let distance = dist(cx, cy, existingCircle.x, existingCircle.y);
        let minDistance = r + existingCircle.r;
        
        // if too close and not at intersection, mark as overlapping
        if (distance < minDistance * 0.9) {
          // check if it is near an intersection
          let isIntersection = isNearIntersection(cx, cy);
          if (!isIntersection) {
            overlapping = true;
            break;
          }
        }
      }
    }

    // If not overlapping, create new apple
    if (!overlapping) {
      // Compute angle of the line
      let angle = atan2(dy, dx);
      // Randomize color order
      let isRedFirst = random() > 0.5;
      let color1 = isRedFirst ? [232, 80, 78] : [120, 161, 100]; // red or green
      let color2 = isRedFirst ? [120, 161, 100] : [232, 80, 78]; // opposite

      // Add to apple array with original position
      allCircles.push({
        x: cx, 
        y: cy, 
        r: r, 
        angle: angle, 
        color1, 
        color2,
        originalY: cy,    // Store original position for reset
        isFalling: false, // Is this apple currently falling
        hasLanded: false, // Has this apple landed on ground
        inContainer: false, // Has this apple been caught in container
        visible: true     // Is this apple visible (for removal animation)
      });
    }

    // Move to next position (minus 2px for denser packing)
    pos += r * 2 - 2;
  }
}

// Check Proximity to Intersections
function isNearIntersection(x, y) {
  let threshold = 10; // Distance threshold for intersections
  
  // Define all key intersection coordinates
  let intersections = [
    // Key intersection points based on tree structure
    {x: 0, y: 0},          // line 1 & 8 (bottom center)
    {x: 0, y: -340},       // line 1 & 5 (top of trunk)
    {x: -120, y: -250},    // line 2 & 3 (left main branch)
    {x: 130, y: -250},     // line 2 & 4 (right main branch)
    {x: -54, y: -340},     // line 5 & 6 (left small branch)
    {x: 54, y: -340},      // line 5 & 7 (right small branch)
    {x: -135, y: -430},    // line 3 & 9 (upper left)
    {x: 130, y: -420},     // line 4 & 10 (upper right)
    {x: 180, y: -421},     // line 10 & 11 (far right)
    {x: -220, y: -410},    // line 9 & 12 (far left)
    
    // Important line endpoints
    {x: -54, y: -380},     // line 6 endpoint
    {x: 54, y: -370},      // line 7 endpoint
    {x: 190, y: -520},     // line 11 endpoint
    {x: -220, y: -440},    // line 12 endpoint
    {x: -100, y: 0},       // line 8 left endpoint
    {x: 100, y: 0}         // line 8 right endpoint
  ];
  
  // Check if point is within threshold of any intersection
  for (let p of intersections) {
    if (dist(x, y, p.x, p.y) < threshold) return true;
  }
  return false;
}

// Music Control
function toggleSound() {
  // Toggle play/pause
  if (sound.isPlaying()) {
    sound.pause(); // Pause if playing
  } else {
    sound.loop(); // Loop if paused
  }
}

// Handle keyboard input
function keyPressed() {
  // When spacebar is pressed, make apples fall to ground instantly
  if (key == " ") { // Press space
    dropApples();
  }
}

// Drop all apples to ground instantly
function dropApples() {
  if (!gameStarted && allCircles.length > 0) {
    gameStarted = true;
    // Create randomized drop queue
    dropQueue = []; // Step 1: Create empty array
    // Fill array with indices from 0 to allCircles.length-1
    for (let i = 0; i < allCircles.length; i++) {
      dropQueue.push(i);
    }
    // Shuffle the array randomly
    for (let i = dropQueue.length - 1; i > 0; i--) {
      let j = Math.floor(Math.random() * (i + 1));
      [dropQueue[i], dropQueue[j]] = [dropQueue[j], dropQueue[i]];
    }
    dropTimer = 0;
  }
}

function draw() {
  // Redraw background
  drawBackground();
  
  // Create container position and game logic
  Container();
  Game();
  
  // Create falling animation if apples are falling
  if (appleFallen) {
    let allLanded = true;
    for (let apple of allCircles) {
      if (apple.y < -apple.r) { // If apple hasn't reached ground
        apple.y += 3; // Move down by 3 pixels per frame
        allLanded = false;
      }
    }
    if (allLanded) {
      appleFallen = false; // Stop animation when all apples have landed
    }
  }

  // Get low frequency audio energy for color effect
  let spectrum = fft.analyze(); // Analyze audio spectrum
  let lowEnergy = fft.getEnergy(20, 200); // Get 20–200Hz energy
  let t = map(lowEnergy, 0, 255, 0, 1); // Map energy to 0–1

  push();
  translate(drawingProps.centerX, drawingProps.centerY + 200 * drawingProps.scale);
  noStroke();
  
  // Draw all visible apples with music-reactive color
  for (let c of allCircles) {
    if (c.visible) { // Only draw visible apples
      // Create color interpolation
      let from1 = color(...c.color1);
      let to1 = color(...c.color2);
      let lerped1 = lerpColor(from1, to1, t); // Interpolate based on energy

      let from2 = color(...c.color2);
      let to2 = color(...c.color1);
      let lerped2 = lerpColor(from2, to2, t);

      // Draw two half-arcs for each apple
      fill(lerped1);
      arc(c.x, c.y, c.r * 2, c.r * 2, c.angle, c.angle + PI); // first half

      fill(lerped2);
      arc(c.x, c.y, c.r * 2, c.r * 2, c.angle + PI, c.angle + TWO_PI); // second half
    }
  }

  // Draw tree branch lines with responsive scaling
  stroke(234, 204, 70);
  strokeWeight(2 * drawingProps.scale);
  for (let lineSegment of lines) {
    line(lineSegment.x1 * drawingProps.scale, lineSegment.y1 * drawingProps.scale, 
         lineSegment.x2 * drawingProps.scale, lineSegment.y2 * drawingProps.scale);
  }
  pop();
  
  // Draw container only when apples exist
  if (allCircles.length > 0) {
    drawContainer();
  }
  
  // Game instructions (Learn from: https://p5js.org/reference/p5/textAlign/)
  if (allCircles.length > 0 && !gameStarted) {
    fill(255, 255, 255, 200);
    rect(10, 10, 380, 50, 10);
    fill(0);
    textAlign(CENTER, CENTER);
    textSize(14);
    text('Press SPACEBAR to start the Apple Catching Game!', 200, 35);
  }
}

// Check if apple is in container
function checkAppleCaught(apple, container) {
  let withinX = apple.x > container.x && apple.x < container.x + container.width;
  let withinY = apple.y + apple.r > container.y && apple.y - apple.r < container.y + container.height;
  return withinX && withinY;
}

// Let container position based on mouse
function Container() {
  // Keep container within responsive card bounds
  container.x = constrain(mouseX - container.width / 2, 
                         drawingProps.cardX, 
                         drawingProps.cardX + drawingProps.cardWidth - container.width);
}

// Let game logic for dropping apples and collision detection
function Game() {
  if (!gameStarted) return;
  
  // Drop next apple in queue
  if (dropQueue.length > 0) {
    dropTimer++;
    if (dropTimer >= dropInterval) {
      let nextAppleIndex = dropQueue.shift();
      allCircles[nextAppleIndex].isFalling = true;
      dropTimer = 0;
    }
  }
  
  // Falling apples
  for (let apple of allCircles) {
    if (apple.isFalling && !apple.hasLanded && apple.visible) {
      apple.y += 4; // Fall speed
      
      // Check collision with container using the new method
      if (checkAppleCaught(apple, container)) {
        // Apple caught in container
        apple.inContainer = true;
        apple.visible = false;
        apple.isFalling = false;
      }
      // Check if apple hit ground
      else if (apple.y >= -apple.r) {
        apple.y = -apple.r; // Place on ground
        apple.hasLanded = true;
        apple.isFalling = false;
      }
    }
  }
}

// Draw container
function drawContainer() {
  push();
  translate(width / 2, height / 2 + 200);
  
  // Convert screen coordinates to canvas coordinates
  let canvasX = container.x - width / 2;
  let canvasY = container.y - (height / 2 + 200);
  
  // Draw container
  fill(139, 69, 19); // Brown color
  stroke(101, 67, 33);
  strokeWeight(3);
  rect(canvasX, canvasY, container.width, container.height, 10, 10, 0, 0);

  pop();
}

// Handle window resize
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  calculateImageDrawProps();
}

// Calculate proportional drawing properties for responsive canvas
function calculateImageDrawProps() {
  // Original design dimensions
  let originalWidth = 600;
  let originalHeight = 800;
  
  // Calculate scale to fit current window while maintaining aspect ratio
  let scaleX = width / originalWidth;
  let scaleY = height / originalHeight;
  drawingProps.scale = min(scaleX, scaleY);
  
  // Calculate centered position
  drawingProps.centerX = width / 2;
  drawingProps.centerY = height / 2;
  
  // Scale card dimensions and position
  drawingProps.cardWidth = 525 * drawingProps.scale;
  drawingProps.cardHeight = 718 * drawingProps.scale;
  drawingProps.cardX = (width - drawingProps.cardWidth) / 2;
  drawingProps.cardY = (height - drawingProps.cardHeight) / 2;
  
  // Update container position proportionally
  container.width = 120 * drawingProps.scale;
  container.height = 60 * drawingProps.scale;
  container.x = drawingProps.centerX - container.width / 2;
  container.y = drawingProps.centerY + 200 * drawingProps.scale - container.height;
}


