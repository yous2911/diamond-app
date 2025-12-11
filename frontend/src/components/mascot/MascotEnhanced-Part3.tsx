/**
 * MascotEnhanced-Part3.tsx - Type-Specific Features
 * Enhanced mascot features for each type (dragon, fairy, robot, cat, owl)
 */

import * as THREE from 'three';
import { MASCOT_CONFIGS, EnhancedMascotState } from './MascotEnhanced-Part1';

// Dragon-specific features
export function createDragonWings(
  config: typeof MASCOT_CONFIGS['dragon'],
  aiState: EnhancedMascotState
): THREE.Group {
  const wingsGroup = new THREE.Group();
  
  // Create detailed wing membrane
  const wingShape = new THREE.Shape();
  
  // Wing bone structure
  const bones = [
    { x: 0, y: 0 },
    { x: 0.3, y: 0.2 },
    { x: 0.6, y: 0.3 },
    { x: 1.0, y: 0.2 },
    { x: 1.5, y: 0 }
  ];
  
  // Create wing membrane between bones
  wingShape.moveTo(0, 0);
  
  // Upper edge
  wingShape.bezierCurveTo(0.5, 0.4, 1.0, 0.5, 1.5, 0);
  
  // Wing fingers
  for (let i = 0; i < 4; i++) {
    const fingerStart = 1.5 - (i * 0.3);
    const fingerTip = fingerStart - 0.2;
    const fingerHeight = -0.3 - (i * 0.1);
    
    wingShape.lineTo(fingerStart, -0.1);
    wingShape.quadraticCurveTo(fingerTip, fingerHeight, fingerStart - 0.15, -0.1);
  }
  
  // Bottom edge back to start
  wingShape.quadraticCurveTo(0.2, -0.2, 0, 0);
  
  const wingGeometry = new THREE.ExtrudeGeometry(wingShape, {
    depth: 0.02,
    bevelEnabled: true,
    bevelThickness: 0.01,
    bevelSize: 0.01,
    bevelSegments: 2
  });
  
  // Wing material with transparency and double-sided rendering
  const wingMaterial = new THREE.MeshPhysicalMaterial({
    color: config.colors.secondary,
    emissive: config.colors.primary,
    emissiveIntensity: 0.1,
    transparent: true,
    opacity: 0.85,
    side: THREE.DoubleSide,
    roughness: 0.3,
    metalness: 0.1,
    transmission: 0.3,
    thickness: 0.1
  });
  
  // Create wing bones for structure
  const boneMaterial = new THREE.MeshPhongMaterial({
    color: config.colors.primary,
    emissive: config.colors.tertiary,
    emissiveIntensity: 0.2
  });
  
  // Left wing
  const leftWing = new THREE.Group();
  const leftMembrane = new THREE.Mesh(wingGeometry, wingMaterial);
  leftWing.add(leftMembrane);
  
  // Add bones
  bones.forEach((bone, i) => {
    if (i < bones.length - 1) {
      const nextBone = bones[i + 1];
      const boneLength = Math.sqrt(
        Math.pow(nextBone.x - bone.x, 2) + 
        Math.pow(nextBone.y - bone.y, 2)
      );
      const boneGeo = new THREE.CylinderGeometry(0.02, 0.015, boneLength, 8);
      const boneMesh = new THREE.Mesh(boneGeo, boneMaterial);
      
      // Position and rotate bone
      boneMesh.position.set(
        (bone.x + nextBone.x) / 2,
        (bone.y + nextBone.y) / 2,
        0.02
      );
      const angle = Math.atan2(nextBone.y - bone.y, nextBone.x - bone.x);
      boneMesh.rotation.z = angle - Math.PI / 2;
      
      leftWing.add(boneMesh);
    }
  });
  
  // Wing position and rotation
  leftWing.position.set(-0.8, 0.3, -0.2);
  leftWing.rotation.y = -0.4;
  
  // Right wing (mirrored)
  const rightWing = leftWing.clone(true);
  rightWing.position.x = 0.8;
  rightWing.rotation.y = 0.4;
  rightWing.scale.x = -1;
  
  wingsGroup.add(leftWing, rightWing);
  
  // Store for animation
  wingsGroup.userData = { leftWing, rightWing };
  
  return wingsGroup;
}

