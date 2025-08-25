import { useRef, useCallback } from 'react'
import * as THREE from 'three'
import * as CANNON from 'cannon-es'
import { getTopFace } from '../utils/diceGeometry'
import { storeOriginalScales } from '../utils/diceNumbers'

type DiceState = 'hidden' | 'rolling' | 'settled' | 'transitioning' | 'floating' | 'fading'

interface DiceStateReturn {
  updateState: (
    dice: THREE.Mesh,
    diceBody: CANNON.Body,
    numberRefs: Record<number, THREE.Group>,
    getDiceVelocity: () => { velocity: number; angularVelocity: number },
    setDiceKinematic: () => void
  ) => void
  startRoll: (dice: THREE.Mesh) => void
  getCurrentState: () => DiceState
  getWinningFace: () => number | null
}

export function useDiceState(onRoll?: (face: number) => void): DiceStateReturn {
  const stateRef = useRef<DiceState>('hidden')
  const settledTimeRef = useRef<number>(0)
  const winningFaceRef = useRef<number | null>(null)
  const resultDisplayTimeRef = useRef<number>(0)
  const transitionStartTimeRef = useRef<number>(0)
  const settledPositionRef = useRef<THREE.Vector3>(new THREE.Vector3())
  const settledQuaternionRef = useRef<THREE.Quaternion>(new THREE.Quaternion())
  const fadeStartTimeRef = useRef<number>(0)

  const updateState = useCallback((
    dice: THREE.Mesh,
    diceBody: CANNON.Body,
    numberRefs: Record<number, THREE.Group>,
    getDiceVelocity: () => { velocity: number; angularVelocity: number },
    setDiceKinematic: () => void
  ) => {
    const currentState = stateRef.current
    
    if (currentState === 'rolling') {
      // Check if dice has settled (low velocity)
      const { velocity, angularVelocity } = getDiceVelocity()

      if (velocity < 0.1 && angularVelocity < 0.1) {
        stateRef.current = 'settled'
        settledTimeRef.current = Date.now()
        console.log('Dice has settled')
      }
    } 
    else if (currentState === 'settled') {
      // After 2 seconds of being settled, show result
      if (Date.now() - settledTimeRef.current > 2000) {
        stateRef.current = 'transitioning'
        winningFaceRef.current = getTopFace(dice.rotation)
        console.log('FINAL RESULT - Top face is:', winningFaceRef.current)

        // Store settled position and rotation for smooth transition
        settledPositionRef.current.copy(dice.position)
        settledQuaternionRef.current.copy(dice.quaternion)
        transitionStartTimeRef.current = Date.now()

        // Highlight winning face
        const nGroup = numberRefs[winningFaceRef.current]
        if (nGroup) {
          storeOriginalScales(nGroup)
        }

        // Disable physics to start manual animation
        setDiceKinematic()

        // Call the result callback
        if (onRoll) {
          onRoll(winningFaceRef.current)
        }
      }
    }
    else if (currentState === 'transitioning') {
      // Smooth transition from settled position to floating position over 1 second
      const transitionDuration = 1000
      const elapsed = Date.now() - transitionStartTimeRef.current
      const progress = Math.min(elapsed / transitionDuration, 1)
      
      // Smooth easing function (ease-out)
      const easeOut = 1 - Math.pow(1 - progress, 3)
      
      // Target floating position and rotation
      const targetPosition = new THREE.Vector3(0, 0.5, 0)
      
      // Calculate target rotation to show winning face toward camera
      let targetQuaternion = new THREE.Quaternion()
      if (winningFaceRef.current) {
        const tempGeometry = new THREE.IcosahedronGeometry(2, 0)
        const positions = tempGeometry.attributes.position
        
        // Find the winning face center and normal
        for (let i = 0; i < positions.count; i += 3) {
          const faceIndex = Math.floor(i / 3) + 1
          if (faceIndex === winningFaceRef.current) {
            const vA = new THREE.Vector3().fromBufferAttribute(positions, i)
            const vB = new THREE.Vector3().fromBufferAttribute(positions, i + 1)
            const vC = new THREE.Vector3().fromBufferAttribute(positions, i + 2)
            
            const faceCenter = new THREE.Vector3()
            faceCenter.add(vA).add(vB).add(vC).divideScalar(3)
            const normal = faceCenter.clone().normalize()
            
            const targetDirection = new THREE.Vector3(0, 0.4, 0.95)
            targetQuaternion.setFromUnitVectors(normal, targetDirection)
            break
          }
        }
      }
      
      // Lerp position and rotation
      dice.position.lerpVectors(settledPositionRef.current, targetPosition, easeOut)
      dice.quaternion.slerpQuaternions(settledQuaternionRef.current, targetQuaternion, easeOut)
      diceBody.position.set(dice.position.x, dice.position.y, dice.position.z)
      diceBody.quaternion.set(dice.quaternion.x, dice.quaternion.y, dice.quaternion.z, dice.quaternion.w)
      
      // Ensure dice stays visible during transition
      if (!dice.visible) {
        console.log('WARNING: Dice became invisible during transition - fixing')
        dice.visible = true
      }
      
      // Debug logging
    //   console.log(`Transitioning: progress=${progress.toFixed(2)}, position=${dice.position.x.toFixed(2)},${dice.position.y.toFixed(2)},${dice.position.z.toFixed(2)}, visible=${dice.visible}`)
      
      // When transition is complete, move to floating state
      if (progress >= 1) {
        stateRef.current = 'floating'
        resultDisplayTimeRef.current = Date.now()
        console.log('Transition to floating complete', dice.position)
      }
    }
    else if (currentState === 'floating') {
      // Ensure dice stays visible during floating
      if (!dice.visible) {
        console.log('WARNING: Dice became invisible during floating - fixing')
        dice.visible = true
      }
      
      // Handle floating animation with gentle bobbing motion
      const currentTime = Date.now() / 1000
      const targetY = 0.5
      const floatHeight = targetY + Math.sin(currentTime * 2) * 0.2
      dice.position.y = floatHeight
      diceBody.position.y = floatHeight
      
      // Debug logging (only every 60 frames to avoid spam)
    //   if (Math.floor(currentTime * 60) % 60 === 0) {
    //     console.log(`Floating: position=${dice.position.x.toFixed(2)},${dice.position.y.toFixed(2)},${dice.position.z.toFixed(2)}, visible=${dice.visible}`)
    //   }
      
      // After 3 seconds of displaying result, start fading out
      if (Date.now() - resultDisplayTimeRef.current > 3000) {
        stateRef.current = 'fading'
        fadeStartTimeRef.current = Date.now()
        console.log('Starting dice fade out')
      }
    }
    else if (currentState === 'fading') {
      // Fade out over 300ms
      const fadeDuration = 300
      const elapsed = Date.now() - fadeStartTimeRef.current
      const progress = Math.min(elapsed / fadeDuration, 1)
      
      // Smooth fade out (ease-in)
      const fadeProgress = 1 - Math.pow(progress, 2)
      
      // Set opacity on the dice material(s)
      const materials = Array.isArray(dice.material) ? dice.material : [dice.material]
      materials.forEach(material => {
        if (material instanceof THREE.Material) {
          material.transparent = true
          material.opacity = fadeProgress
          material.needsUpdate = true
        }
      })
      
      // Also fade the number materials
      dice.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          const childMaterials = Array.isArray(child.material) ? child.material : [child.material]
          childMaterials.forEach(material => {
            if (material instanceof THREE.Material) {
              material.transparent = true
              material.opacity = fadeProgress
              material.needsUpdate = true
            }
          })
        }
      })
      
      // Continue floating motion during fade
      const currentTime = Date.now() / 1000
      const targetY = 0.5
      const floatHeight = targetY + Math.sin(currentTime * 2) * 0.2
      dice.position.y = floatHeight
      diceBody.position.y = floatHeight
      
      // When fade is complete, hide the dice
      if (progress >= 1) {
        dice.visible = false
        stateRef.current = 'hidden'
        console.log('Dice hidden after fade out')
      }
    }
  }, [onRoll])

  const startRoll = useCallback((dice: THREE.Mesh) => {
    dice.visible = true
    stateRef.current = 'rolling'
    
    // Reset opacity for new roll
    const materials = Array.isArray(dice.material) ? dice.material : [dice.material]
    materials.forEach(material => {
      if (material instanceof THREE.Material) {
        material.opacity = 1
      }
    })
    dice.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const childMaterials = Array.isArray(child.material) ? child.material : [child.material]
        childMaterials.forEach(material => {
          if (material instanceof THREE.Material) {
            material.opacity = 1
          }
        })
      }
    })
  }, [])

  const getCurrentState = useCallback((): DiceState => stateRef.current, [])
  const getWinningFace = useCallback((): number | null => winningFaceRef.current, [])

  return {
    updateState,
    startRoll,
    getCurrentState,
    getWinningFace
  }
}