"use client"

import { useEffect, useRef } from "react"
import ScrollIndicator from "@/components/scroll-indicator"
import AuthorCredit from "@/components/author-credit"

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const loadScript = () => {
      return new Promise((resolve, reject) => {
        const script = document.createElement("script")
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"
        script.async = true

        script.onload = () => {
          let attempts = 0
          const waitForTHREE = () => {
            if ((window as any).THREE) {
              resolve((window as any).THREE)
            } else if (attempts < 50) {
              attempts++
              requestAnimationFrame(waitForTHREE)
            } else {
              reject(new Error("THREE.js failed to load"))
            }
          }
          waitForTHREE()
        }

        script.onerror = () => {
          reject(new Error("Failed to load Three.js script"))
        }

        document.head.appendChild(script)
      })
    }

    loadScript()
      .then((THREE) => {
        initScene(THREE)
      })
      .catch((error) => {
        console.error("[v0] Three.js loading failed:", error)
      })

    const initScene = (THREE: any) => {
      if (!containerRef.current) return

      const scene = new THREE.Scene()
      scene.background = new THREE.Color(0x0a0a0a)
      scene.fog = new THREE.FogExp2(0x1a0a1a, 0.003)

      const skyGeometry = new THREE.SphereGeometry(500, 32, 32)
      const skyMaterial = new THREE.ShaderMaterial({
        uniforms: {
          topColor: { value: new THREE.Color(0x2a0a1a) },
          bottomColor: { value: new THREE.Color(0x550011) },
          offset: { value: 50 },
          exponent: { value: 0.6 },
        },
        vertexShader: `
          varying vec3 vWorldPosition;
          void main() {
            vec4 worldPosition = modelMatrix * vec4(position, 1.0);
            vWorldPosition = worldPosition.xyz;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform vec3 topColor;
          uniform vec3 bottomColor;
          uniform float offset;
          uniform float exponent;
          varying vec3 vWorldPosition;
          void main() {
            float h = normalize(vWorldPosition + offset).y;
            gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
          }
        `,
        side: THREE.BackSide,
      })
      const sky = new THREE.Mesh(skyGeometry, skyMaterial)
      scene.add(sky)

      const ambientLight = new THREE.AmbientLight(0x660033, 0.5)
      scene.add(ambientLight)

      const directionalLight = new THREE.DirectionalLight(0xff0033, 1.2)
      directionalLight.position.set(100, 150, 50)
      directionalLight.castShadow = true
      directionalLight.shadow.mapSize.width = 4096
      directionalLight.shadow.mapSize.height = 4096
      directionalLight.shadow.camera.far = 1000
      scene.add(directionalLight)

      const redLight = new THREE.PointLight(0xff0033, 3.5, 600)
      redLight.position.set(-80, 80, -300)
      scene.add(redLight)

      const darkRedLight = new THREE.PointLight(0xcc0022, 2.5, 500)
      darkRedLight.position.set(80, 120, -400)
      scene.add(darkRedLight)

      const width = window.innerWidth
      const height = window.innerHeight
      const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 2000)
      camera.position.set(0, 10, 50)
      camera.lookAt(0, 8, -200)

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
      renderer.setSize(width, height)
      renderer.setPixelRatio(window.devicePixelRatio)
      renderer.shadowMap.enabled = true
      renderer.toneMapping = THREE.ACESFilmicToneMapping
      renderer.toneMappingExposure = 1.5
      containerRef.current!.appendChild(renderer.domElement)

      // Road
      const roadGeometry = new THREE.PlaneGeometry(30, 800)
      const roadMaterial = new THREE.MeshStandardMaterial({
        color: 0x1a1a1a,
        roughness: 0.8,
      })
      const road = new THREE.Mesh(roadGeometry, roadMaterial)
      road.rotation.x = -Math.PI / 2
      road.receiveShadow = true
      road.position.z = -200
      scene.add(road)

      // Road line markings
      for (let i = 0; i < 80; i++) {
        const lineGeometry = new THREE.PlaneGeometry(0.8, 6)
        const lineMaterial = new THREE.MeshStandardMaterial({
          color: 0xffff00,
          emissive: 0xffff00,
          emissiveIntensity: 0.8,
        })
        const line = new THREE.Mesh(lineGeometry, lineMaterial)
        line.rotation.x = -Math.PI / 2
        line.position.set(0, 0.01, -20 - i * 10)
        scene.add(line)
      }

      const createCar = () => {
        const carGroup = new THREE.Group()

        const bodyGeometry = new THREE.BoxGeometry(2.2, 1.3, 5)
        const bodyMaterial = new THREE.MeshStandardMaterial({
          color: 0xcc2222,
          metalness: 0.8,
          roughness: 0.2,
        })
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial)
        body.position.y = 0.7
        body.castShadow = true
        body.receiveShadow = true
        carGroup.add(body)

        const cabinGeometry = new THREE.BoxGeometry(2, 1.1, 2.4)
        const cabinMaterial = new THREE.MeshStandardMaterial({
          color: 0x0a1a3a,
          metalness: 0.2,
          transparent: true,
          opacity: 0.55,
        })
        const cabin = new THREE.Mesh(cabinGeometry, cabinMaterial)
        cabin.position.set(0, 1.5, -0.8)
        cabin.castShadow = true
        carGroup.add(cabin)

        const windshieldGeometry = new THREE.PlaneGeometry(1.9, 0.9)
        const windshieldMaterial = new THREE.MeshStandardMaterial({
          color: 0x1a3a7a,
          transparent: true,
          opacity: 0.5,
        })
        const windshield = new THREE.Mesh(windshieldGeometry, windshieldMaterial)
        windshield.position.set(0, 1.65, -0.1)
        windshield.rotation.x = 0.35
        carGroup.add(windshield)

        for (let i = 0; i < 4; i++) {
          const wheelGeometry = new THREE.CylinderGeometry(0.6, 0.6, 0.5, 20)
          const wheelMaterial = new THREE.MeshStandardMaterial({
            color: 0x0a0a0a,
            metalness: 0.95,
            roughness: 0.05,
          })
          const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial)
          wheel.rotation.z = Math.PI / 2
          wheel.position.set(i < 2 ? -1.2 : 1.2, 0.6, i % 2 === 0 ? -1.5 : 1.5)
          wheel.castShadow = true
          carGroup.add(wheel)

          const hubGeometry = new THREE.CylinderGeometry(0.5, 0.5, 0.25, 20)
          const hubMaterial = new THREE.MeshStandardMaterial({
            color: 0x555555,
            metalness: 0.95,
            roughness: 0.1,
          })
          const hub = new THREE.Mesh(hubGeometry, hubMaterial)
          hub.rotation.z = Math.PI / 2
          hub.position.set(i < 2 ? -1.2 : 1.2, 0.6, i % 2 === 0 ? -1.5 : 1.5)
          carGroup.add(hub)
        }

        const headlightGeometry = new THREE.SphereGeometry(0.3, 12, 12)
        const headlightMaterial = new THREE.MeshStandardMaterial({
          color: 0xffff99,
          emissive: 0xffff99,
          emissiveIntensity: 1.8,
        })
        for (let i = 0; i < 2; i++) {
          const headlight = new THREE.Mesh(headlightGeometry, headlightMaterial)
          headlight.position.set(i === 0 ? -0.7 : 0.7, 0.9, 2.3)
          carGroup.add(headlight)
        }

        const roofGeometry = new THREE.BoxGeometry(2, 0.1, 2.4)
        const roofMaterial = new THREE.MeshStandardMaterial({
          color: 0x992222,
          metalness: 0.6,
          roughness: 0.3,
        })
        const roof = new THREE.Mesh(roofGeometry, roofMaterial)
        roof.position.set(0, 1.85, -0.6)
        carGroup.add(roof)

        return carGroup
      }

      const carPositions = [
        { x: -10, z: -80 },
        { x: 10, z: -40 },
        { x: -8, z: 40 },
        { x: 9, z: 120 },
      ]

      carPositions.forEach((pos) => {
        const car = createCar()
        car.position.set(pos.x, 0, pos.z)
        scene.add(car)
      })

      const createVecna = () => {
        const vecnaGroup = new THREE.Group()
        vecnaGroup.position.set(0, 0, -450)

        // Skeletal head with elongated shape
        const headGeometry = new THREE.SphereGeometry(1.8, 32, 32)
        const headMaterial = new THREE.MeshStandardMaterial({
          color: 0x1a0a1a,
          emissive: 0x660033,
          emissiveIntensity: 1.8,
          metalness: 0.2,
          roughness: 0.8,
        })
        const head = new THREE.Mesh(headGeometry, headMaterial)
        head.scale.set(1.2, 1.6, 1.1)
        head.position.y = 8
        head.castShadow = true
        vecnaGroup.add(head)

        // Sunken eye sockets with glowing red eyes
        for (let i = 0; i < 2; i++) {
          const eyeSocketGeometry = new THREE.SphereGeometry(0.5, 16, 16)
          const eyeSocketMaterial = new THREE.MeshStandardMaterial({
            color: 0x0a0a0a,
            emissive: 0x330011,
            emissiveIntensity: 0.8,
          })
          const eyeSocket = new THREE.Mesh(eyeSocketGeometry, eyeSocketMaterial)
          eyeSocket.position.set(i === 0 ? -0.8 : 0.8, 8.8, 1.5)
          vecnaGroup.add(eyeSocket)

          // Intense glowing red eye
          const eyeGeometry = new THREE.SphereGeometry(0.6, 16, 16)
          const eyeMaterial = new THREE.MeshStandardMaterial({
            color: 0xff0000,
            emissive: 0xff3333,
            emissiveIntensity: 3.2,
            metalness: 0.5,
          })
          const eye = new THREE.Mesh(eyeGeometry, eyeMaterial)
          eye.position.set(i === 0 ? -0.8 : 0.8, 8.8, 1.6)
          vecnaGroup.add(eye)

          const eyeLight = new THREE.PointLight(0xff0033, 4, 80)
          eyeLight.position.set(i === 0 ? -0.8 : 0.8, 8.8, 1.6)
          vecnaGroup.add(eyeLight)
        }

        // Skeletal jaw and teeth
        const jawGeometry = new THREE.BoxGeometry(1.8, 0.8, 1.2)
        const jawMaterial = new THREE.MeshStandardMaterial({
          color: 0x0a0a0a,
          emissive: 0x440011,
          emissiveIntensity: 1.2,
        })
        const jaw = new THREE.Mesh(jawGeometry, jawMaterial)
        jaw.position.set(0, 6.5, 1.8)
        vecnaGroup.add(jaw)

        // Sharp teeth
        for (let i = 0; i < 16; i++) {
          const toothGeometry = new THREE.ConeGeometry(0.15, 0.6, 8)
          const toothMaterial = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            emissive: 0xcccccc,
            emissiveIntensity: 0.8,
            metalness: 0.7,
          })
          const tooth = new THREE.Mesh(toothGeometry, toothMaterial)
          const xPos = (i - 7.5) * 0.22
          tooth.position.set(xPos, 6.8, 2.2)
          tooth.rotation.z = (Math.random() - 0.5) * 0.3
          vecnaGroup.add(tooth)
        }

        // Elongated skeletal body
        const spineGeometry = new THREE.CylinderGeometry(0.8, 1.2, 6, 12)
        const spineMaterial = new THREE.MeshStandardMaterial({
          color: 0x0a0a0a,
          emissive: 0x330044,
          emissiveIntensity: 1.2,
          metalness: 0.3,
          roughness: 0.8,
        })
        const spine = new THREE.Mesh(spineGeometry, spineMaterial)
        spine.position.set(0, 2, 0)
        spine.castShadow = true
        vecnaGroup.add(spine)

        // Ribcage
        for (let i = 0; i < 8; i++) {
          const ribGeometry = new THREE.TorusGeometry(1.1, 0.15, 8, 20)
          const ribMaterial = new THREE.MeshStandardMaterial({
            color: 0x1a1a1a,
            emissive: 0x440022,
            emissiveIntensity: 0.9,
            metalness: 0.4,
          })
          const rib = new THREE.Mesh(ribGeometry, ribMaterial)
          rib.rotation.x = Math.PI / 2.5
          rib.position.y = 4 - i * 0.7
          vecnaGroup.add(rib)
        }

        for (let handIdx = 0; handIdx < 2; handIdx++) {
          const handX = handIdx === 0 ? -1.5 : 1.5

          for (let fingerIdx = 0; fingerIdx < 4; fingerIdx++) {
            const fingerGroup = new THREE.Group()
            fingerGroup.position.set(handX, 4 - fingerIdx * 0.3, 0)

            // Long finger bone segments
            for (let segIdx = 0; segIdx < 5; segIdx++) {
              const boneGeometry = new THREE.CylinderGeometry(0.15, 0.15, 1, 8)
              const boneMaterial = new THREE.MeshStandardMaterial({
                color: 0x2a1a2a,
                emissive: 0x660044,
                emissiveIntensity: 0.6 + segIdx * 0.1,
                metalness: 0.3,
              })
              const bone = new THREE.Mesh(boneGeometry, boneMaterial)
              bone.position.y = segIdx * 0.95
              bone.castShadow = true
              fingerGroup.add(bone)
            }

            // Sharp nail at fingertip
            const nailGeometry = new THREE.ConeGeometry(0.12, 0.5, 8)
            const nailMaterial = new THREE.MeshStandardMaterial({
              color: 0x000000,
              emissive: 0x440000,
              emissiveIntensity: 1.2,
              metalness: 0.8,
            })
            const nail = new THREE.Mesh(nailGeometry, nailMaterial)
            nail.position.y = 4.8
            fingerGroup.add(nail)

            vecnaGroup.add(fingerGroup)
          }
        }

        return vecnaGroup
      }

      const vecna = createVecna()
      vecna.scale.set(2.2, 2.4, 2)
      vecna.position.set(0, -2, -380)
      scene.add(vecna)

      const createBuilding = (x: number, z: number, width: number, height: number, depth: number) => {
        const buildingGroup = new THREE.Group()

        const wallMaterial = new THREE.MeshStandardMaterial({
          color: 0xa0803a,
          roughness: 0.85,
          metalness: 0.05,
        })

        const wallGeometry = new THREE.BoxGeometry(width, height, depth)
        const walls = new THREE.Mesh(wallGeometry, wallMaterial)
        walls.position.y = height / 2
        walls.castShadow = true
        walls.receiveShadow = true
        buildingGroup.add(walls)

        const roofGeometry = new THREE.ConeGeometry(Math.max(width, depth) / 1.8, height * 0.45, 4)
        const roofMaterial = new THREE.MeshStandardMaterial({
          color: 0x5a4a2a,
          roughness: 0.9,
        })
        const roof = new THREE.Mesh(roofGeometry, roofMaterial)
        roof.position.y = height + height * 0.25
        buildingGroup.add(roof)

        for (let i = 0; i < 4; i++) {
          const windowGeometry = new THREE.BoxGeometry(width * 0.18, height * 0.18, 0.08)
          const windowMaterial = new THREE.MeshStandardMaterial({
            color: 0x1a3a5a,
            emissive: 0xffff88,
            emissiveIntensity: 0.6,
          })
          const window = new THREE.Mesh(windowGeometry, windowMaterial)
          window.position.set(width * -0.35 + i * width * 0.25, height * 0.55, depth / 2 + 0.05)
          buildingGroup.add(window)
        }

        buildingGroup.position.set(x, 0, z)
        return buildingGroup
      }

      scene.add(createBuilding(-18, -100, 5, 4.5, 6))
      scene.add(createBuilding(18, -60, 4.5, 4, 5.5))
      scene.add(createBuilding(-16, -20, 6, 5, 7))
      scene.add(createBuilding(16, 40, 5, 4.3, 6))
      scene.add(createBuilding(-20, 100, 5.5, 4.8, 6.5))
      scene.add(createBuilding(19, 160, 4.8, 4.2, 6))
      scene.add(createBuilding(-22, -140, 4.8, 4.6, 5.8))
      scene.add(createBuilding(20, -80, 5.2, 4.4, 6.2))
      scene.add(createBuilding(-24, 0, 5.5, 4.9, 6.5))
      scene.add(createBuilding(22, 80, 4.9, 4.5, 6.1))
      scene.add(createBuilding(-19, 200, 5.3, 4.7, 6.3))
      scene.add(createBuilding(21, 240, 5.1, 4.3, 6.2))

      const particlesGeometry = new THREE.BufferGeometry()
      const particlesCnt = 1500
      const posArray = new Float32Array(particlesCnt * 3)
      const colorArray = new Float32Array(particlesCnt * 3)

      for (let i = 0; i < particlesCnt; i++) {
        posArray[i * 3] = (Math.random() - 0.5) * 300
        posArray[i * 3 + 1] = Math.random() * 150 + 20
        posArray[i * 3 + 2] = (Math.random() - 0.5) * 600 - 100

        const isRed = Math.random() > 0.3
        colorArray[i * 3] = isRed ? 1 : 0.1
        colorArray[i * 3 + 1] = isRed ? 0.1 : 0.2
        colorArray[i * 3 + 2] = isRed ? 0.1 : 0.3
      }

      particlesGeometry.setAttribute("position", new THREE.BufferAttribute(posArray, 3))
      particlesGeometry.setAttribute("color", new THREE.BufferAttribute(colorArray, 3))

      const particlesMaterial = new THREE.PointsMaterial({
        size: 0.8,
        sizeAttenuation: true,
        vertexColors: true,
        transparent: true,
        opacity: 0.4,
      })

      const particles = new THREE.Points(particlesGeometry, particlesMaterial)
      scene.add(particles)

      const createMax = () => {
        const maxGroup = new THREE.Group()

        // Head
        const headGeometry = new THREE.SphereGeometry(0.35, 16, 16)
        const skinMaterial = new THREE.MeshStandardMaterial({
          color: 0xd4a574,
          metalness: 0.0,
          roughness: 0.8,
        })
        const head = new THREE.Mesh(headGeometry, skinMaterial)
        head.position.y = 1.55
        head.castShadow = true
        maxGroup.add(head)

        // Hair - red/orange
        const hairGeometry = new THREE.SphereGeometry(0.38, 16, 16)
        const hairMaterial = new THREE.MeshStandardMaterial({
          color: 0xc84a2a,
          metalness: 0.0,
          roughness: 0.9,
        })
        const hair = new THREE.Mesh(hairGeometry, hairMaterial)
        hair.position.y = 1.65
        hair.scale.set(1, 1.2, 1)
        maxGroup.add(hair)

        // Body
        const bodyGeometry = new THREE.BoxGeometry(0.35, 0.65, 0.25)
        const bodyMaterial = new THREE.MeshStandardMaterial({
          color: 0x1a4a8a,
          metalness: 0.0,
          roughness: 0.85,
        })
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial)
        body.position.y = 1
        body.castShadow = true
        maxGroup.add(body)

        // Arms
        for (let i = 0; i < 2; i++) {
          const armGeometry = new THREE.BoxGeometry(0.15, 0.6, 0.15)
          const arm = new THREE.Mesh(armGeometry, bodyMaterial)
          arm.position.set(i === 0 ? -0.25 : 0.25, 1.2, 0)
          arm.castShadow = true
          maxGroup.add(arm)
        }

        // Legs
        for (let i = 0; i < 2; i++) {
          const legGeometry = new THREE.BoxGeometry(0.15, 0.75, 0.15)
          const legMaterial = new THREE.MeshStandardMaterial({
            color: 0x1a1a1a,
            metalness: 0.0,
            roughness: 0.9,
          })
          const leg = new THREE.Mesh(legGeometry, legMaterial)
          leg.position.set(i === 0 ? -0.12 : 0.12, 0.35, 0)
          leg.castShadow = true
          maxGroup.add(leg)
        }

        // Headphones - black band across head
        const headbandGeometry = new THREE.TorusGeometry(0.42, 0.05, 8, 16)
        const headbandMaterial = new THREE.MeshStandardMaterial({
          color: 0x0a0a0a,
          metalness: 0.3,
          roughness: 0.7,
        })
        const headband = new THREE.Mesh(headbandGeometry, headbandMaterial)
        headband.rotation.z = Math.PI / 2
        headband.position.set(0, 1.75, 0)
        headband.castShadow = true
        maxGroup.add(headband)

        // Headphone ear cups
        for (let i = 0; i < 2; i++) {
          const earCupGeometry = new THREE.SphereGeometry(0.12, 12, 12)
          const earCupMaterial = new THREE.MeshStandardMaterial({
            color: 0x1a1a1a,
            metalness: 0.5,
            roughness: 0.6,
          })
          const earCup = new THREE.Mesh(earCupGeometry, earCupMaterial)
          earCup.position.set(i === 0 ? -0.48 : 0.48, 1.72, 0.1)
          earCup.castShadow = true
          maxGroup.add(earCup)
        }

        // Headphone cable to MP3 player
        const cableGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.8, 6)
        const cableMaterial = new THREE.MeshStandardMaterial({
          color: 0x333333,
          metalness: 0.1,
          roughness: 0.8,
        })
        const cable = new THREE.Mesh(cableGeometry, cableMaterial)
        cable.position.set(-0.18, 0.8, 0)
        cable.castShadow = true
        maxGroup.add(cable)

        // Old MP3 player (Walkman-style) at waist
        const playerGeometry = new THREE.BoxGeometry(0.25, 0.18, 0.08)
        const playerMaterial = new THREE.MeshStandardMaterial({
          color: 0x4a4a4a,
          metalness: 0.4,
          roughness: 0.6,
        })
        const player = new THREE.Mesh(playerGeometry, playerMaterial)
        player.position.set(-0.18, 0.4, 0.15)
        player.castShadow = true
        maxGroup.add(player)

        // MP3 player screen
        const screenGeometry = new THREE.BoxGeometry(0.15, 0.08, 0.01)
        const screenMaterial = new THREE.MeshStandardMaterial({
          color: 0x0a0a0a,
          emissive: 0x008800,
          emissiveIntensity: 0.5,
        })
        const screen = new THREE.Mesh(screenGeometry, screenMaterial)
        screen.position.set(-0.18, 0.48, 0.17)
        maxGroup.add(screen)

        // MP3 player buttons
        for (let i = 0; i < 3; i++) {
          const buttonGeometry = new THREE.CylinderGeometry(0.025, 0.025, 0.01, 8)
          const buttonMaterial = new THREE.MeshStandardMaterial({
            color: 0x2a2a2a,
            metalness: 0.6,
            roughness: 0.5,
          })
          const button = new THREE.Mesh(buttonGeometry, buttonMaterial)
          button.position.set(-0.18 - 0.08 + i * 0.04, 0.32, 0.15)
          maxGroup.add(button)
        }

        return maxGroup
      }

      const max = createMax()
      max.position.set(0, 0, 20)
      scene.add(max)

      let scrollProgress = 0

      const animate = () => {
        // Vecna pursues Max - menacing movement
        const distanceToMax = Math.abs(vecna.position.z - max.position.z)
        const isAttacking = distanceToMax < 15

        if (isAttacking) {
          vecna.rotation.y += 0.015
          vecna.rotation.x = Math.sin(Date.now() * 0.002) * 0.6
          vecna.position.y = -2 + Math.sin(Date.now() * 0.002) * 3

          // Vecna lunges towards Max
          const lunge = Math.sin(Date.now() * 0.004) * 8
          vecna.position.z = Math.max(
            max.position.z - 8,
            vecna.position.z + (max.position.z - vecna.position.z) * 0.08 + lunge,
          )
        } else {
          // Normal pursuit
          vecna.rotation.y += 0.003
          vecna.rotation.x = Math.sin(Date.now() * 0.0004) * 0.3
          vecna.position.y = -2 + Math.sin(Date.now() * 0.0003) * 2
          vecna.position.z += (max.position.z - vecna.position.z - 50) * 0.008
        }

        // Max runs forward as you scroll
        const runDistance = scrollProgress * 400
        max.position.z = 20 - runDistance

        // Max's running animation
        const runCycle = (scrollProgress * 20) % (Math.PI * 2)
        max.children[3].rotation.x = Math.sin(runCycle) * 0.4
        max.children[4].rotation.x = -Math.sin(runCycle) * 0.4
        max.children[5].rotation.x = -Math.sin(runCycle) * 0.5
        max.children[6].rotation.x = Math.sin(runCycle) * 0.5

        let targetZ = max.position.z + 35
        let targetY = 1.2
        let targetX = Math.sin(scrollProgress * Math.PI * 0.2) * 3

        if (isAttacking) {
          targetZ = max.position.z + 15
          targetY = 8 + Math.sin(Date.now() * 0.001) * 2
          targetX = Math.sin(Date.now() * 0.0008) * 5
        }

        camera.position.x += (targetX - camera.position.x) * 0.12
        camera.position.y += (targetY - camera.position.y) * 0.12
        camera.position.z += (targetZ - camera.position.z) * 0.12

        if (isAttacking) {
          camera.lookAt(max.position.x, max.position.y + 1, max.position.z)
        } else {
          camera.lookAt(max.position.x, max.position.y + 0.5, max.position.z - 50)
        }

        renderer.render(scene, camera)
        requestAnimationFrame(animate)
      }
      animate()

      const handleWheel = (e: WheelEvent) => {
        e.preventDefault()
        scrollProgress = Math.max(0, Math.min(1, scrollProgress + e.deltaY * 0.0003))
      }

      const handleResize = () => {
        const width = window.innerWidth
        const height = window.innerHeight
        camera.aspect = width / height
        camera.updateProjectionMatrix()
        renderer.setSize(width, height)
      }

      containerRef.current!.addEventListener("wheel", handleWheel, { passive: false })
      window.addEventListener("resize", handleResize)

      return () => {
        containerRef.current?.removeEventListener("wheel", handleWheel)
        window.removeEventListener("resize", handleResize)
        renderer.dispose()
        if (containerRef.current?.contains(renderer.domElement)) {
          containerRef.current.removeChild(renderer.domElement)
        }
      }
    }
  }, [])

  return (
    <main ref={containerRef} className="w-full h-screen overflow-hidden bg-background">
      <ScrollIndicator />
      <AuthorCredit />
    </main>
  )
}
