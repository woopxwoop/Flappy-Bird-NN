let c = document.createElement("canvas");
let c2 = document.createElement("canvas");

const speedSlider = document.getElementById("speedSlider");
const speedSliderDisplay = document.getElementById("speedValue");

const mutationSlider = document.getElementById("mutationSlider");
const mutationSliderDisplay = document.getElementById("mutationValue");

const rebelSlider = document.getElementById("rebelSlider");
const rebelSliderDisplay = document.getElementById("rebelValue");

let birds;
let pipes;
let pipeTimer;
let frontPipe;
let deadBirds;
let best;
let gen;
let score;
let bestScore;

// should be able to change these later
let totalNum;
let topNum;
let mutationRate;
let rebelRate;
let numInputs;

let interval;

document.body.appendChild(c);
//document.body.appendChild(c2);

// Responsive, DPI-aware canvas sizing
let scale = Math.max(1, Math.floor(window.devicePixelRatio || 1));
function resizeCanvas() {
  scale = Math.max(1, Math.floor(window.devicePixelRatio || 1));
  const w = window.innerWidth;
  const h = window.innerHeight;
  // keep CSS size as viewport and set backing store size for sharpness
  c.style.width = w + "px";
  c.style.height = h + "px";
  c.width = Math.floor(w * scale);
  c.height = Math.floor(h * scale);

  c2.width = c.width;
  c2.height = c.height;
}

resizeCanvas();
window.addEventListener("resize", resizeCanvas);

let ctx = c.getContext("2d");

function bird() {
  birds.push(this);
  this.score = 0;
  this.color = "rgba(229, 179, 0, 0.2)";
  this.y = 0.5;
  this.x = 0;
  this.yVelocity = 0;
  this.brain = new net();
  this.gravity = 0.0003;
  this.dead = false;
  this.update = () => {
    if (!this.dead) {
      this.score++;
    }
    this.yVelocity += this.gravity;
    this.y += this.yVelocity;
    if (
      this.brain.predict([
        this.y,
        this.yVelocity,
        frontPipe.upper,
        frontPipe.lower,
        frontPipe.x,
      ])
    ) {
      this.yVelocity = -0.008; //flap
    }
    if (this.y > 1 || this.y < 0) {
      if (!this.dead) {
        deadBirds.push(this);
      }
      this.dead = true;
      return false;
    }
    for (p of pipes) {
      if (
        this.x > p.x &&
        this.x < p.x + 0.1 &&
        // include radius checking
        (this.y - 0.025 < p.upper || this.y + 0.025 > p.lower)
      ) {
        if (!this.dead) {
          deadBirds.push(this);
        }
        this.dead = true;
        return false;
      }
    }

    return true;
  };
  this.draw = () => {
    if (!this.dead) {
      ctx.beginPath();
      ctx.fillStyle = this.color;
      ctx.arc(
        (c.width - c.height) / 2,
        this.y * c.height,
        c.height * 0.025,
        0,
        Math.PI * 2
      );
      ctx.fill();
      ctx.closePath();
    }
  };
}

function pipe() {
  pipes.push(this);
  this.x = (c.width - c.height) / 2 / c.height + 1;
  this.color = "rgba(0, 152, 0, 1)";
  this.height = Math.random() * 0.75 + 0.125;
  this.upper = this.height - 0.1;
  this.lower = this.height + 0.1;
  this.update = () => {
    this.x -= 0.01;
    if (this.x < -((c.width - c.height) / 2) / c.height - 0.1) {
      pipes.shift();
      return false;
    }
    return true;
  };
  this.draw = () => {
    ctx.fillStyle = this.color;
    ctx.fillRect(
      this.x * c.height + (c.width - c.height) / 2,
      0,
      c.height * 0.1,
      c.height * (this.height - 0.1)
    );
    ctx.fillRect(
      this.x * c.height + (c.width - c.height) / 2,
      (this.height + 0.1) * c.height,
      c.height * 0.1,
      c.height
    );
  };
}

