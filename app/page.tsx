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
      scene.background = new THREE.Color(0x0a0a1a)
      scene.fog = new THREE.FogExp2(0x1a0a2a, 0.008)

      const skyGeometry = new THREE.SphereGeometry(400, 32, 32)
      const skyMaterial = new THREE.ShaderMaterial({
        uniforms: {
          topColor: { value: new THREE.Color(0x551133) },
          bottomColor: { value: new THREE.Color(0xff6b35) },
          offset: { value: 33 },
          exponent: { value: 0.6 },
        },
        vertexShader: `
          varying vec3 vWorldPosition;
          void main() {
            vec4 worldPosition = modelMatrix * vec4( position, 1.0 );
            vWorldPosition = worldPosition.xyz;
            gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
          }
        `,
        fragmentShader: `
          uniform vec3 topColor;
          uniform vec3 bottomColor;
          uniform float offset;
          uniform float exponent;
          varying vec3 vWorldPosition;
          void main() {
            float h = normalize( vWorldPosition + offset ).y;
            gl_FragColor = vec4( mix( bottomColor, topColor, max( pow( max( h , 0.0), exponent ), 0.0 ) ), 1.0 );
          }
        `,
        side: THREE.BackSide,
      })
      const sky = new THREE.Mesh(skyGeometry, skyMaterial)
      scene.add(sky)

      const particlesGeometry = new THREE.BufferGeometry()
      const particlesCnt = 800
      const posArray = new Float32Array(particlesCnt * 3)
      const colorArray = new Float32Array(particlesCnt * 3)

      for (let i = 0; i < particlesCnt * 3; i += 3) {
        posArray[i] = (Math.random() - 0.5) * 400
        posArray[i + 1] = Math.random() * 200 + 50
        posArray[i + 2] = (Math.random() - 0.5) * 400

        const useRed = Math.random() > 0.5
        colorArray[i] = useRed ? 1 : 0.1
        colorArray[i + 1] = useRed ? 0.3 : 0.5
        colorArray[i + 2] = useRed ? 0.2 : 1
      }

      particlesGeometry.setAttribute("position", new THREE.BufferAttribute(posArray, 3))
      particlesGeometry.setAttribute("color", new THREE.BufferAttribute(colorArray, 3))

      const particlesMaterial = new THREE.PointsMaterial({
        size: 2,
        sizeAttenuation: true,
        vertexColors: true,
        transparent: true,
        opacity: 0.4,
      })

      const particles = new THREE.Points(particlesGeometry, particlesMaterial)
      scene.add(particles)

      const width = window.innerWidth
      const height = window.innerHeight
      const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000)
      camera.position.set(0, 6, 25)

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
      renderer.setSize(width, height)
      renderer.setPixelRatio(window.devicePixelRatio)
      renderer.shadowMap.enabled = true
      renderer.toneMapping = THREE.ACESFilmicToneMapping
      renderer.toneMappingExposure = 1.2
      containerRef.current!.appendChild(renderer.domElement)

      const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
      scene.add(ambientLight)

      const directionalLight = new THREE.DirectionalLight(0xff6b35, 2)
      directionalLight.position.set(20, 30, 10)
      directionalLight.castShadow = true
      scene.add(directionalLight)

      const redLight = new THREE.PointLight(0xff3333, 3, 200)
      redLight.position.set(-30, 15, -100)
      scene.add(redLight)

      const blueLight = new THREE.PointLight(0x1e90ff, 2.5, 200)
      blueLight.position.set(30, 15, -150)
      scene.add(blueLight)

      const roadGeometry = new THREE.PlaneGeometry(20, 500)
      const roadMaterial = new THREE.MeshStandardMaterial({
        color: 0x1a1a1a,
        roughness: 0.8,
      })
      const road = new THREE.Mesh(roadGeometry, roadMaterial)
      road.receiveShadow = true
      scene.add(road)

      for (let i = 0; i < 25; i++) {
        const lineGeometry = new THREE.PlaneGeometry(0.5, 3)
        const lineMaterial = new THREE.MeshStandardMaterial({ color: 0xffff00 })
        const line = new THREE.Mesh(lineGeometry, lineMaterial)
        line.position.z = -i * 10
        line.position.y = 0.01
        scene.add(line)
      }

      const cars: any[] = []
      const carPositions = [
        { x: -8, z: -50, rotation: 0 },
        { x: 8, z: -15, rotation: 0.1 },
        { x: -6, z: 20, rotation: -0.1 },
        { x: 7, z: -100, rotation: 0.05 },
      ]

      const createCar = () => {
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
        carGroup.add(body)

        const cabinGeometry = new THREE.BoxGeometry(1.8, 1, 2.2)
        const cabinMaterial = new THREE.MeshStandardMaterial({
          color: 0x0f1f4a,
          metalness: 0.3,
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
          transparent: true,
          opacity: 0.5,
        })
        const windshield = new THREE.Mesh(windshieldGeometry, windshieldMaterial)
        windshield.position.set(0, 1.6, -0.2)
        windshield.rotation.x = 0.3
        carGroup.add(windshield)

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
        })
        const bumper = new THREE.Mesh(bumperGeometry, bumperMaterial)
        bumper.position.set(0, 0.4, 2.15)
        carGroup.add(bumper)

        const roofGeometry = new THREE.BoxGeometry(1.8, 0.08, 2.2)
        const roofMaterial = new THREE.MeshStandardMaterial({
          color: 0x8a0a0a,
          metalness: 0.5,
        })
        const roof = new THREE.Mesh(roofGeometry, roofMaterial)
        roof.position.set(0, 1.75, -0.5)
        carGroup.add(roof)

        return carGroup
      }

      carPositions.forEach((pos) => {
        const car = createCar()
        car.position.set(pos.x, 0, pos.z)
        car.rotation.y = pos.rotation
        cars.push(car)
        scene.add(car)
      })

      const createDemogorgon = () => {
        const demoGroup = new THREE.Group()
        demoGroup.position.set(0, 0, -250)

        const headGeometry = new THREE.SphereGeometry(1.5, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.6)
        const headMaterial = new THREE.MeshStandardMaterial({
          color: 0x2a1a2a,
          emissive: 0x551133,
          emissiveIntensity: 0.8,
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
          emissiveIntensity: 1.2,
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
            emissive: 0x888888,
            emissiveIntensity: 0.6,
          })
          const fang = new THREE.Mesh(fangGeometry, fangMaterial)
          const angle = (i / 12) * Math.PI * 2
          fang.position.set(Math.cos(angle) * 1, 2.5, Math.sin(angle) * 0.8 + 1.3)
          fang.rotation.x = 0.3
          demoGroup.add(fang)
        }

        for (let i = 0; i < 2; i++) {
          const eyeGeometry = new THREE.SphereGeometry(0.5, 8, 8)
          const eyeMaterial = new THREE.MeshStandardMaterial({
            color: 0xff1111,
            emissive: 0xff3333,
            emissiveIntensity: 2,
          })
          const eye = new THREE.Mesh(eyeGeometry, eyeMaterial)
          eye.position.set(i === 0 ? -0.7 : 0.7, 3.8, 1.5)
          demoGroup.add(eye)
        }

        const bodyGeometry = new THREE.ConeGeometry(0.8, 4, 12)
        const bodyMaterial = new THREE.MeshStandardMaterial({
          color: 0x1a0a2a,
          emissive: 0x330a55,
          emissiveIntensity: 0.6,
        })
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial)
        body.position.y = 0.5
        body.castShadow = true
        demoGroup.add(body)

        for (let i = 0; i < 6; i++) {
          const tentacleGroup = new THREE.Group()
          const angle = (i / 6) * Math.PI * 2
          tentacleGroup.position.set(Math.cos(angle) * 1.5, 1, Math.sin(angle) * 1.5)

          for (let j = 0; j < 5; j++) {
            const segmentGeometry = new THREE.SphereGeometry(0.3 - j * 0.05, 8, 8)
            const segmentMaterial = new THREE.MeshStandardMaterial({
              color: 0x2a1a3a,
              emissive: 0x551155,
              emissiveIntensity: 0.5,
            })
            const segment = new THREE.Mesh(segmentGeometry, segmentMaterial)
            segment.position.y = j * 0.7
            segment.castShadow = true
            tentacleGroup.add(segment)
          }

          demoGroup.add(tentacleGroup)
        }

        return demoGroup
      }

      const demogorgon = createDemogorgon()
      scene.add(demogorgon)

      const createBuilding = (x: number, z: number, width: number, depth: number, height: number, isHouse: boolean) => {
        const buildingGroup = new THREE.Group()

        const wallMaterial = new THREE.MeshStandardMaterial({
          color: isHouse ? 0x8b6914 : 0x9b7a4a,
          roughness: 0.8,
        })

        const wallGeometry = new THREE.BoxGeometry(width, height, depth)
        const walls = new THREE.Mesh(wallGeometry, wallMaterial)
        walls.position.y = height / 2
        walls.castShadow = true
        buildingGroup.add(walls)

        const roofGeometry = new THREE.ConeGeometry(Math.max(width, depth) / 2, height * 0.4, 4)
        const roofMaterial = new THREE.MeshStandardMaterial({
          color: 0x3d2817,
          roughness: 0.9,
        })
        const roof = new THREE.Mesh(roofGeometry, roofMaterial)
        roof.position.y = height + height * 0.2
        buildingGroup.add(roof)

        const doorGeometry = new THREE.BoxGeometry(width * 0.3, height * 0.6, 0.1)
        const doorMaterial = new THREE.MeshStandardMaterial({ color: 0x3d2817 })
        const door = new THREE.Mesh(doorGeometry, doorMaterial)
        door.position.set(0, height * 0.3, depth / 2 + 0.05)
        buildingGroup.add(door)

        for (let i = 0; i < 3; i++) {
          const windowGeometry = new THREE.BoxGeometry(width * 0.2, height * 0.2, 0.05)
          const windowMaterial = new THREE.MeshStandardMaterial({
            color: 0x1a3a5a,
            emissive: 0xffff99,
            emissiveIntensity: 0.5,
          })
          const window = new THREE.Mesh(windowGeometry, windowMaterial)
          window.position.set(width * -0.4 + i * width * 0.4, height * 0.6, depth / 2 + 0.05)
          buildingGroup.add(window)
        }

        buildingGroup.position.set(x, 0, z)
        return buildingGroup
      }

      scene.add(createBuilding(-12, -30, 4, 5, 4, true))
      scene.add(createBuilding(12, -50, 4.5, 5, 4.2, true))
      scene.add(createBuilding(-10, -80, 5, 6, 4.5, false))
      scene.add(createBuilding(11, -120, 4, 5, 4, true))
      scene.add(createBuilding(-13, -150, 5, 5.5, 4.3, true))
      scene.add(createBuilding(10, -200, 4.2, 5, 4.1, false))

      let scrollProgress = 0
      let time = 0

      const animate = () => {
        time++

        cars.forEach((car) => {
          car.rotation.y += 0.002
        })

        demogorgon.position.y = Math.sin(time * 0.01) * 0.5 + 0.5
        demogorgon.rotation.y += 0.003

        const baseZ = 25
        const maxZ = -400
        camera.position.z = baseZ + scrollProgress * (maxZ - baseZ)
        camera.position.y = 6 + Math.sin(scrollProgress * Math.PI) * 8
        camera.position.x = Math.sin(scrollProgress * Math.PI * 0.5) * 8

        renderer.render(scene, camera)
        requestAnimationFrame(animate)
      }
      animate()

      const handleWheel = (e: WheelEvent) => {
        e.preventDefault()
        scrollProgress = Math.max(0, Math.min(1, scrollProgress + e.deltaY * 0.0005))
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