export function createDragonTail(
  config: typeof MASCOT_CONFIGS['dragon'],
  aiState: EnhancedMascotState
): THREE.Group {
  const tailGroup = new THREE.Group();
  
  // Create segmented tail for realistic movement
  const segmentCount = 8;
  const segmentLength = 0.3;
  
  const segments: THREE.Mesh[] = [];
  
  for (let i = 0; i < segmentCount; i++) {
    const scale = 1 - (i / segmentCount) * 0.8;
    const segmentGeo = new THREE.SphereGeometry(0.15 * scale, 16, 12);
    
    const segmentMat = new THREE.MeshPhongMaterial({
      color: config.colors.primary,
      emissive: config.colors.secondary,
      emissiveIntensity: 0.1
    });
    
    const segment = new THREE.Mesh(segmentGeo, segmentMat);
    segment.position.set(0, 0, -i * segmentLength);
    segment.scale.z = 1.5; // Elongate segments
    
    // Add spikes on top segments
    if (i < segmentCount - 2) {
      const spikeGeo = new THREE.ConeGeometry(0.05 * scale, 0.15 * scale, 4);
      const spike = new THREE.Mesh(spikeGeo, segmentMat);
      spike.position.y = 0.15 * scale;
      segment.add(spike);
    }
    
    if (i > 0) {
      segments[i - 1].add(segment);
    } else {
      tailGroup.add(segment);
    }
    
    segments.push(segment);
  }
  
  // Add tail tip (spade shape)
  const tipShape = new THREE.Shape();
  tipShape.moveTo(0, 0.1);
  tipShape.quadraticCurveTo(0.1, 0, 0, -0.1);
  tipShape.quadraticCurveTo(-0.1, 0, 0, 0.1);
  
  const tipGeo = new THREE.ExtrudeGeometry(tipShape, {
    depth: 0.02,
    bevelEnabled: true,
    bevelThickness: 0.01,
    bevelSize: 0.01
  });
  
  const tip = new THREE.Mesh(tipGeo, new THREE.MeshPhongMaterial({
    color: config.colors.tertiary,
    emissive: config.colors.tertiary,
    emissiveIntensity: 0.3
  }));
  
  let lastSegment: THREE.Mesh = tailGroup.children[segmentCount - 1] as THREE.Mesh;
  for (let i = 1; i < segmentCount; i++) {
    lastSegment = lastSegment.children[0] as THREE.Mesh;
  }
  lastSegment.add(tip);
  
  tailGroup.position.set(0, -0.5, -0.5);
  return tailGroup;
}

