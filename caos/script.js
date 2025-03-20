class Vector {
  static zero() {
    return {x: 0, y: 0, z: 0};
  }

  static up() {
    return {x: 0, y: 1, z: 0};
  }

  static down() {
    return {x: 0, y: -1, z: 0};
  }

  static copy(v) {
    return {x: v.x, y: v.y, z: v.z};
  }

  static fromArray(a) {
    return {
      x: a[0] ?? 0,
      y: a[1] ?? 0,
      z: a[2] ?? 0,
      w: a[3] ?? 0
    };
  }

  static add(a, b) {
    return {
      x: a.x + b.x,
      y: a.y + b.y,
      z: a.z + b.z
    };
  }

  static subtract(a, b) {
    return {
      x: a.x - b.x,
      y: a.y - b.y,
      z: a.z - b.z
    };
  }

  static multiply(v, scalar) {
    return {
      x: v.x * scalar,
      y: v.y * scalar,
      z: v.z * scalar
    };
  }

  static compMultiply(a, b) {
    return {
      x: a.x * b.x,
      y: a.y * b.y,
      z: a.z * b.z
    };
  }

  static divide(v, scalar) {
    return {
      x: v.x / scalar,
      y: v.y / scalar,
      z: v.z / scalar
    };
  }

  static rotate2D(v, angle) {
    return {
      x: v.x * Math.cos(angle) - v.y * Math.sin(angle),
      y: v.x * Math.sin(angle) + v.y * Math.cos(angle)
    };
  }

  static rotateAround(v, axis, angle) {
    var aIIb = Vector.multiply(axis, Vector.dot(v, axis) / Vector.dot(axis, axis));
    var aTb = Vector.subtract(v, aIIb);
    var w = Vector.cross(axis, aTb);
    var x1 = Math.cos(angle) / Vector.length(aTb);
    var x2 = Math.sin(angle) / Vector.length(w);
    var aTb0 = Vector.multiply(Vector.add(Vector.multiply(aTb, x1), Vector.multiply(w, x2)), Vector.length(aTb));
    var ab0 = Vector.add(aTb0, aIIb);

    return ab0;
  }

  static projectOnPlane(v, normal) {
    var distToPlane = Vector.dot(normal, v);
    return Vector.subtract(v, Vector.multiply(normal, distToPlane));
  }

  static length(v) {
    var sum = v.x * v.x + v.y * v.y;
    if (v.z) sum += v.z * v.z;
    return Math.sqrt(sum);
  }

  static distance(a, b) {
    return Vector.length(Vector.subtract(a, b));
  }

  static normalize(v) {
    var len = Vector.length(v);
    if (len < 1e-6)
      return Vector.copy(v);
    else
      return Vector.divide(v, len);
  }
  
  static dot(a, b) {
    var sum = a.x * b.x + a.y * b.y;
    if (a.z && b.z) sum += a.z * b.z;
    return sum;
  }

  static cross(a, b) {
    return {
      x: a.y * b.z - a.z * b.y,
      y: a.z * b.x - a.x * b.z,
      z: a.x * b.y - a.y * b.x
    };
  }

  static lerp(a, b, t) {
    return {
      x: lerp(a.x, b.x, t),
      y: lerp(a.y, b.y, t),
      z: lerp(a.z, b.z, t)
    };
  }
}

var gc = new GameCanvas();

var colors = ["black", "blue", "violet"];
var magnetSpacing = 0.1;
var magnetStrength = 0.01;
var cameraZoom = 1200;

var magnets = [];
for (var i = 0; i < 3; i++) {
  var angle = Math.PI * 2 / 3 * i;
  magnets.push(new Magnet({x: Math.cos(angle) * magnetSpacing, y: Math.sin(angle) * magnetSpacing}, colors[i]));
}

var ball = new Ball({x: (Math.random() - 0.5) * 0.2, y: (Math.random() - 0.5) * 0.2});

var size = 0.6;
var stepSize = 0.01;

var x = -size / 2;
var y = -size / 2;

console.log("Done");

loop();
function loop() {
  for (var i = 0; i < 50; i++) {
    ball.position = {x, y};
    ball.velocity = Vector.zero();
    ball.closeTimer = 0;

    while (ball.closeTimer < 150) {
      ball.update(1 / 60);
    }

    var pos = worldToScreen({x: x - stepSize / 2, y: y - stepSize / 2});
    rectangle(pos.x, pos.y, stepSize * cameraZoom, stepSize * cameraZoom, colors[ball.currentClosestMagnet]);

    x += stepSize;
    if (x > size / 2) {
      x = -size / 2;
      y += stepSize;
    }
    if (y > size / 2) {
      x = -size / 2;
      y = -size / 2;
      stepSize *= 0.6;
    }
  }
  
  update();
  requestAnimationFrame(loop);
}

function Ball(position) {
  this.position = position;
  this.velocity = Vector.zero();
  
  this.closeTimer = 0;
  this.currentClosestMagnet = null;
  
  this.update = function(dt) {
    for (var i = 0; i < magnets.length; i++) {
      var distance = Vector.distance(magnets[i].position, this.position);
      if (distance < 0.01) {
        if (this.currentClosestMagnet == i) {
          this.closeTimer++;
        }
        else {
          this.currentClosestMagnet = i;
          this.closeTimer = 0;
        }
      }
      this.velocity = Vector.add(this.velocity, Vector.multiply(magnets[i].getForce(this.position), dt));
    }
    
    var gravity = Vector.multiply(this.position, -1);
    this.velocity = Vector.add(this.velocity, Vector.multiply(gravity, dt));
    
    this.velocity = Vector.multiply(this.velocity, 0.995);
    this.position = Vector.add(this.position, Vector.multiply(this.velocity, dt));
  }
  
  this.render = function() {
    var screenPos = worldToScreen(this.position);
    circle(screenPos.x, screenPos.y, cameraZoom / 70, "gray");
  }
}

function Magnet(position, color) {
  this.position = position;
  this.color = color;
  
  this.getForce = function(p) {
    var distance = Vector.distance(this.position, p) + 0.05;
    if (distance < 1e-6) return Vector.zero();
    return Vector.multiply(Vector.normalize(Vector.subtract(this.position, p)), magnetStrength / (distance * distance));
  }
  
  this.render = function() {
    var screenPos = worldToScreen(this.position);
    circle(screenPos.x, screenPos.y, cameraZoom / 100, this.color);
  }
}

function worldToScreen(position) {
  return {
    x: width / 2 + position.x * cameraZoom,
    y: height / 2 + position.y * cameraZoom
  };
}

function screenToWorld(position) {
  return {
    x: (position.x - width / 2) / cameraZoom,
    y: (position.y - height / 2) / cameraZoom
  };
}