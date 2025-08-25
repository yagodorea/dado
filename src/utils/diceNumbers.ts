import * as THREE from 'three'

export function createSegmentMaterial(): THREE.MeshPhongMaterial {
  return new THREE.MeshPhongMaterial({
    color: 0x00ff00,
    shininess: 100,
    emissive: 0x000000
  })
}

export function createOriginalMaterial(): THREE.MeshPhongMaterial {
  return new THREE.MeshPhongMaterial({
    color: 0x00ff00,
    shininess: 100,
    emissive: 0x000000
  })
}

function createDigitSegments(digit: number, offsetX: number = 0, underscore: boolean = false): THREE.Mesh[] {
  const segmentGeometry = new THREE.CylinderGeometry(0.06, 0.06, 0.4, 6)
  const shortSegmentGeometry = new THREE.CylinderGeometry(0.06, 0.06, 0.3, 6)
  const segmentMaterial = createSegmentMaterial()

  const segments: THREE.Mesh[] = []

  // Define 7-segment display patterns for each digit
  const patterns: Record<number, number[]> = {
    0: [1, 1, 1, 0, 1, 1, 1], // top, top-right, bottom-right, middle, bottom-left, top-left, bottom
    1: [0, 1, 1, 0, 0, 0, 0],
    2: [1, 1, 0, 1, 1, 0, 1],
    3: [1, 0, 0, 1, 1, 1, 1],
    4: [0, 1, 1, 1, 0, 1, 0],
    5: [1, 0, 1, 1, 0, 1, 1],
    6: [1, 0, 1, 1, 1, 1, 1],
    7: [1, 1, 1, 0, 0, 0, 0],
    8: [1, 1, 1, 1, 1, 1, 1],
    9: [1, 1, 1, 1, 0, 1, 1]
  }

  const pattern = patterns[digit] || patterns[0]

  // Positions for 7-segment display - positioned right on the surface
  const positions: [number, number, number][] = [
    [offsetX, 0.2, 0.05],      // top
    [offsetX + 0.15, 0.1, 0.05],  // top-right
    [offsetX + 0.15, -0.1, 0.05], // bottom-right
    [offsetX, 0, 0.05],         // middle
    [offsetX - 0.15, -0.1, 0.05], // bottom-left
    [offsetX - 0.15, 0.1, 0.05],  // top-left
    [offsetX, -0.2, 0.05]      // bottom
  ]

  const rotations: [number, number, number][] = [
    [0, 0, Math.PI / 2], // top - horizontal
    [0, 0, 0],           // top-right - vertical
    [0, 0, 0],           // bottom-right - vertical
    [0, 0, Math.PI / 2], // middle - horizontal
    [0, 0, 0],           // bottom-left - vertical
    [0, 0, 0],           // top-left - vertical
    [0, 0, Math.PI / 2]  // bottom - horizontal
  ]

  for (let i = 0; i < pattern.length; i++) {
    if (pattern[i]) {
      const geometry = (i === 0 || i === 3 || i === 6) ? segmentGeometry : shortSegmentGeometry
      const segment = new THREE.Mesh(geometry, segmentMaterial)
      segment.position.set(...positions[i])
      segment.rotation.set(...rotations[i])
      segments.push(segment)
    }
  }

  // Add underscore for 6 and 9 to distinguish them
  if (underscore) {
    const underscoreGeometry = new THREE.CylinderGeometry(0.04, 0.04, 0.32, 6)
    const underscore = new THREE.Mesh(underscoreGeometry, segmentMaterial)
    underscore.position.set(offsetX, -0.35, 0.05) // Bottom underscore
    underscore.rotation.set(0, 0, Math.PI / 2) // Horizontal
    segments.push(underscore)
  }

  return segments
}