// Fairy-specific features
export function createFairyWings(
  config: typeof MASCOT_CONFIGS['fairy'],
  aiState: EnhancedMascotState
): THREE.Group {
  const wingsGroup = new THREE.Group();
  
  // Create butterfly-style wings with 4 sections
  const createWingSection = (isUpper: boolean): THREE.Shape => {
    const shape = new THREE.Shape();
    
    if (isUpper) {
      shape.moveTo(0, 0);
      shape.bezierCurveTo(0.4, 0.1, 0.7, 0.4, 0.6, 0.8);
      shape.bezierCurveTo(0.5, 1.0, 0.2, 1.0, 0, 0.9);
      shape.bezierCurveTo(-0.1, 0.6, -0.1, 0.3, 0, 0);
    } else {
      shape.moveTo(0, 0);
      shape.bezierCurveTo(0.3, -0.05, 0.5, -0.2, 0.4, -0.5);
      shape.bezierCurveTo(0.3, -0.7, 0.1, -0.7, 0, -0.6);
      shape.bezierCurveTo(-0.05, -0.4, -0.05, -0.2, 0, 0);
    }
    
    return shape;
  };
  
  // Wing material with iridescence
  const wingMaterial = new THREE.MeshPhysicalMaterial({
    color: config.colors.secondary,
    emissive: config.colors.tertiary,
    emissiveIntensity: 0.2,
    transparent: true,
    opacity: 0.7,
    side: THREE.DoubleSide,
    transmission: 0.6,
    thickness: 0.05,
    roughness: 0.1,
    metalness: 0.2,
    iridescence: 0.8,
    iridescenceIOR: 1.3,
    sheen: 1,
    sheenColor: config.colors.glow
  });
  
  // Create all wing sections
  const upperWingGeo = new THREE.ShapeGeometry(createWingSection(true));
  const lowerWingGeo = new THREE.ShapeGeometry(createWingSection(false));
  
  // Left wings
  const leftUpperWing = new THREE.Mesh(upperWingGeo, wingMaterial);
  leftUpperWing.position.set(-0.3, 0.8, -0.3);
  leftUpperWing.scale.set(1.2, 1.2, 1);
  
  const leftLowerWing = new THREE.Mesh(lowerWingGeo, wingMaterial);
  leftLowerWing.position.set(-0.3, 0.3, -0.3);
  leftLowerWing.scale.set(0.8, 0.8, 1);
  
  // Right wings
  const rightUpperWing = leftUpperWing.clone();
  rightUpperWing.position.x = 0.3;
  rightUpperWing.scale.x = -1.2;
  
  const rightLowerWing = leftLowerWing.clone();
  rightLowerWing.position.x = 0.3;
  rightLowerWing.scale.x = -0.8;
  
  // Add wing patterns
  const patternCount = 5;
  const patternMaterial = new THREE.MeshBasicMaterial({
    color: config.colors.glow,
    transparent: true,
    opacity: 0.3,
    side: THREE.DoubleSide
  });
  
  [leftUpperWing, leftLowerWing, rightUpperWing, rightLowerWing].forEach(wing => {
    for (let i = 0; i < patternCount; i++) {
      const spotGeo = new THREE.CircleGeometry(0.05 + Math.random() * 0.05, 16);
      const spot = new THREE.Mesh(spotGeo, patternMaterial);
      
      spot.position.set(
        (Math.random() - 0.5) * 0.4,
        (Math.random() - 0.5) * 0.4,
        0.01
      );
      
      wing.add(spot);
    }
  });
  
  wingsGroup.add(leftUpperWing, leftLowerWing, rightUpperWing, rightLowerWing);
  
  // Add magical sparkles
  const sparkleGeometry = new THREE.BufferGeometry();
  const sparkleCount = 100;
  const positions = new Float32Array(sparkleCount * 3);
  const sizes = new Float32Array(sparkleCount);
  
  for (let i = 0; i < sparkleCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 2;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 2;
    positions[i * 3 + 2] = -0.5 + Math.random() * 0.5;
    sizes[i] = Math.random() * 0.03 + 0.01;
  }
  
  sparkleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  sparkleGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
  
  const sparkleMaterial = new THREE.PointsMaterial({
    color: config.colors.glow,
    size: 0.02,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending,
    vertexColors: false
  });
  
  const sparkles = new THREE.Points(sparkleGeometry, sparkleMaterial);
  wingsGroup.add(sparkles);
  
  // Store for animation
  wingsGroup.userData = {
    leftUpperWing,
    leftLowerWing,
    rightUpperWing,
    rightLowerWing,
    sparkles
  };
  
  return wingsGroup;
}

