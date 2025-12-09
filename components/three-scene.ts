import * as THREE from "three"

export default class Scene {
  private scene: THREE.Scene
  private camera: THREE.PerspectiveCamera
  private renderer: THREE.WebGLRenderer
  private container: HTMLDivElement
  private scrollProgress = 0
  private bikes: THREE.Group[] = []
  private cars: THREE.Group[] = []
  private particles: THREE.Points | null = null
  private upSideDownPortal: THREE.Mesh | null = null
  private time = 0
  private telekinesisSpheres: THREE.Mesh[] = []
  private electricityEffect: THREE.LineSegments | null = null

  constructor(container: HTMLDivElement) {
    this.container = container

    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0x0a0a1a)
    this.scene.fog = new THREE.Fog(0x0a0a1a, 80, 500)

    const width = window.innerWidth
    const height = window.innerHeight
    this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000)
    this.camera.position.set(0, 6, 25)

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    this.renderer.setSize(width, height)
    this.renderer.setPixelRatio(window.devicePixelRatio)
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFShadowShadowMap
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.2
    container.appendChild(this.renderer.domElement)

    this.setupLighting()
    this.createRoad()
    this.createEnvironment()
    this.createBikes()
    this.createCars()
    this.createParticles()
    this.createUpSideDownPortal()
    this.createHawkinsSign()
    this.createTelekinesisSpheres()
    this.createElectricityEffect()
    this.createBuildings()
  }

  private setupLighting() {
    const ambientLight = new THREE.AmbientLight(0xff6b35, 0.5)
    this.scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xff4444, 1.5)
    directionalLight.position.set(60, 120, 60)
    directionalLight.castShadow = true
    directionalLight.shadow.mapSize.width = 2048
    directionalLight.shadow.mapSize.height = 2048
    directionalLight.shadow.camera.far = 600
    directionalLight.shadow.camera.left = -150
    directionalLight.shadow.camera.right = 150
    directionalLight.shadow.camera.top = 150
    directionalLight.shadow.camera.bottom = -150
    directionalLight.shadow.bias = -0.0001
    this.scene.add(directionalLight)

    const blueLight = new THREE.PointLight(0x4080ff, 1.2)
    blueLight.position.set(-40, 50, -40)
    this.scene.add(blueLight)

    const redLight = new THREE.PointLight(0xff3333, 0.8)
    redLight.position.set(40, 40, 40)
    this.scene.add(redLight)

    const skyLight = new THREE.HemisphereLight(0xff5533, 0x1a2a4a, 0.7)
    this.scene.add(skyLight)
  }

  private createRoad() {
    const roadGeometry = new THREE.PlaneGeometry(24, 300)
    const roadMaterial = new THREE.MeshStandardMaterial({
      color: 0x2a2a35,
      roughness: 0.7,
      metalness: 0.05,
    })
    const road = new THREE.Mesh(roadGeometry, roadMaterial)
    road.rotation.x = -Math.PI / 2
    road.receiveShadow = true
    road.position.z = -100
    this.scene.add(road)

    const lineGeometry = new THREE.PlaneGeometry(1, 300)
    const lineMaterial = new THREE.MeshStandardMaterial({
      color: 0xffff00,
      emissive: 0xffff00,
      emissiveIntensity: 1.0,
      unlit: false,
    })
    const roadLine = new THREE.Mesh(lineGeometry, lineMaterial)
    roadLine.rotation.x = -Math.PI / 2
    roadLine.position.set(0, 0.02, -100)
    this.scene.add(roadLine)

    const edgeLineLeft = new THREE.Mesh(lineGeometry, lineMaterial.clone())
    edgeLineLeft.rotation.x = -Math.PI / 2
    edgeLineLeft.position.set(-12, 0.02, -100)
    edgeLineLeft.scale.x = 0.4
    this.scene.add(edgeLineLeft)

    const edgeLineRight = new THREE.Mesh(lineGeometry, lineMaterial.clone())
    edgeLineRight.rotation.x = -Math.PI / 2
    edgeLineRight.position.set(12, 0.02, -100)
    edgeLineRight.scale.x = 0.4
    this.scene.add(edgeLineRight)
  }

  private createEnvironment() {
    const treeMaterial = new THREE.MeshStandardMaterial({
      color: 0x050505,
      roughness: 1,
      emissive: 0x1a1a2a,
      emissiveIntensity: 0.3,
    })

    for (let i = 0; i < 25; i++) {
      const treeGeometry = new THREE.ConeGeometry(3 + Math.random() * 2, 15 + Math.random() * 10, 8)
      const tree = new THREE.Mesh(treeGeometry, treeMaterial)
      tree.position.set((Math.random() - 0.5) * 100, 0, (Math.random() - 0.5) * 400 - 150)
      tree.castShadow = true
      tree.receiveShadow = true
      this.scene.add(tree)
    }

    const groundGeometry = new THREE.PlaneGeometry(300, 600)
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x0f0f1f,
      roughness: 0.95,
      emissive: 0x1a1a3a,
      emissiveIntensity: 0.2,
    })
    const ground = new THREE.Mesh(groundGeometry, groundMaterial)
    ground.rotation.x = -Math.PI / 2
    ground.position.y = -0.15
    ground.receiveShadow = true
    this.scene.add(ground)

    for (let i = 0; i < 15; i++) {
      const poleGeometry = new THREE.CylinderGeometry(0.3, 0.3, 25, 8)
      const poleMaterial = new THREE.MeshStandardMaterial({
        color: 0x1a1a2a,
        roughness: 0.8,
      })
      const pole = new THREE.Mesh(poleGeometry, poleMaterial)
      pole.position.set((i % 2) * 15 - 7.5, 12.5, -50 - i * 30)
      pole.castShadow = true
      this.scene.add(pole)
    }
  }

  private createBikes() {
    const positions = [-6, 0, 6]
    positions.forEach((x, index) => {
      const bikeGroup = this.createBike()
      bikeGroup.position.set(x, 0, -40 + index * 35)
      this.bikes.push(bikeGroup)
      this.scene.add(bikeGroup)
    })
  }

  private createBike(): THREE.Group {
    const bikeGroup = new THREE.Group()

    const framePoints = [new THREE.Vector3(0, 0.4, 0), new THREE.Vector3(0, 0.2, 0.5)]
    const frameCurve = new THREE.LineCurve3(framePoints[0], framePoints[1])
    const frameGeometry = new THREE.TubeGeometry(frameCurve, 8, 0.12, 8)
    const frameMaterial = new THREE.MeshStandardMaterial({
      color: 0xff2233,
      metalness: 0.8,
      roughness: 0.2,
    })
    const frame = new THREE.Mesh(frameGeometry, frameMaterial)
    frame.castShadow = true
    bikeGroup.add(frame)

    for (let i = 0; i < 2; i++) {
      const wheelGeometry = new THREE.TorusGeometry(0.5, 0.15, 16, 100)
      const wheelMaterial = new THREE.MeshStandardMaterial({
        color: 0x1a1a1a,
        metalness: 0.9,
        roughness: 0.15,
      })
      const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial)
      wheel.rotation.y = Math.PI / 2
      wheel.position.set(i === 0 ? -0.6 : 0.6, 0.3, 0)
      wheel.castShadow = true
      bikeGroup.add(wheel)

      // Wheel rim detail
      const rimGeometry = new THREE.TorusGeometry(0.48, 0.05, 16, 100)
      const rimMaterial = new THREE.MeshStandardMaterial({
        color: 0x444444,
        metalness: 0.95,
        roughness: 0.1,
      })
      const rim = new THREE.Mesh(rimGeometry, rimMaterial)
      rim.rotation.y = Math.PI / 2
      rim.position.set(i === 0 ? -0.6 : 0.6, 0.3, 0)
      bikeGroup.add(rim)
    }

    const seatGeometry = new THREE.BoxGeometry(0.3, 0.2, 0.5)
    const seatMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b0000,
      roughness: 0.7,
    })
    const seat = new THREE.Mesh(seatGeometry, seatMaterial)
    seat.position.y = 0.65
    seat.castShadow = true
    bikeGroup.add(seat)

    // Handlebars
    const handlebarGeometry = new THREE.TubeGeometry(
      new THREE.LineCurve3(new THREE.Vector3(-0.3, 0.5, 0.5), new THREE.Vector3(0.3, 0.5, 0.5)),
      4,
      0.08,
      8,
    )
    const handlebarMaterial = new THREE.MeshStandardMaterial({
      color: 0xff2233,
      metalness: 0.7,
      roughness: 0.3,
    })
    const handlebar = new THREE.Mesh(handlebarGeometry, handlebarMaterial)
    bikeGroup.add(handlebar)

    return bikeGroup
  }

  private createCars() {
    const positions = [
      { x: -8, z: -50, rotation: 0 },
      { x: 8, z: -15, rotation: 0.1 },
      { x: -6, z: 20, rotation: -0.1 },
    ]
    positions.forEach((pos) => {
      const carGroup = this.createCar()
      carGroup.position.set(pos.x, 0, pos.z)
      carGroup.rotation.y = pos.rotation
      this.cars.push(carGroup)
      this.scene.add(carGroup)
    })
  }

  private createCar(): THREE.Group {
    const carGroup = new THREE.Group()

    const bodyGeometry = new THREE.BoxGeometry(2, 1.2, 4.5)
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0xaa1111,
      metalness: 0.7,
      roughness: 0.25,
    })
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial)
    body.position.y = 0.65
    body.castShadow = true
    body.receiveShadow = true
    carGroup.add(body)

    const cabinGeometry = new THREE.BoxGeometry(1.8, 1.0, 2.2)
    const cabinMaterial = new THREE.MeshStandardMaterial({
      color: 0x0f1f4a,
      metalness: 0.3,
      roughness: 0.2,
      transparent: true,
      opacity: 0.6,
    })
    const cabin = new THREE.Mesh(cabinGeometry, cabinMaterial)
    cabin.position.set(0, 1.45, -0.6)
    cabin.castShadow = true
    carGroup.add(cabin)

    const windshieldGeometry = new THREE.PlaneGeometry(1.7, 0.8)
    const windshieldMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a3a7a,
      metalness: 0.2,
      roughness: 0.1,
      transparent: true,
      opacity: 0.5,
    })
    const windshield = new THREE.Mesh(windshieldGeometry, windshieldMaterial)
    windshield.position.set(0, 1.6, -0.2)
    windshield.rotation.x = 0.3
    windshield.castShadow = true
    carGroup.add(windshield)

    const rearWindowGeometry = new THREE.PlaneGeometry(1.7, 0.7)
    const rearWindow = new THREE.Mesh(rearWindowGeometry, windshieldMaterial.clone())
    rearWindow.position.set(0, 1.5, -1.8)
    rearWindow.rotation.x = -0.2
    carGroup.add(rearWindow)

    for (let i = 0; i < 4; i++) {
      const wheelGeometry = new THREE.CylinderGeometry(0.55, 0.55, 0.45, 16)
      const wheelMaterial = new THREE.MeshStandardMaterial({
        color: 0x0a0a0a,
        metalness: 0.9,
        roughness: 0.05,
      })
      const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial)
      wheel.rotation.z = Math.PI / 2
      wheel.position.set(i < 2 ? -1.1 : 1.1, 0.55, i % 2 === 0 ? -1.3 : 1.3)
      wheel.castShadow = true
      carGroup.add(wheel)

      const hubGeometry = new THREE.CylinderGeometry(0.48, 0.48, 0.2, 16)
      const hubMaterial = new THREE.MeshStandardMaterial({
        color: 0x444444,
        metalness: 0.95,
        roughness: 0.08,
      })
      const hub = new THREE.Mesh(hubGeometry, hubMaterial)
      hub.rotation.z = Math.PI / 2
      hub.position.set(i < 2 ? -1.1 : 1.1, 0.55, i % 2 === 0 ? -1.3 : 1.3)
      carGroup.add(hub)

      const treadGeometry = new THREE.TorusGeometry(0.52, 0.08, 4, 32)
      const treadMaterial = new THREE.MeshStandardMaterial({
        color: 0x1a1a1a,
        metalness: 0.4,
        roughness: 0.6,
      })
      const tread = new THREE.Mesh(treadGeometry, treadMaterial)
      tread.rotation.z = Math.PI / 2
      tread.position.set(i < 2 ? -1.1 : 1.1, 0.55, i % 2 === 0 ? -1.3 : 1.3)
      carGroup.add(tread)
    }

    for (let i = 0; i < 2; i++) {
      const lightGeometry = new THREE.SphereGeometry(0.25, 12, 12)
      const lightMaterial = new THREE.MeshStandardMaterial({
        color: 0xffff88,
        emissive: 0xffff88,
        emissiveIntensity: 1.5,
      })
      const light = new THREE.Mesh(lightGeometry, lightMaterial)
      light.position.set(i === 0 ? -0.6 : 0.6, 0.85, 2.1)
      carGroup.add(light)
    }

    const bumperGeometry = new THREE.BoxGeometry(2, 0.2, 0.35)
    const bumperMaterial = new THREE.MeshStandardMaterial({
      color: 0x222222,
      metalness: 0.8,
      roughness: 0.2,
    })
    const bumper = new THREE.Mesh(bumperGeometry, bumperMaterial)
    bumper.position.set(0, 0.4, 2.15)
    carGroup.add(bumper)

    for (let i = 0; i < 2; i++) {
      const handleGeometry = new THREE.BoxGeometry(0.15, 0.1, 0.3)
      const handleMaterial = new THREE.MeshStandardMaterial({
        color: 0x333333,
        metalness: 0.6,
        roughness: 0.4,
      })
      const handle = new THREE.Mesh(handleGeometry, handleMaterial)
      handle.position.set(i === 0 ? -1.05 : 1.05, 1.2, -0.3)
      carGroup.add(handle)
    }

    const roofGeometry = new THREE.BoxGeometry(1.8, 0.08, 2.2)
    const roofMaterial = new THREE.MeshStandardMaterial({
      color: 0x8a0a0a,
      metalness: 0.5,
      roughness: 0.3,
    })
    const roof = new THREE.Mesh(roofGeometry, roofMaterial)
    roof.position.set(0, 1.75, -0.5)
    carGroup.add(roof)

    return carGroup
  }

  private createParticles() {
    const particlesGeometry = new THREE.BufferGeometry()
    const particleCount = 800

    const positionArray = new Float32Array(particleCount * 3)
    const colorArray = new Float32Array(particleCount * 3)

    for (let i = 0; i < particleCount; i++) {
      positionArray[i * 3] = (Math.random() - 0.5) * 150
      positionArray[i * 3 + 1] = Math.random() * 60
      positionArray[i * 3 + 2] = (Math.random() - 0.5) * 300

      const hue = Math.random() > 0.5 ? 0.6 : 0.2 // Blue or red
      colorArray[i * 3] = hue > 0.5 ? 0.25 : 1
      colorArray[i * 3 + 1] = hue > 0.5 ? 0.5 : 0.2
      colorArray[i * 3 + 2] = hue > 0.5 ? 1 : 0.2
    }

    particlesGeometry.setAttribute("position", new THREE.BufferAttribute(positionArray, 3))
    particlesGeometry.setAttribute("color", new THREE.BufferAttribute(colorArray, 3))

    const particlesMaterial = new THREE.PointsMaterial({
      size: 0.5,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.5,
      vertexColors: true,
    })

    this.particles = new THREE.Points(particlesGeometry, particlesMaterial)
    this.particles.position.z = -100
    this.scene.add(this.particles)
  }

  private createUpSideDownPortal() {
    this.createDemogorgon()
  }

  private createDemogorgon() {
    const demoGroup = new THREE.Group()
    demoGroup.position.set(0, 0, -250)

    const headGeometry = new THREE.SphereGeometry(1.5, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.6)
    const headMaterial = new THREE.MeshStandardMaterial({
      color: 0x2a1a2a,
      emissive: 0x551133,
      emissiveIntensity: 0.5,
      metalness: 0.3,
      roughness: 0.7,
    })
    const head = new THREE.Mesh(headGeometry, headMaterial)
    head.scale.set(1, 1.8, 1.2)
    head.position.y = 3
    head.castShadow = true
    demoGroup.add(head)

    const mouthGeometry = new THREE.ConeGeometry(1.2, 2, 16)
    const mouthMaterial = new THREE.MeshStandardMaterial({
      color: 0x3a0a2a,
      emissive: 0xff2244,
      emissiveIntensity: 0.8,
    })
    const mouth = new THREE.Mesh(mouthGeometry, mouthMaterial)
    mouth.position.set(0, 2.5, 1.3)
    mouth.rotation.z = Math.PI
    mouth.castShadow = true
    demoGroup.add(mouth)

    for (let i = 0; i < 12; i++) {
      const fangGeometry = new THREE.ConeGeometry(0.15, 0.6, 8)
      const fangMaterial = new THREE.MeshStandardMaterial({
        color: 0xcccccc,
        emissive: 0x666666,
        emissiveIntensity: 0.3,
        metalness: 0.5,
      })
      const fang = new THREE.Mesh(fangGeometry, fangMaterial)
      const angle = (i / 12) * Math.PI * 2
      fang.position.set(Math.cos(angle) * 1, 2.5, Math.sin(angle) * 0.8 + 1.3)
      fang.rotation.x = 0.3
      demoGroup.add(fang)
    }

    for (let i = 0; i < 2; i++) {
      const eyeGeometry = new THREE.SphereGeometry(0.4, 8, 8)
      const eyeMaterial = new THREE.MeshStandardMaterial({
        color: 0xff1111,
        emissive: 0xff3333,
        emissiveIntensity: 1.2,
      })
      const eye = new THREE.Mesh(eyeGeometry, eyeMaterial)
      eye.position.set(i === 0 ? -0.6 : 0.6, 3.5, 1.5)
      demoGroup.add(eye)
    }

    const bodyGeometry = new THREE.ConeGeometry(0.8, 4, 12)
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a0a2a,
      emissive: 0x330a55,
      emissiveIntensity: 0.4,
      metalness: 0.2,
      roughness: 0.8,
    })
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial)
    body.position.y = 0.5
    body.castShadow = true
    demoGroup.add(body)

    for (let i = 0; i < 6; i++) {
      const tentacleGroup = new THREE.Group()
      const angle = (i / 6) * Math.PI * 2 - Math.PI / 3
      tentacleGroup.position.set(Math.cos(angle) * 1.2, 1, Math.sin(angle) * 1.2)

      for (let j = 0; j < 4; j++) {
        const segmentGeometry = new THREE.SphereGeometry(0.25 - j * 0.05, 8, 8)
        const segmentMaterial = new THREE.MeshStandardMaterial({
          color: 0x2a1a3a,
          emissive: 0x441155,
          emissiveIntensity: 0.3 + j * 0.1,
          metalness: 0.4,
          roughness: 0.6,
        })
        const segment = new THREE.Mesh(segmentGeometry, segmentMaterial)
        segment.position.y = j * 0.6
        segment.castShadow = true
        tentacleGroup.add(segment)
      }

      demoGroup.add(tentacleGroup)
    }

    this.upSideDownPortal = new THREE.Group()
    this.upSideDownPortal.add(demoGroup)
    this.scene.add(this.upSideDownPortal)
  }

  private createHawkinsSign() {
    const canvas = document.createElement("canvas")
    canvas.width = 1024
    canvas.height = 512
    const ctx = canvas.getContext("2d")!

    ctx.fillStyle = "#000000"
    ctx.fillRect(0, 0, 1024, 512)

    ctx.strokeStyle = "#ffffff"
    ctx.lineWidth = 8
    ctx.strokeRect(30, 30, 964, 452)

    ctx.fillStyle = "#ffffff"
    ctx.font = "bold 120px Arial"
    ctx.textAlign = "center"
    ctx.shadowColor = "#ff3333"
    ctx.shadowBlur = 20
    ctx.fillText("WELCOME TO", 512, 150)
    ctx.font = "bold 180px Arial"
    ctx.fillText("HAWKINS", 512, 350)

    const texture = new THREE.CanvasTexture(canvas)
    const signGeometry = new THREE.PlaneGeometry(15, 7.5)
    const signMaterial = new THREE.MeshStandardMaterial({
      map: texture,
      emissive: 0x222222,
      emissiveIntensity: 0.3,
    })
    const sign = new THREE.Mesh(signGeometry, signMaterial)
    sign.position.set(16, 8, -100)
    sign.castShadow = true
    this.scene.add(sign)
  }

  private createTelekinesisSpheres() {
    for (let i = 0; i < 5; i++) {
      const sphereGeometry = new THREE.SphereGeometry(0.8, 16, 16)
      const sphereMaterial = new THREE.MeshStandardMaterial({
        color: 0xff3333,
        emissive: 0xff3333,
        emissiveIntensity: 0.7,
        wireframe: true,
      })
      const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial)
      sphere.position.set((Math.random() - 0.5) * 40, 10 + Math.random() * 20, -150 + Math.random() * 100)
      this.telekinesisSpheres.push(sphere)
      this.scene.add(sphere)
    }
  }

  private createElectricityEffect() {
    const points = []
    for (let i = 0; i < 20; i++) {
      points.push(
        new THREE.Vector3((Math.random() - 0.5) * 80, Math.random() * 40 + 10, (Math.random() - 0.5) * 200 - 100),
      )
    }

    const lineGeometry = new THREE.BufferGeometry()
    const linePositions = new Float32Array(points.length * 3)
    points.forEach((p, i) => {
      linePositions[i * 3] = p.x
      linePositions[i * 3 + 1] = p.y
      linePositions[i * 3 + 2] = p.z
    })
    lineGeometry.setAttribute("position", new THREE.BufferAttribute(linePositions, 3))

    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0x1e90ff,
      transparent: true,
      opacity: 0.3,
      linewidth: 2,
    })
    this.electricityEffect = new THREE.LineSegments(lineGeometry, lineMaterial)
    this.scene.add(this.electricityEffect)
  }

  private createBuildings() {
    // Left side houses
    const leftHouses = [
      { x: -20, z: -60, width: 4, height: 3, depth: 5, roofColor: 0x4a2c2a },
      { x: -22, z: -20, width: 5, height: 3.5, depth: 6, roofColor: 0x5a3c2a },
      { x: -25, z: 40, width: 4.5, height: 3.2, depth: 5.5, roofColor: 0x3a2c2a },
      { x: -18, z: 100, width: 4, height: 3, depth: 5, roofColor: 0x4a3c3a },
    ]

    // Right side houses
    const rightHouses = [
      { x: 20, z: -80, width: 4.5, height: 3.3, depth: 5.5, roofColor: 0x6a3c2a },
      { x: 22, z: -10, width: 5, height: 3.5, depth: 6, roofColor: 0x4a2c2a },
      { x: 25, z: 60, width: 4, height: 3, depth: 5, roofColor: 0x5a3c3a },
      { x: 18, z: 120, width: 4.5, height: 3.2, depth: 5.5, roofColor: 0x3a2c3a },
    ]

    const allHouses = [...leftHouses, ...rightHouses]
    allHouses.forEach((houseData) => {
      this.createHouse(
        houseData.x,
        houseData.z,
        houseData.width,
        houseData.height,
        houseData.depth,
        houseData.roofColor,
      )
    })

    // Add a store building
    this.createStoreBuilding(-35, -120, 6, 3.5, 7)
    this.createStoreBuilding(35, 80, 6, 3.5, 7)
  }

  private createHouse(x: number, z: number, width: number, height: number, depth: number, roofColor: number) {
    const houseGroup = new THREE.Group()
    houseGroup.position.set(x, 0, z)

    // Main house body
    const wallGeometry = new THREE.BoxGeometry(width, height, depth)
    const wallMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b6b47,
      roughness: 0.85,
      metalness: 0.05,
    })
    const walls = new THREE.Mesh(wallGeometry, wallMaterial)
    walls.position.y = height / 2
    walls.castShadow = true
    walls.receiveShadow = true
    houseGroup.add(walls)

    // Roof - triangular shape
    const roofGeometry = new THREE.ConeGeometry(Math.sqrt(width * width + depth * depth) / 2, height * 0.6, 4)
    const roofMaterial = new THREE.MeshStandardMaterial({
      color: roofColor,
      roughness: 0.9,
      metalness: 0.05,
    })
    const roof = new THREE.Mesh(roofGeometry, roofMaterial)
    roof.position.y = height + height * 0.3
    roof.rotation.y = Math.PI / 4
    roof.castShadow = true
    houseGroup.add(roof)

    // Front door
    const doorGeometry = new THREE.BoxGeometry(width * 0.35, height * 0.6, 0.15)
    const doorMaterial = new THREE.MeshStandardMaterial({
      color: 0x3a2a1a,
      roughness: 0.7,
    })
    const door = new THREE.Mesh(doorGeometry, doorMaterial)
    door.position.set(0, height * 0.3, depth / 2 + 0.1)
    door.castShadow = true
    houseGroup.add(door)

    // Door handle
    const handleGeometry = new THREE.SphereGeometry(0.1, 8, 8)
    const handleMaterial = new THREE.MeshStandardMaterial({
      color: 0xaa8844,
      metalness: 0.8,
    })
    const handle = new THREE.Mesh(handleGeometry, handleMaterial)
    handle.position.set(width * 0.15, height * 0.3, depth / 2 + 0.2)
    houseGroup.add(handle)

    // Windows
    const windowPositions = [
      { x: -width / 3, z: depth / 2 },
      { x: width / 3, z: depth / 2 },
      { x: -width / 3, z: -depth / 2 },
      { x: width / 3, z: -depth / 2 },
    ]

    windowPositions.forEach((pos) => {
      const windowGeometry = new THREE.BoxGeometry(width * 0.25, height * 0.25, 0.1)
      const windowMaterial = new THREE.MeshStandardMaterial({
        color: 0x2a4a6a,
        metalness: 0.3,
        transparent: true,
        opacity: 0.4,
      })
      const windowMesh = new THREE.Mesh(windowGeometry, windowMaterial)
      windowMesh.position.set(pos.x, height * 0.55, pos.z + 0.05)
      houseGroup.add(windowMesh)

      // Window frame
      const frameGeometry = new THREE.BoxGeometry(width * 0.27, height * 0.27, 0.05)
      const frameMaterial = new THREE.MeshStandardMaterial({
        color: 0x5a5a5a,
        metalness: 0.5,
        roughness: 0.4,
      })
      const frame = new THREE.Mesh(frameGeometry, frameMaterial)
      frame.position.set(pos.x, height * 0.55, pos.z + 0.08)
      houseGroup.add(frame)
    })

    // Chimney
    const chimneyGeometry = new THREE.BoxGeometry(width * 0.15, height * 0.8, depth * 0.15)
    const chimneyMaterial = new THREE.MeshStandardMaterial({
      color: 0x5a3a2a,
      roughness: 0.9,
    })
    const chimney = new THREE.Mesh(chimneyGeometry, chimneyMaterial)
    chimney.position.set(width * 0.3, height + height * 0.4, -depth * 0.35)
    chimney.castShadow = true
    houseGroup.add(chimney)

    // Porch
    const porchGeometry = new THREE.BoxGeometry(width * 0.5, height * 0.1, depth * 0.3)
    const porchMaterial = new THREE.MeshStandardMaterial({
      color: 0x7a5a3a,
      roughness: 0.85,
    })
    const porch = new THREE.Mesh(porchGeometry, porchMaterial)
    porch.position.set(0, height * 0.05, depth / 2 + 0.2)
    porch.receiveShadow = true
    houseGroup.add(porch)

    // Porch pillars
    for (let i = 0; i < 2; i++) {
      const pillarGeometry = new THREE.CylinderGeometry(width * 0.08, width * 0.08, height * 0.4, 8)
      const pillarMaterial = new THREE.MeshStandardMaterial({
        color: 0xc9b8a8,
        roughness: 0.6,
      })
      const pillar = new THREE.Mesh(pillarGeometry, pillarMaterial)
      pillar.position.set(i === 0 ? -width * 0.2 : width * 0.2, height * 0.2, depth / 2 + 0.15)
      pillar.castShadow = true
      houseGroup.add(pillar)
    }

    this.scene.add(houseGroup)
  }

  private createStoreBuilding(x: number, z: number, width: number, height: number, depth: number) {
    const storeGroup = new THREE.Group()
    storeGroup.position.set(x, 0, z)

    // Main building body
    const storeGeometry = new THREE.BoxGeometry(width, height, depth)
    const storeMaterial = new THREE.MeshStandardMaterial({
      color: 0x6a4a2a,
      roughness: 0.8,
      metalness: 0.05,
    })
    const storeBody = new THREE.Mesh(storeGeometry, storeMaterial)
    storeBody.position.y = height / 2
    storeBody.castShadow = true
    storeBody.receiveShadow = true
    storeGroup.add(storeBody)

    // Flat roof
    const roofGeometry = new THREE.BoxGeometry(width, height * 0.15, depth)
    const roofMaterial = new THREE.MeshStandardMaterial({
      color: 0x2a1a0a,
      roughness: 0.9,
    })
    const roof = new THREE.Mesh(roofGeometry, roofMaterial)
    roof.position.y = height + height * 0.075
    roof.castShadow = true
    storeGroup.add(roof)

    // Large storefront windows
    for (let i = 0; i < 3; i++) {
      const windowGeometry = new THREE.BoxGeometry(width * 0.28, height * 0.5, 0.1)
      const windowMaterial = new THREE.MeshStandardMaterial({
        color: 0x1a2a4a,
        metalness: 0.2,
        transparent: true,
        opacity: 0.35,
      })
      const window = new THREE.Mesh(windowGeometry, windowMaterial)
      window.position.set(-width * 0.35 + i * width * 0.35, height * 0.4, depth / 2 + 0.05)
      storeGroup.add(window)
    }

    // Storefront door
    const storeDoorGeometry = new THREE.BoxGeometry(width * 0.3, height * 0.8, 0.15)
    const storeDoorMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      roughness: 0.5,
    })
    const storeDoor = new THREE.Mesh(storeDoorGeometry, storeDoorMaterial)
    storeDoor.position.set(0, height * 0.35, depth / 2 + 0.1)
    storeGroup.add(storeDoor)

    // Storefront sign area
    const signBackGeometry = new THREE.BoxGeometry(width * 0.8, height * 0.25, 0.2)
    const signBackMaterial = new THREE.MeshStandardMaterial({
      color: 0x3a2a1a,
      roughness: 0.7,
    })
    const signBack = new THREE.Mesh(signBackGeometry, signBackMaterial)
    signBack.position.set(0, height + height * 0.15, depth / 2 + 0.15)
    storeGroup.add(signBack)

    this.scene.add(storeGroup)
  }

  public handleScroll(deltaY: number) {
    const scrollSpeed = 0.5
    this.camera.position.z -= deltaY * scrollSpeed
  }

  public setScrollProgress(progress: number) {
    this.scrollProgress = progress
    this.updateCameraPosition()
    this.updateObjectPositions()
  }

  private updateCameraPosition() {
    const baseZ = 25
    const maxZ = -400
    this.camera.position.z = baseZ + this.scrollProgress * (maxZ - baseZ)
    this.camera.position.y = 6 + Math.sin(this.scrollProgress * Math.PI) * 8
    this.camera.position.x = Math.sin(this.scrollProgress * Math.PI * 0.5) * 8
  }

  private updateObjectPositions() {
    this.bikes.forEach((bike, index) => {
      bike.position.z = -40 + index * 35 - this.scrollProgress * 250
    })

    this.cars.forEach((car) => {
      car.rotation.y += 0.003
      car.position.z -= 0.5
    })

    if (this.upSideDownPortal) {
      this.upSideDownPortal.rotation.x += 0.015
      this.upSideDownPortal.rotation.z += 0.01
      this.upSideDownPortal.position.z = -250 - this.scrollProgress * 150
    }

    if (this.particles) {
      this.particles.rotation.x += 0.0008
      this.particles.rotation.y += 0.0008
    }

    this.telekinesisSpheres.forEach((sphere, i) => {
      sphere.position.y += Math.sin(this.time * 0.005 + i) * 0.1
      sphere.rotation.x += 0.01
      sphere.rotation.y += 0.01
    })
  }

  public animate() {
    this.time++

    this.bikes.forEach((bike) => {
      bike.rotation.y += 0.003
    })

    this.cars.forEach((car) => {
      car.rotation.y += 0.001
    })

    this.renderer.render(this.scene, this.camera)
  }

  public handleResize() {
    const width = window.innerWidth
    const height = window.innerHeight
    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(width, height)
  }

  public dispose() {
    this.renderer.dispose()
    this.container.removeChild(this.renderer.domElement)
  }
}
