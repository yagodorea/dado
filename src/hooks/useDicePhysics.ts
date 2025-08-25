import { useRef, useCallback } from 'react'
import * as THREE from 'three'
import * as CANNON from 'cannon-es'
import { createDicePhysicsBody, createGroundPhysicsBody } from '../utils/diceGeometry'

interface DiceVelocity {
  velocity: number
  angularVelocity: number
}

interface DicePhysicsReturn {
  worldRef: React.RefObject<CANNON.World | null>
  diceBodyRef: React.RefObject<CANNON.Body | null>
  initializePhysics: (geometry: THREE.IcosahedronGeometry) => { world: CANNON.World; diceBody: CANNON.Body }
  rollDice: () => void
  stepPhysics: () => void
  getDiceVelocity: () => DiceVelocity
  setDiceKinematic: () => void
}

export function useDicePhysics(): DicePhysicsReturn {
  const worldRef = useRef<CANNON.World | null>(null)
  const diceBodyRef = useRef<CANNON.Body | null>(null)

  const initializePhysics = useCallback((geometry: THREE.IcosahedronGeometry) => {
    // Create physics world
    const world = new CANNON.World()
    world.gravity.set(0, -9.82, 0)
    world.broadphase = new CANNON.NaiveBroadphase()
    worldRef.current = world

    // Create dice physics body
    const diceBody = createDicePhysicsBody(geometry)
    diceBodyRef.current = diceBody
    world.addBody(diceBody)

    // Create ground physics body
    const groundBody = createGroundPhysicsBody()
    world.addBody(groundBody)

    return { world, diceBody }
  }, [])

  const rollDice = useCallback(() => {
    if (diceBodyRef.current) {
      // Re-enable physics
      diceBodyRef.current.type = CANNON.Body.DYNAMIC
      
      // Reset position and add new upward velocity and random rotation
      diceBodyRef.current.position.set(0, 2, -4)
      diceBodyRef.current.velocity.set(0, 13, 0)
      diceBodyRef.current.angularVelocity.set(
        (Math.random() - 0.5) * 12,
        (Math.random() - 0.5) * 12,
        (Math.random() - 0.5) * 12
      )
    }
  }, [])

  const stepPhysics = useCallback(() => {
    if (worldRef.current) {
      worldRef.current.step(1 / 60)
    }
  }, [])

  const getDiceVelocity = useCallback((): DiceVelocity => {
    if (!diceBodyRef.current) return { velocity: 0, angularVelocity: 0 }
    
    const velocity = Math.sqrt(
      diceBodyRef.current.velocity.x ** 2 + 
      diceBodyRef.current.velocity.y ** 2 + 
      diceBodyRef.current.velocity.z ** 2
    )
    const angularVelocity = Math.sqrt(
      diceBodyRef.current.angularVelocity.x ** 2 + 
      diceBodyRef.current.angularVelocity.y ** 2 + 
      diceBodyRef.current.angularVelocity.z ** 2
    )
    
    return { velocity, angularVelocity }
  }, [])

  const setDiceKinematic = useCallback(() => {
    if (diceBodyRef.current) {
      diceBodyRef.current.type = CANNON.Body.KINEMATIC
    }
  }, [])

  return {
    worldRef,
    diceBodyRef,
    initializePhysics,
    rollDice,
    stepPhysics,
    getDiceVelocity,
    setDiceKinematic
  }
}