// Robot-specific features
export function createRobotArms(
  config: typeof MASCOT_CONFIGS['robot'],
  aiState: EnhancedMascotState
): THREE.Group {
  const armsGroup = new THREE.Group();
  
  const jointMaterial = new THREE.MeshStandardMaterial({
    color: config.colors.secondary,
    metalness: 0.9,
    roughness: 0.2,
    emissive: config.colors.secondary,
    emissiveIntensity: 0.1
  });
  
  const createArm = (): THREE.Group => {
    const arm = new THREE.Group();
    
    // Shoulder joint
    const shoulderGeo = new THREE.SphereGeometry(0.12, 16, 16);
    const shoulder = new THREE.Mesh(shoulderGeo, jointMaterial);
    arm.add(shoulder);
    
    // Upper arm
    const upperArmGeo = new THREE.BoxGeometry(0.15, 0.4, 0.15);
    const upperArm = new THREE.Mesh(upperArmGeo, jointMaterial);
    upperArm.position.y = -0.25;
    shoulder.add(upperArm);
    
    // Elbow joint
    const elbowGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.15);
    const elbow = new THREE.Mesh(elbowGeo, jointMaterial);
    elbow.position.y = -0.25;
    elbow.rotation.z = Math.PI / 2;
    upperArm.add(elbow);
    
    // Lower arm
    const lowerArmGeo = new THREE.BoxGeometry(0.12, 0.35, 0.12);
    const lowerArm = new THREE.Mesh(lowerArmGeo, jointMaterial);
    lowerArm.position.y = -0.2;
    elbow.add(lowerArm);
    
    // Hand
    const handGroup = new THREE.Group();
    handGroup.position.y = -0.2;
    
    // Palm
    const palmGeo = new THREE.BoxGeometry(0.1, 0.08, 0.15);
    const palm = new THREE.Mesh(palmGeo, jointMaterial);
    handGroup.add(palm);
    
    // Fingers
    for (let i = 0; i < 3; i++) {
      const fingerGeo = new THREE.BoxGeometry(0.02, 0.08, 0.02);
      const finger = new THREE.Mesh(fingerGeo, jointMaterial);
      finger.position.set((i - 1) * 0.03, -0.06, 0.05);
      handGroup.add(finger);
    }
    
    // Thumb
    const thumbGeo = new THREE.BoxGeometry(0.02, 0.06, 0.02);
    const thumb = new THREE.Mesh(thumbGeo, jointMaterial);
    thumb.position.set(0.05, 0, 0.03);
    thumb.rotation.z = -0.5;
    handGroup.add(thumb);
    
    lowerArm.add(handGroup);
    
    // Add servo details
    const servoGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.02, 8);
    const servoMat = new THREE.MeshPhongMaterial({
      color: config.colors.eyes,
      emissive: config.colors.eyes,
      emissiveIntensity: 0.5
    });
    
    [shoulder, elbow].forEach(joint => {
      const servo = new THREE.Mesh(servoGeo, servoMat);
      servo.rotation.x = Math.PI / 2;
      servo.position.z = 0.08;
      joint.add(servo);
    });
    
    return arm;
  };
  
  const leftArm = createArm();
  leftArm.position.set(-0.7, 0.5, 0);
  
  const rightArm = createArm();
  rightArm.position.set(0.7, 0.5, 0);
  
  armsGroup.add(leftArm, rightArm);
  
  // Store for animation
  armsGroup.userData = { leftArm, rightArm };
  
  return armsGroup;
}

export function createRobotScreen(
  config: typeof MASCOT_CONFIGS['robot'],
  aiState: EnhancedMascotState
): THREE.Mesh {
  // Create LED display on chest
  const screenGeo = new THREE.PlaneGeometry(0.6, 0.4);
  
  // Create canvas texture for dynamic display
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  
  // Draw display content based on emotion
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Draw emotion indicator
  ctx.fillStyle = '#00ff00';
  ctx.font = '48px monospace';
  
  const dominantEmotion = Object.entries(aiState.emotions)
    .sort(([, a], [, b]) => b - a)[0][0];
  
  const emotionIcons: Record<string, string> = {
    joy: '^_^',
    sadness: 'T_T',
    surprise: 'O_O',
    fear: '>_<',
    trust: '♥_♥',
    anticipation: '*_*'
  };
  
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(emotionIcons[dominantEmotion] || '•_•', 128, 64);
  
  // Draw status bars
  ctx.fillStyle = '#00ff00';
  ctx.fillRect(10, 100, (236 * aiState.energy) / 100, 10);
  ctx.strokeStyle = '#00ff00';
  ctx.strokeRect(10, 100, 236, 10);
  
  const texture = new THREE.CanvasTexture(canvas);
  
  const screenMat = new THREE.MeshPhongMaterial({
    map: texture,
    emissive: config.colors.eyes,
    emissiveIntensity: 0.3,
    emissiveMap: texture
  });
  
  const screen = new THREE.Mesh(screenGeo, screenMat);
  screen.position.set(0, 0.3, 0.51);
  
  // Store canvas for updates
  screen.userData = { canvas, ctx };
  
  return screen;
}

