import * as THREE from 'three'
import * as CANNON from 'cannon-es'

export function createDiceGeometry(): THREE.IcosahedronGeometry {
  return new THREE.IcosahedronGeometry(2, 0)
}

export function createDiceMaterial(): THREE.MeshPhongMaterial {
  return new THREE.MeshPhongMaterial({
    color: 0x44aa88,
    shininess: 100,
    opacity: 1,
  })
}

export function createDicePhysicsBody(geometry: THREE.IcosahedronGeometry): CANNON.Body {
  // Create dice physics body with convex hull for realistic icosahedron collision
  const diceVertices: CANNON.Vec3[] = []
  const dicePositions = geometry.attributes.position.array
  for (let i = 0; i < dicePositions.length; i += 3) {
    diceVertices.push(new CANNON.Vec3(dicePositions[i], dicePositions[i + 1], dicePositions[i + 2]))
  }

  // Create faces array for the icosahedron
  const diceFaces: number[][] = []
  for (let i = 0; i < diceVertices.length; i += 3) {
    diceFaces.push([i, i + 1, i + 2])
  }

  const diceShape = new CANNON.ConvexPolyhedron({ vertices: diceVertices, faces: diceFaces })
  
  const diceBody = new CANNON.Body({
    mass: 1,
    shape: diceShape,
    material: new CANNON.Material({ friction: 0.4, restitution: 0.3 })
  })
  
  diceBody.position.set(0, 2, -4)
  diceBody.velocity.set(0, 0, 0)
  diceBody.angularVelocity.set(0, 0, 0)
  
  return diceBody
}

export function createGroundPhysicsBody(): CANNON.Body {
  const groundShape = new CANNON.Plane()
  const groundBody = new CANNON.Body({
    mass: 0,
    shape: groundShape,
    material: new CANNON.Material({ friction: 0.4, restitution: 0.3 })
  })
  groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2)
  groundBody.position.set(0, -3, 0)
  return groundBody
}

export function getTopFace(icosahedronRotation: THREE.Euler): number {
  const tempGeometry = new THREE.IcosahedronGeometry(2, 0)
  const positions = tempGeometry.attributes.position
  let highestY = -Infinity
  let topFaceIndex = 1

  // Transform all vertices by current rotation and find highest Y (top face)
  const rotationMatrix = new THREE.Matrix4()
  rotationMatrix.makeRotationFromEuler(icosahedronRotation)

  // Process each triangle (3 vertices = 1 face)
  for (let i = 0; i < positions.count; i += 3) {
    const faceIndex = Math.floor(i / 3) + 1
    if (faceIndex > 20) break

    // Get face vertices and transform them
    const vA = new THREE.Vector3().fromBufferAttribute(positions, i)
    const vB = new THREE.Vector3().fromBufferAttribute(positions, i + 1)
    const vC = new THREE.Vector3().fromBufferAttribute(positions, i + 2)

    vA.applyMatrix4(rotationMatrix)
    vB.applyMatrix4(rotationMatrix)
    vC.applyMatrix4(rotationMatrix)

    // Calculate face center
    const faceCenter = new THREE.Vector3()
    faceCenter.add(vA).add(vB).add(vC).divideScalar(3)

    // Check if this face is the highest (most upward)
    if (faceCenter.y > highestY) {
      highestY = faceCenter.y
      topFaceIndex = faceIndex
    }
  }
  return topFaceIndex
}