function drawBrain(brain) {
  for (let i = brain.layers.length - 1; i >= 0; i--) {
    let yStep = 1 / (1 + brain.layers[i].neurons.length);
    let lineStep;
    if (i != 0) {
      lineStep = 1 / (1 + brain.layers[i - 1].neurons.length);
    } else {
      lineStep = 1 / (numInputs + 1);
    }

    for (let j = 1; j * yStep < 1; j++) {
      for (let k = 1; k * lineStep < 1; k++) {
        ctx.beginPath();
        ctx.lineWidth =
          Math.abs(brain.layers[i].neurons[j - 1].weights[k - 1]) *
          c.height *
          0.005;
        if (brain.layers[i].neurons[j - 1].weights[k - 1] > 0) {
          ctx.strokeStyle = "yellow";
        } else {
          ctx.strokeStyle = "cyan";
        }
        ctx.moveTo(
          (c.width / 4) * (i / brain.layers.length) + (c.width * 3) / 4,
          (c.height / 3) * j * yStep
        );
        ctx.lineTo(
          (c.width / 4) * ((i - 1) / brain.layers.length) + (c.width * 3) / 4,
          (c.height / 3) * k * lineStep
        );
        ctx.stroke();
        ctx.closePath();
      }
    }

    for (let j = 1; j * yStep < 1; j++) {
      ctx.beginPath();
      ctx.arc(
        (c.width / 4) * (i / brain.layers.length) + (c.width * 3) / 4,
        (c.height / 3) * j * yStep,
        c.height * 0.01,
        0,
        Math.PI * 2
      );
      ctx.fillStyle = "black";
      ctx.fill();
      ctx.closePath();

      ctx.beginPath();
      ctx.arc(
        (c.width / 4) * (i / brain.layers.length) + (c.width * 3) / 4,
        (c.height / 3) * j * yStep,
        c.height * 0.01 * 0.5,
        0,
        Math.PI * 2
      );
      ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
      ctx.fill();
      ctx.closePath();

      let rad =
        Math.abs(
          brain.layers[i].neurons[j - 1].weights[
            brain.layers[i].neurons[j - 1].weights.length - 1
          ]
        ) / 2;
      if (
        brain.layers[i].neurons[j - 1].weights[
          brain.layers[i].neurons[j - 1].weights.length - 1
        ] > 0
      ) {
        ctx.fillStyle = "yellow";
      } else {
        ctx.fillStyle = "cyan";
      }

      ctx.beginPath();
      ctx.arc(
        (c.width / 4) * (i / brain.layers.length) + (c.width * 3) / 4,
        (c.height / 3) * j * yStep,
        c.height * 0.01 * rad,
        0,
        Math.PI * 2
      );
      ctx.fill();
      ctx.closePath();
    }

    for (let k = 1; k * lineStep < 1; k++) {
      ctx.beginPath();
      ctx.arc(
        (c.width / 4) * ((i - 1) / brain.layers.length) + (c.width * 3) / 4,
        (c.height / 3) * k * lineStep,
        c.height * 0.01,
        0,
        Math.PI * 2
      );
      ctx.fillStyle = "black";
      ctx.fill();
      ctx.closePath();
    }
  }
}

function update() {
  // canvas backing store is updated on resize; only advance score here
  score++;
  if (deadBirds.length == birds.length) {
    bestScore = Math.max(bestScore, score);
    score = 0;
    gen++;
    birds.sort((a, b) => {
      return b.score - a.score;
    });
    let parents = [];
    for (let i = 0; i < topNum; i++) {
      parents.push(birds[i]);
      birds[i].dead = false;
      birds[i].y = 0.5;
      birds[i].yVelocity = 0;
      birds[i].score = 0;
    }
    birds = [];
    deadBirds = [];
    pipes = [];
    for (let i = 0; i < totalNum - topNum; i++) {
      let newBird = new bird();
      newBird.brain = mutate(
        parents[~~(Math.random() * parents.length)].brain,
        mutationRate,
        rebelRate
      );
    }

    for (let bird of parents) {
      birds.push(bird);
    }
    best = parents[0];
  }
  pipeTimer += 1000 / 60;
  if (pipeTimer > 1500) {
    pipeTimer = 0;
    new pipe();
  }
  for (let i = 0; i < pipes.length; i++) {
    if (pipes[i].x > -0.1) {
      frontPipe = pipes[i];
      break;
    }
  }
  ctx.clearRect(0, 0, c.width, c.height);
  for (i of birds) {
    i.update();
    i.draw();
  }
  for (let i = 0; i < pipes.length; i++) {
    if (!pipes[i].update()) {
      i--;
    } else {
      pipes[i].draw();
    }
  }
  if (best != undefined) {
    drawBrain(best.brain);
  } else {
    drawBrain(birds[0].brain);
  }
  ctx.textAlign = "left";
  ctx.fillStyle = "white";
  ctx.strokeStyle = "white";
  ctx.font = "bold " + Math.floor(c.height / 25) + "px arial";
  ctx.fillText("Generation: " + gen, (c.width * 1) / 50, c.height / 10);
  ctx.fillText(
    "Num alive: " + (birds.length - deadBirds.length),
    (c.width * 1) / 50,
    c.height / 5
  );
  ctx.fillText(
    `Best Score: ${bestScore}`,
    (c.width * 1) / 50,
    c.height / (10 / 3)
  );

  ctx.fillText(`${score}`, (c.width * 2) / 5, c.height / 10);

  ctx.filter = "none";
  ctx.drawImage(c, 0, 0);
}

function reset(setTotalNum, setTopNum, setMutationRate, setRebelRate) {
  clearInterval(interval);

  birds = [];
  pipes = [];
  pipeTimer = 1500;
  frontPipe;
  deadBirds = [];
  best;
  gen = 1;
  score = 0;
  bestScore = 0;

  // customizable
  totalNum = setTotalNum;
  topNum = setTopNum;
  mutationRate = setMutationRate;
  rebelRate = setRebelRate;
  numInputs = 5;

  for (let i = 0; i < totalNum; i++) new bird();

  interval = setInterval(update, 1000 / (speedSlider.value * 60));
  mutationSlider.value = mutationRate;
  rebelSlider.value = rebelRate;
}

// default
reset(2000, 10, 0.03, 0.01);

function addButtonEvents() {
  document.querySelector(".default-button").addEventListener("click", () => {
    reset(2000, 10, 0.03, 0.01);
  });

  // Update the displayed value when the slider input changes
  speedSlider.addEventListener("input", function () {
    speedSliderDisplay.textContent = `${this.value}x`;
    clearInterval(interval);
    interval = setInterval(update, 1000 / (this.value * 60));
  });

  mutationSlider.addEventListener("input", function () {
    mutationSliderDisplay.textContent = `${this.value}%`;
    mutationRate = this.value / 100;
  });

  rebelSlider.addEventListener("input", function () {
    rebelSliderDisplay.textContent = `${this.value}%`;
    rebelRate = this.value / 100;
  });
}

addButtonEvents();