// Cat-specific features
export function createCatTail(
  config: typeof MASCOT_CONFIGS['cat'],
  aiState: EnhancedMascotState
): THREE.Group {
  const tailGroup = new THREE.Group();
  
  // Create curved tail with fur texture
  const tailCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, -0.2, -0.3),
    new THREE.Vector3(0.1, -0.3, -0.6),
    new THREE.Vector3(0.2, -0.2, -0.9),
    new THREE.Vector3(0.1, 0, -1.2),
    new THREE.Vector3(0, 0.1, -1.3)
  ]);
  
  // Variable radius for natural taper
  const radiusFunc = (t: number) => 0.12 * (1 - t * 0.4);
  
  // Create custom geometry for variable radius
  const segments = 20;
  const radialSegments = 8;
  const points = tailCurve.getPoints(segments);
  const geometry = new THREE.BufferGeometry();
  
  const vertices: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  
  // Generate vertices
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const radius = radiusFunc(t);
    const point = points[i];
    const tangent = tailCurve.getTangent(t);
    
    // Create perpendicular vectors
    const normal = new THREE.Vector3(0, 1, 0);
    const binormal = new THREE.Vector3().crossVectors(tangent, normal).normalize();
    normal.crossVectors(binormal, tangent).normalize();
    
    for (let j = 0; j <= radialSegments; j++) {
      const angle = (j / radialSegments) * Math.PI * 2;
      const sin = Math.sin(angle);
      const cos = Math.cos(angle);
      
      const vertex = new THREE.Vector3(
        point.x + (cos * binormal.x + sin * normal.x) * radius,
        point.y + (cos * binormal.y + sin * normal.y) * radius,
        point.z + (cos * binormal.z + sin * normal.z) * radius
      );
      
      vertices.push(vertex.x, vertex.y, vertex.z);
      normals.push(
        cos * binormal.x + sin * normal.x,
        cos * binormal.y + sin * normal.y,
        cos * binormal.z + sin * normal.z
      );
      uvs.push(j / radialSegments, i / segments);
    }
  }
  
  // Generate indices
  for (let i = 0; i < segments; i++) {
    for (let j = 0; j < radialSegments; j++) {
      const a = i * (radialSegments + 1) + j;
      const b = a + radialSegments + 1;
      const c = a + 1;
      const d = b + 1;
      
      indices.push(a, b, c);
      indices.push(b, d, c);
    }
  }
  
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  
  // Fur material
  const tailMaterial = new THREE.MeshPhongMaterial({
    color: config.colors.primary,
    emissive: config.colors.secondary,
    emissiveIntensity: 0.05
  });
  
  const tail = new THREE.Mesh(geometry, tailMaterial);
  
  // Add fur stripes
  const stripeCount = 5;
  for (let i = 0; i < stripeCount; i++) {
    const stripeGeo = new THREE.TorusGeometry(
      radiusFunc(i / stripeCount) + 0.01,
      0.01,
      4,
      8
    );
    const stripe = new THREE.Mesh(stripeGeo, new THREE.MeshPhongMaterial({
      color: config.colors.tertiary
    }));
    
    const t = i / stripeCount;
    const pos = tailCurve.getPoint(t);
    stripe.position.copy(pos);
    
    const tangent = tailCurve.getTangent(t);
    stripe.lookAt(pos.clone().add(tangent));
    
    tailGroup.add(stripe);
  }
  
  tailGroup.add(tail);
  tailGroup.position.set(0, -0.5, -0.5);
  
  return tailGroup;
}

