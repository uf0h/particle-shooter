'use strict';

const canvas = document.querySelector('canvas');
const c = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

class Drawable {
  constructor(x, y, radius, color) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = color;
  }

  draw() {}
}

class Movable extends Drawable {
  constructor(x, y, radius, color, velocity) {
    super(x, y, radius, color);
    this.velocity = velocity;
  }

  update() {}
}

class Player extends Drawable {
  constructor(x, y, radius, color) {
    super(x, y, radius, color);
  }

  draw() {
    c.beginPath();
    c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
    c.fillStyle = this.color;
    c.fill();
  }
}

class Projectile extends Movable {
  constructor(x, y, radius, color, velocity) {
    super(x, y, radius, color);
    this.velocity = velocity;
  }

  draw() {
    c.beginPath();
    c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
    c.fillStyle = this.color;
    c.fill();
  }

  update() {
    this.draw();
    this.x = this.x + this.velocity.x;
    this.y = this.y + this.velocity.y;
  }
}

class Enemy extends Movable {
  constructor(x, y, radius, color, velocity) {
    super(x, y, radius, color, velocity);
  }

  draw() {
    c.beginPath();
    c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
    c.fillStyle = this.color;
    c.fill();
  }

  update() {
    this.draw();
    this.x = this.x + this.velocity.x;
    this.y = this.y + this.velocity.y;
  }
}

class Particle extends Movable {
  static FRICTION = 0.99;

  constructor(x, y, radius, color, velocity) {
    super(x, y, radius, color, velocity);
    this.alpha = 1;
  }

  draw() {
    c.save();
    c.globalAlpha = this.alpha;
    c.beginPath();
    c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
    c.fillStyle = this.color;
    c.fill();
    c.restore();
  }

  update() {
    this.draw();
    this.velocity.x *= Particle.FRICTION;
    this.velocity.y *= Particle.FRICTION;
    this.x = this.x + this.velocity.x;
    this.y = this.y + this.velocity.y;
    this.alpha -= 0.01;
  }
}

const scoreElement = document.querySelector('#score');
const startModalElement = document.querySelector('#start-modal');
const startButtonElement = document.querySelector('#start-btn');
const startScoreElement = document.querySelector('#start-score');

let playing = false;
let score;
let player;
let projectiles;
let enemies;
let particles;

function init() {
  player = new Player(canvas.width / 2, canvas.height / 2, 10, 'white');
  projectiles = [];
  enemies = [];
  particles = [];
  score = 0;
  scoreElement.innerHTML = score;
  startScoreElement.innerHTML = score;

  c.clearRect(0, 0, canvas.width, canvas.height);
  playing = true;
}

function spawnEnemies() {
  const enemiesId = setInterval(() => {
    if (!playing) {
      window.clearInterval(enemiesId);
    } else {
      const radius = Math.random() * (30 - 4) + 4;

      let x;
      let y;

      if (Math.random() < 0.5) {
        x = Math.random() < 0.5 ? 0 - radius : canvas.width + radius;
        y = Math.random() * canvas.height;
      } else {
        x = Math.random() * canvas.width;
        y = Math.random() < 0.5 ? 0 - radius : canvas.height + radius;
      }

      const color = `hsl(${Math.random() * 360}, 50%, 50%)`;
      const angle = Math.atan2(canvas.height / 2 - y, canvas.width / 2 - x);
      const velocity = {
        x: Math.cos(angle),
        y: Math.sin(angle),
      };

      enemies.push(new Enemy(x, y, radius, color, velocity));
    }
  }, 1000);
}

function animate() {
  const animationId = window.requestAnimationFrame(animate);

  c.fillStyle = 'rgba(0, 0, 0, 0.1)';
  c.fillRect(0, 0, canvas.width, canvas.height);

  player.draw();

  particles.forEach((particle, particleIndex) => {
    if (particle.alpha <= 0) {
      particles.splice(particleIndex, 1);
    } else {
      particle.update();
    }
  });

  projectiles.forEach((projectile, projectileIndex) => {
    projectile.update();

    // remove projectiles from edges of screen
    if (
      projectile.x + projectile.radius < 0 ||
      projectile.x - projectile.radius > canvas.width ||
      projectile.y + projectile.radius < 0 ||
      projectile.y - projectile.radius > canvas.height
    ) {
      setTimeout(() => {
        projectiles.splice(projectileIndex, 1);
      }, 0);
    }
  });

  enemies.forEach((enemy, enemyIndex) => {
    enemy.update();

    const dist = Math.hypot(player.x - enemy.x, player.y - enemy.y);

    // when enemy hits player - end game
    if (dist - enemy.radius - player.radius < 1) {
      console.log(`end game`);
      playing = false;
      window.cancelAnimationFrame(animationId);
      showStartModal(true);
      startScoreElement.innerHTML = score;
    }

    projectiles.forEach((projectile, projectileIndex) => {
      const dist = Math.hypot(projectile.x - enemy.x, projectile.y - enemy.y);

      // when projectile collides with enemy
      if (dist - enemy.radius - projectile.radius < 1) {
        // create explosions
        for (let i = 0; i < enemy.radius * 2; i++) {
          particles.push(
            new Particle(
              projectile.x,
              projectile.y,
              Math.random() * 2,
              enemy.color,
              {
                x: (Math.random() - 0.5) * (Math.random() * 8),
                y: (Math.random() - 0.5) * (Math.random() * 8),
              }
            )
          );
        }

        if (enemy.radius - 10 > 5) {
          score += 100;
          scoreElement.innerHTML = score;

          gsap.to(enemy, {
            radius: enemy.radius - 10,
          });

          setTimeout(() => {
            projectiles.splice(projectileIndex, 1);
          }, 0);
        } else {
          score += 250;
          scoreElement.innerHTML = score;

          setTimeout(() => {
            enemies.splice(enemyIndex, 1);
            projectiles.splice(projectileIndex, 1);
          }, 0);
        }
      }
    });
  });
}

function showStartModal(toggle) {
  startModalElement.style.display = toggle ? 'flex' : 'none';
}

startButtonElement.addEventListener('click', (_) => {
  init();
  showStartModal(false);
  animate();
  spawnEnemies();
});

window.addEventListener('click', ({ clientX, clientY }) => {
  if (playing) {
    const angle = Math.atan2(
      clientY - canvas.height / 2,
      clientX - canvas.width / 2
    );
    const velocity = {
      x: Math.cos(angle) * 5,
      y: Math.sin(angle) * 5,
    };

    projectiles.push(
      new Projectile(canvas.width / 2, canvas.height / 2, 5, 'white', velocity)
    );
  }
});
