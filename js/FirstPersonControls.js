export class FirstPersonControls {
  constructor(camera, domElement, world) {
    this.camera = camera;
    this.domElement = domElement;
    this.world = world;
    
    this.movementSpeed = 24;
    this.runningSpeed = 40; 
    this.lookSpeed = 1;
    
    this.moveForward = false;
    this.moveBackward = false;
    this.moveLeft = false;
    this.moveRight = false;
    this.jumping = false;
    
    this.euler = new THREE.Euler(0, 0, 0, 'YXZ');
    this.vec = new THREE.Vector3();
    
    // Player physics
    this.playerHeight = 2; 
    this.playerRadius = 0.3; 
    this.velocity = new THREE.Vector3();
    this.gravity = -30;
    this.jumpForce = 10;
    this.isOnGround = false;

    // Add ground contact tolerance
    this.groundContactTolerance = 0.1;
    
    // Initialize water interaction variables
    this.timeInWater = 0;
    this.floatDuration = 3; 
    this.holdingSpace = false; 

    // Flight mode properties
    this.flying = false;
    this.flyingUp = false;
    this.flyingDown = false;
    
    // Add running state
    this.isRunning = false;
    
    this.controlsUsed = {
      wasd: false,
      mouse: false,
      space: false,
      shift: false,
      flight: false
    };

    this.onMouseMove = this.onMouseMove.bind(this);
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onKeyUp = this.onKeyUp.bind(this);
    
    this.domElement.addEventListener('mousemove', (e) => {
      this.onMouseMove(e);
      if (document.pointerLockElement === this.domElement) {
        this.hideControl('mouse');
      }
    });
    
    document.addEventListener('keydown', (e) => {
      this.onKeyDown(e);
      switch (e.code) {
        case 'KeyW':
        case 'KeyS':
        case 'KeyA':
        case 'KeyD':
          this.hideControl('wasd');
          break;
        case 'Space':
          this.hideControl('space');
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          this.hideControl('shift');
          break;
        case 'KeyF':
          this.hideControl('flight');
          break;
      }
    });
    
    document.addEventListener('keyup', this.onKeyUp);
    
    this.domElement.addEventListener('click', () => {
      this.domElement.requestPointerLock();
    });
    
    // Cache vectors for reuse
    this._moveVec = new THREE.Vector3();
    this._targetPosition = new THREE.Vector3();
    this._checkPosition = new THREE.Vector3();
  }

  onMouseMove(event) {
    if (document.pointerLockElement === this.domElement) {
      this.euler.y -= event.movementX * 0.002 * this.lookSpeed;
      this.euler.x -= event.movementY * 0.002 * this.lookSpeed;
      this.euler.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.euler.x));
      
      this.camera.quaternion.setFromEuler(this.euler);
    }
  }

  onKeyDown(event) {
    switch (event.code) {
      case 'KeyW': 
        this.moveForward = true; 
        break;
      case 'KeyS': 
        this.moveBackward = true; 
        break;
      case 'KeyA': 
        this.moveLeft = true; 
        break;
      case 'KeyD': 
        this.moveRight = true; 
        break;
      case 'Space': {
        if (this.flying) {
          this.flyingUp = true;
        } else {
          this.holdingSpace = true;
          const waterLevel = this.world.waterVoxel.waterLevel;
          const inWater = this.camera.position.y < (waterLevel + 0.5);
          if (inWater) {
            this.velocity.y = this.jumpForce * 0.5;
          } else if (this.isOnGround) {
            this.velocity.y = this.jumpForce;
            this.isOnGround = false;
          }
        }
        break;
      }
      case 'KeyF': {
        this.flying = !this.flying;
        console.log('Flight mode: ' + (this.flying ? 'ON' : 'OFF'));
        break;
      }
      case 'ShiftLeft':
      case 'ShiftRight': {
        if (this.flying) {
          this.flyingDown = true;
        } else {
          this.isRunning = true;
        }
        break;
      }
      default:
        break;
    }
  }

  onKeyUp(event) {
    switch (event.code) {
      case 'KeyW': 
        this.moveForward = false; 
        break;
      case 'KeyS': 
        this.moveBackward = false; 
        break;
      case 'KeyA': 
        this.moveLeft = false; 
        break;
      case 'KeyD': 
        this.moveRight = false; 
        break;
      case 'Space': {
        if (this.flying) {
          this.flyingUp = false;
        } else {
          this.holdingSpace = false;
        }
        break;
      }
      case 'ShiftLeft':
      case 'ShiftRight': {
        if (this.flying) {
          this.flyingDown = false;
        } else {
          this.isRunning = false;
        }
        break;
      }
      default:
        break;
    }
  }

  hideControl(control) {
    if (!this.controlsUsed[control]) {
      this.controlsUsed[control] = true;
      const elementId = `${control}-control`;
      const element = document.getElementById(elementId);
      if (element) {
        element.classList.add('hidden');
      }

      // Check if all controls are used
      if (Object.values(this.controlsUsed).every(used => used)) {
        const controlsDiv = document.getElementById('controls');
        if (controlsDiv) {
          controlsDiv.style.display = 'none';
        }
      }
    }
  }

  update(deltaTime) {
    if (document.pointerLockElement !== this.domElement) return;

    if (this.flying) {
      const moveSpeed = this.movementSpeed * deltaTime;
      this._moveVec.set(0, 0, 0);
      if (this.moveForward) {
        this._moveVec.add(this.camera.getWorldDirection(this.vec).clone().setY(0));
      }
      if (this.moveBackward) {
        this._moveVec.add(this.camera.getWorldDirection(this.vec).clone().setY(0).negate());
      }
      this.vec.setFromMatrixColumn(this.camera.matrix, 0);
      if (this.moveLeft) {
        this._moveVec.add(this.vec.clone().setY(0).negate());
      }
      if (this.moveRight) {
        this._moveVec.add(this.vec.clone().setY(0));
      }
      if (this.flyingUp) {
        this._moveVec.y += 1;
      }
      if (this.flyingDown) {
        this._moveVec.y -= 1;
      }
      if (this._moveVec.lengthSq() > 0) {
        this._moveVec.normalize().multiplyScalar(moveSpeed);
        this.camera.position.add(this._moveVec);
      }
      return;
    }

    const waterLevel = this.world.waterVoxel.waterLevel;
    const isInWater = this.camera.position.y < (waterLevel + 0.5);

    this.isOnGround = this.checkGrounded(this.camera.position);

    // Use running speed if running, otherwise use normal movement speed
    const currentSpeed = this.isRunning ? this.runningSpeed : this.movementSpeed;
    const moveSpeed = currentSpeed * deltaTime;
    
    const prevPosition = this.camera.position.clone();

    this._moveVec.set(0, 0, 0);

    if (this.moveForward) 
      this._moveVec.add(this.camera.getWorldDirection(this.vec));
    if (this.moveBackward) 
      this._moveVec.add(this.camera.getWorldDirection(this.vec).multiplyScalar(-1));
    if (this.moveLeft) {
      this.vec.setFromMatrixColumn(this.camera.matrix, 0);
      this._moveVec.add(this.vec.multiplyScalar(-1));
    }
    if (this.moveRight) {
      this.vec.setFromMatrixColumn(this.camera.matrix, 0);
      this._moveVec.add(this.vec);
    }

    this._moveVec.y = 0;
    if (this._moveVec.lengthSq() > 0) {
      this._moveVec.normalize().multiplyScalar(moveSpeed);
      
      if (isInWater) {
        this._moveVec.multiplyScalar(0.5);
      }

      const originalPosition = this.camera.position.clone();
      
      this.camera.position.x += this._moveVec.x;
      this.camera.position.z += this._moveVec.z;
      
      if (this.checkCollision(this.camera.position)) {
        if (!this.tryStepUp(originalPosition, this._moveVec)) {
          this.camera.position.copy(originalPosition);
        }
      }
    }

    if (isInWater) {
      this.timeInWater += deltaTime;

      if (this.holdingSpace) {
        const buoyancy = -this.gravity * 1.2; 
        this.velocity.y += buoyancy * deltaTime;
        this.camera.position.y = Math.min(
          Math.max(this.camera.position.y, waterLevel - 0.5),
          waterLevel + 0.5
        );
      } else {
        this.velocity.y += (this.gravity * 0.3) * deltaTime; 
      }

      this.velocity.multiplyScalar(0.9);

    } else {
      this.timeInWater = 0;

      if (!this.isOnGround) {
        this.velocity.y += this.gravity * deltaTime;
      }
    }

    const newY = this.camera.position.y + this.velocity.y * deltaTime;
    this.camera.position.y = newY;

    if (this.checkCollision(this.camera.position)) {
      if (this.velocity.y <= 0) {
        this.camera.position.y = prevPosition.y;
        this.velocity.y = 0;
        this.isOnGround = true;
      } else {
        this.camera.position.y = prevPosition.y;
        this.velocity.y = 0;
      }
    }

    if (this.isOnGround && this.velocity.y <= 0) {
      this.velocity.y = 0;
    }
  }

  checkCollision(position) {
    const padding = 0.1;
    const playerMin = new THREE.Vector3(
      position.x - this.playerRadius + padding,
      position.y - this.playerHeight,
      position.z - this.playerRadius + padding
    );
    const playerMax = new THREE.Vector3(
      position.x + this.playerRadius - padding,
      position.y,
      position.z + this.playerRadius - padding
    );

    for (let x = Math.floor(playerMin.x); x <= Math.floor(playerMax.x); x++) {
      for (let y = Math.floor(playerMin.y); y <= Math.floor(playerMax.y); y++) {
        for (let z = Math.floor(playerMin.z); z <= Math.floor(playerMax.z); z++) {
          if (this.world.getVoxel(x, y, z) > 0) {
            return true;
          }
        }
      }
    }
    return false;
  }

  checkGrounded(position) {
    const groundCheckPosition = position.clone();
    groundCheckPosition.y -= this.playerHeight + this.groundContactTolerance;
    
    for (let x = -1; x <= 1; x++) {
      for (let z = -1; z <= 1; z++) {
        const checkX = Math.floor(groundCheckPosition.x + x * this.playerRadius);
        const checkY = Math.floor(groundCheckPosition.y);
        const checkZ = Math.floor(groundCheckPosition.z + z * this.playerRadius);
        
        if (this.world.getVoxel(checkX, checkY, checkZ) > 0) {
          return true;
        }
      }
    }
    return false;
  }

  tryStepUp(prevPosition, moveVec) {
    const directStepPosition = prevPosition.clone();
    directStepPosition.y += 1.0;
    
    this.camera.position.copy(directStepPosition);
    this.camera.position.add(moveVec);
    
    if (!this.checkCollision(this.camera.position)) {
      while (!this.checkCollision(this.camera.position) && this.camera.position.y > prevPosition.y) {
        this.camera.position.y -= 0.1;
      }
      this.camera.position.y += 0.1;
      return true;
    }
    
    const steps = 4;
    const stepSize = 1.0 / steps;
    
    for (let i = 1; i <= steps; i++) {
      const testPosition = prevPosition.clone();
      testPosition.y += stepSize * i;
      
      this.camera.position.copy(testPosition);
      this.camera.position.add(moveVec);
      
      if (!this.checkCollision(this.camera.position)) {
        while (!this.checkCollision(this.camera.position) && this.camera.position.y > prevPosition.y) {
          this.camera.position.y -= 0.1;
        }
        this.camera.position.y += 0.1;
        return true;
      }
      
      this.camera.position.copy(prevPosition);
    }
    
    return false;
  }
}