// Owl-specific features
export function createOwlBook(
  config: typeof MASCOT_CONFIGS['owl']
): THREE.Group {
  const bookGroup = new THREE.Group();
  
  // Book cover
  const coverGeo = new THREE.BoxGeometry(0.3, 0.4, 0.05);
  const coverMat = new THREE.MeshPhongMaterial({
    color: 0x8B4513,
    emissive: 0x4A2511,
    emissiveIntensity: 0.1
  });
  const cover = new THREE.Mesh(coverGeo, coverMat);
  
  // Book spine
  const spineGeo = new THREE.BoxGeometry(0.02, 0.4, 0.05);
  const spineMat = new THREE.MeshPhongMaterial({
    color: 0x654321,
    emissive: 0x321611,
    emissiveIntensity: 0.2
  });
  const spine = new THREE.Mesh(spineGeo, spineMat);
  spine.position.x = -0.14;
  cover.add(spine);
  
  // Pages
  const pagesGeo = new THREE.BoxGeometry(0.28, 0.38, 0.04);
  const pagesMat = new THREE.MeshPhongMaterial({
    color: 0xFFFEF0,
    emissive: 0xFFFEF0,
    emissiveIntensity: 0.1
  });
  const pages = new THREE.Mesh(pagesGeo, pagesMat);
  pages.position.z = -0.005;
  cover.add(pages);
  
  // Title
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  
  ctx.fillStyle = '#8B4513';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#FFD700';
  ctx.font = 'bold 20px serif';
  ctx.textAlign = 'center';
  ctx.fillText('WISDOM', 64, 50);
  ctx.font = '16px serif';
  ctx.fillText('of the', 64, 80);
  ctx.fillText('AGES', 64, 110);
  
  const titleTexture = new THREE.CanvasTexture(canvas);
  const titleMat = new THREE.MeshBasicMaterial({ map: titleTexture });
  
  const titlePlane = new THREE.PlaneGeometry(0.3, 0.4);
  const title = new THREE.Mesh(titlePlane, titleMat);
  title.position.z = 0.026;
  cover.add(title);
  
  bookGroup.add(cover);
  bookGroup.position.set(0.5, -0.5, 0.5);
  bookGroup.rotation.set(0.1, 0.2, 0.3);
  
  return bookGroup;
}

export function createOwlFeathers(
  config: typeof MASCOT_CONFIGS['owl'],
  bodyRadius: number = 1
): THREE.Group {
  const feathersGroup = new THREE.Group();
  
  // Create layered feathers around body
  const layers = 4;
  const feathersPerLayer = 16;
  
  for (let layer = 0; layer < layers; layer++) {
    const layerRadius = bodyRadius + layer * 0.05;
    const layerY = -0.3 - layer * 0.15;
    
    for (let i = 0; i < feathersPerLayer; i++) {
      const angle = (i / feathersPerLayer) * Math.PI * 2;
      
      // Feather shape
      const featherShape = new THREE.Shape();
      featherShape.moveTo(0, 0);
      featherShape.quadraticCurveTo(0.1, 0.05, 0.15, 0);
      featherShape.quadraticCurveTo(0.1, -0.05, 0, -0.08);
      featherShape.quadraticCurveTo(-0.1, -0.05, -0.15, 0);
      featherShape.quadraticCurveTo(-0.1, 0.05, 0, 0);
      
      const featherGeo = new THREE.ShapeGeometry(featherShape);
      const featherMat = new THREE.MeshPhongMaterial({
        color: layer % 2 === 0 ? config.colors.primary : config.colors.secondary,
        emissive: config.colors.tertiary,
        emissiveIntensity: 0.05,
        side: THREE.DoubleSide
      });
      
      const feather = new THREE.Mesh(featherGeo, featherMat);
      
      // Position feather
      feather.position.set(
        Math.cos(angle) * layerRadius,
        layerY,
        Math.sin(angle) * layerRadius
      );
      
      // Rotate to face outward
      feather.lookAt(0, layerY, 0);
      feather.rotateX(Math.PI / 4);
      
      feathersGroup.add(feather);
    }
  }
  
  return feathersGroup;
}

