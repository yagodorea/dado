import { useRef, useEffect } from 'react'
import * as THREE from 'three'
import * as CANNON from 'cannon-es'
import { useDicePhysics } from '../hooks/useDicePhysics'
import { useDiceState } from '../hooks/useDiceState'
import { 
  createDiceGeometry, 
  createDiceMaterial 
} from '../utils/diceGeometry'
import { 
  addNumbersToFaces, 
  resetNumberColors, 
  animateRainbowNumber 
} from '../utils/diceNumbers'
import type { DiceRollerProps } from '../types/dado'

const DiceRoller: React.FC<DiceRollerProps> = ({ onRoll }) => {
  const mountRef = useRef<HTMLDivElement>(null)
  const diceRef = useRef<THREE.Mesh | null>(null)
  const numberRefsRef = useRef<Record<number, THREE.Group>>({})
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const animationIdRef = useRef<number | null>(null)

  // Custom hooks for physics and state management
  const {
    initializePhysics,
    rollDice,
    stepPhysics,
    getDiceVelocity,
    setDiceKinematic,
    diceBodyRef
  } = useDicePhysics()

  const {
    updateState,
    startRoll,
    getCurrentState,
    getWinningFace
  } = useDiceState(onRoll)

  // Roll function exposed to parent
  const roll = () => {
    if (diceRef.current) {
      // Show dice and start rolling
      startRoll(diceRef.current)
      rollDice()
      
      // Reset all number colors to green
      resetNumberColors(numberRefsRef.current)
      
      console.log('Dice rolled!')
    }
  }

  // Initialize Three.js scene and physics
  useEffect(() => {
    if (!mountRef.current) return

    console.log('Creating physics-enabled icosahedron...')

    // Scene setup
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000)
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
    
    renderer.setSize(window.innerWidth, window.innerWidth)
    renderer.setClearColor(0x000000, 0)
    
    // Store references
    sceneRef.current = scene
    rendererRef.current = renderer
    
    // Clear any existing content and add renderer
    mountRef.current.innerHTML = ''
    mountRef.current.appendChild(renderer.domElement)

    // Lighting setup
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6)
    const directionalLight1 = new THREE.DirectionalLight(0xffffff, 0.8)
    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.4)
    directionalLight1.position.set(2, 2, 2)
    directionalLight2.position.set(-1, -1, 1)
    scene.add(ambientLight, directionalLight1, directionalLight2)

    // Create dice
    const geometry = createDiceGeometry()
    const material = createDiceMaterial()
    const dice = new THREE.Mesh(geometry, material)
    
    scene.add(dice)
    diceRef.current = dice
    
    // Hide dice initially
    dice.visible = false

    // Add wireframe edges
    const wireframe = new THREE.EdgesGeometry(geometry)
    const line = new THREE.LineSegments(wireframe, new THREE.LineBasicMaterial({
      color: 0x000000,
      linewidth: 2
    }))
    dice.add(line)

    // Add numbers to faces
    const numberRefs = addNumbersToFaces(dice)
    numberRefsRef.current = numberRefs

    // Initialize physics
    initializePhysics(geometry)

    // Camera setup
    camera.position.set(0, 10, 18)
    camera.lookAt(0, -1, 0)

    // Animation loop
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate)
      
      // Step physics
      stepPhysics()
      
      // Update dice state machine first
      if (diceBodyRef.current) {
        updateState(dice, diceBodyRef.current, numberRefsRef.current, getDiceVelocity, setDiceKinematic)
      }
      
      // Update Three.js dice position and rotation from physics body (only if not in manual control states)
      const currentState = getCurrentState()
      if (diceBodyRef.current && (currentState === 'rolling' || currentState === 'settled')) {
        dice.position.set(diceBodyRef.current.position.x, diceBodyRef.current.position.y, diceBodyRef.current.position.z)
        dice.quaternion.set(diceBodyRef.current.quaternion.x, diceBodyRef.current.quaternion.y, diceBodyRef.current.quaternion.z, diceBodyRef.current.quaternion.w)
      }
      
      // Handle floating animation with rainbow colors
      if (getCurrentState() === 'floating') {
        const currentTime = Date.now() / 1000
        const winningFace = getWinningFace()
        
        // Animate rainbow colors on winning number
        if (winningFace && numberRefsRef.current[winningFace]) {
          animateRainbowNumber(numberRefsRef.current[winningFace], currentTime)
        }
      }
      
      renderer.render(scene, camera)
    }
    
    animate()

    // Cleanup function
    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current)
      }
      scene.clear()
      renderer.dispose()
      if (mountRef.current) {
        mountRef.current.innerHTML = ''
      }
    }
  }, [initializePhysics, stepPhysics, getDiceVelocity, setDiceKinematic, updateState, getCurrentState, getWinningFace])

  return (
    <>
      <div style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 10001,
        pointerEvents: 'none'
      }}>
        <div ref={mountRef} />
      </div>
      <button 
        onClick={roll}
        style={{
          position: 'fixed',
          bottom: '50px',
          right: '50px',
          padding: '15px 30px',
          fontSize: '18px',
          backgroundColor: '#44aa88',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          pointerEvents: 'auto',
          zIndex: 10002,
          fontWeight: 'bold',
          boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
        }}
        onMouseOver={(e) => (e.target as any).style.backgroundColor = '#55bb99'}
        onMouseOut={(e) => (e.target as any).style.backgroundColor = '#44aa88'}
      >
        🎲 Roll
      </button>
    </>
  )
}

export default DiceRoller