function createEmbossedNumber(number: number, numberGroup: THREE.Group): void {
  // Handle single and double digit numbers
  const numberString = number.toString()
  if (numberString.length === 1) {
    const segments = createDigitSegments(parseInt(numberString[0]), undefined, number === 6 || number === 9)
    segments.forEach(segment => numberGroup.add(segment))
  } else {
    // Two digits - position them side by side
    const firstDigit = parseInt(numberString[0])
    const secondDigit = parseInt(numberString[1])

    let firstSegments: THREE.Mesh[], secondSegments: THREE.Mesh[];
    if (number === 20) {
      firstSegments = createDigitSegments(firstDigit, -0.25)
      secondSegments = createDigitSegments(secondDigit, 0.25)
    } else {
      if (number === 13) {
        firstSegments = createDigitSegments(secondDigit, -0.1)
        secondSegments = createDigitSegments(firstDigit, 0.1)
      } else {
        firstSegments = createDigitSegments(firstDigit, -0.3)
        secondSegments = createDigitSegments(secondDigit, 0.2)
      }
    }

    firstSegments.forEach(segment => numberGroup.add(segment))
    secondSegments.forEach(segment => numberGroup.add(segment))
  }
}

export function addNumbersToFaces(dice: THREE.Mesh): Record<number, THREE.Group> {
  const numberRefs: Record<number, THREE.Group> = {}
  const tempGeometry = new THREE.IcosahedronGeometry(2, 0)
  const positions = tempGeometry.attributes.position

  // Process each triangle (3 vertices = 1 face)
  for (let i = 0; i < positions.count; i += 3) {
    const faceIndex = Math.floor(i / 3) + 1
    if (faceIndex > 20) break

    // Get face vertices
    const vA = new THREE.Vector3().fromBufferAttribute(positions, i)
    const vB = new THREE.Vector3().fromBufferAttribute(positions, i + 1)
    const vC = new THREE.Vector3().fromBufferAttribute(positions, i + 2)

    // Calculate face center and normal
    const faceCenter = new THREE.Vector3()
    faceCenter.add(vA).add(vB).add(vC).divideScalar(3)
    const normal = faceCenter.clone().normalize()

    // Create number group
    const numberGroup = new THREE.Group()

    createEmbossedNumber(faceIndex, numberGroup)

    // Position number group directly on the face surface
    const groupPosition = normal.clone().multiplyScalar(1.6)
    numberGroup.position.copy(groupPosition)

    // Orient the group to face outward from this specific face
    numberGroup.lookAt(groupPosition.clone().add(normal))

    numberGroup.name = `Face ${faceIndex}`
    numberRefs[faceIndex] = numberGroup
    dice.add(numberGroup)
  }

  return numberRefs
}

export function resetNumberColors(numberRefs: Record<number, THREE.Group>): void {
  Object.values(numberRefs).forEach(numberGroup => {
    const originalMaterial = createOriginalMaterial()
    numberGroup.children.forEach((child) => {
      if (child instanceof THREE.Mesh) {
        child.material = originalMaterial
        // Reset scale to original
        if (child.userData.originalScale) {
          child.scale.copy(child.userData.originalScale)
        }
      }
    })
  })
}

export function animateRainbowNumber(numberGroup: THREE.Group, currentTime: number): void {
  if (!numberGroup) return
  
  numberGroup.children.forEach((child) => {
    if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshPhongMaterial) {
      // Rainbow color animation - cycle through hue
      const hue = (currentTime * 180) % 360 // Full rainbow cycle every 2 seconds
      const rainbowColor = new THREE.Color().setHSL(hue / 360, 1.0, 0.6)
      
      // Apply rainbow color
      child.material.color = rainbowColor
      child.material.emissive = rainbowColor.clone().multiplyScalar(0.3)
    }
  })
}

export function storeOriginalScales(numberGroup: THREE.Group): void {
  if (!numberGroup) return
  
  numberGroup.children.forEach((child) => {
    child.userData.originalScale = child.scale.clone()
  })
}