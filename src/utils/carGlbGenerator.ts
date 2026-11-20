/**
 * Generates a self-contained glTF 2.0 binary (.glb) sports coupe model in memory.
 * Coordinate system (glTF standard): +Y Up, -Z Forward (North when heading=0), +X Right.
 */

interface MeshPart {
  positions: number[];
  normals: number[];
  indices: number[];
  materialIndex: number;
}

function createTaperedBox(
  minX: number,
  maxX: number,
  minY: number,
  maxY: number,
  minZ: number,
  maxZ: number,
  topScaleX = 1,
  topScaleZ = 1,
  topOffsetZ = 0
): {positions: number[]; normals: number[]; indices: number[]} {
  const cx = (minX + maxX) / 2;
  const cz = (minZ + maxZ) / 2;
  const halfTopX = ((maxX - minX) / 2) * topScaleX;
  const halfTopZ = ((maxZ - minZ) / 2) * topScaleZ;

  // Bottom 4 corners (y = minY)
  const b0: [number, number, number] = [minX, minY, minZ]; // front-left
  const b1: [number, number, number] = [maxX, minY, minZ]; // front-right
  const b2: [number, number, number] = [maxX, minY, maxZ]; // rear-right
  const b3: [number, number, number] = [minX, minY, maxZ]; // rear-left

  // Top 4 corners (y = maxY)
  const t0: [number, number, number] = [cx - halfTopX, maxY, cz - halfTopZ + topOffsetZ];
  const t1: [number, number, number] = [cx + halfTopX, maxY, cz - halfTopZ + topOffsetZ];
  const t2: [number, number, number] = [cx + halfTopX, maxY, cz + halfTopZ + topOffsetZ];
  const t3: [number, number, number] = [cx - halfTopX, maxY, cz + halfTopZ + topOffsetZ];

  const faces: Array<[
    [number, number, number],
    [number, number, number],
    [number, number, number],
    [number, number, number],
  ]> = [
    [t0, t3, t2, t1], // Top
    [b0, b1, b2, b3], // Bottom
    [b0, t0, t1, b1], // Front (-Z)
    [b2, t2, t3, b3], // Rear (+Z)
    [b3, t3, t0, b0], // Left (-X)
    [b1, t1, t2, b2], // Right (+X)
  ];

  const positions: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];

  faces.forEach((quad, faceIdx) => {
    const [p0, p1, p2, p3] = quad;
    // Compute outward face normal from (p1 - p0) x (p2 - p0)
    const ux = p1[0] - p0[0];
    const uy = p1[1] - p0[1];
    const uz = p1[2] - p0[2];
    const vx = p2[0] - p0[0];
    const vy = p2[1] - p0[1];
    const vz = p2[2] - p0[2];
    let nx = uy * vz - uz * vy;
    let ny = uz * vx - ux * vz;
    let nz = ux * vy - uy * vx;
    const len = Math.hypot(nx, ny, nz) || 1;
    nx /= len;
    ny /= len;
    nz /= len;

    const base = faceIdx * 4;
    for (const p of quad) {
      positions.push(p[0], p[1], p[2]);
      normals.push(nx, ny, nz);
    }
    indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
  });

  return {positions, normals, indices};
}

function appendPart(
  parts: MeshPart[],
  geom: {positions: number[]; normals: number[]; indices: number[]},
  materialIndex: number
) {
  parts.push({...geom, materialIndex});
}

function buildSportsCarParts(): MeshPart[] {
  const parts: MeshPart[] = [];
  // Material 0: Metallic GT Amber Paint
  // Material 1: Smoked Canopy Glass
  // Material 2: Matte Charcoal Trim / Wheels / Diffuser
  // Material 3: Warm White Headlights (Emissive)
  // Material 4: Crimson Taillight Bar (Emissive)

  // Lower main chassis
  appendPart(parts, createTaperedBox(-0.96, 0.96, 0.22, 0.72, -2.25, 2.22, 0.95, 0.97, 0.02), 0);
  // Sculpted front hood wedge
  appendPart(parts, createTaperedBox(-0.88, 0.88, 0.68, 0.84, -2.18, -0.58, 0.92, 0.94, 0.08), 0);
  // Rear haunches / deck
  appendPart(parts, createTaperedBox(-0.92, 0.92, 0.7, 0.88, 0.62, 2.16, 0.9, 0.95, -0.05), 0);

  // Smoked fastback cabin & windshield
  appendPart(parts, createTaperedBox(-0.76, 0.76, 0.78, 1.32, -0.78, 1.18, 0.78, 0.66, 0.14), 1);

  // Underbody / side skirts / front splitter / rear diffuser
  appendPart(parts, createTaperedBox(-0.99, 0.99, 0.14, 0.24, -2.3, 2.26, 0.98, 0.99, 0), 2);

  // Rear GT spoiler struts & wing
  appendPart(parts, createTaperedBox(-0.56, -0.46, 0.86, 1.06, 1.88, 2.08), 2);
  appendPart(parts, createTaperedBox(0.46, 0.56, 0.86, 1.06, 1.88, 2.08), 2);
  appendPart(parts, createTaperedBox(-0.92, 0.92, 1.04, 1.11, 1.82, 2.14, 0.98, 0.96, 0.02), 2);

  // 4 Wheels
  const wheelZPositions = [-1.42, 1.38];
  const wheelXPositions: Array<[number, number]> = [
    [-1.02, -0.74],
    [0.74, 1.02],
  ];
  for (const z of wheelZPositions) {
    for (const [xMin, xMax] of wheelXPositions) {
      appendPart(parts, createTaperedBox(xMin, xMax, 0.0, 0.64, z - 0.34, z + 0.34, 1, 0.82, 0), 2);
    }
  }

  // Front LED headlights
  appendPart(parts, createTaperedBox(-0.84, -0.44, 0.52, 0.66, -2.28, -2.18), 3);
  appendPart(parts, createTaperedBox(0.44, 0.84, 0.52, 0.66, -2.28, -2.18), 3);

  // Rear full-width LED taillight bar
  appendPart(parts, createTaperedBox(-0.82, 0.82, 0.62, 0.74, 2.18, 2.26), 4);

  return parts;
}

function padTo4Bytes(length: number): number {
  return (4 - (length % 4)) % 4;
}

export function createCarGlbUrl(): string {
  const parts = buildSportsCarParts();

  // Merge parts grouped by materialIndex into 5 primitives
  const byMaterial = new Map<number, {positions: number[]; normals: number[]; indices: number[]}>();
  for (const part of parts) {
    let group = byMaterial.get(part.materialIndex);
    if (!group) {
      group = {positions: [], normals: [], indices: []};
      byMaterial.set(part.materialIndex, group);
    }
    const vertexOffset = group.positions.length / 3;
    group.positions.push(...part.positions);
    group.normals.push(...part.normals);
    for (const idx of part.indices) {
      group.indices.push(idx + vertexOffset);
    }
  }

  const bufferViews: Array<{buffer: number; byteOffset: number; byteLength: number; target: number}> = [];
  const accessors: Array<Record<string, unknown>> = [];
  const primitives: Array<Record<string, unknown>> = [];
  const binaryChunks: Uint8Array[] = [];
  let currentOffset = 0;

  const sortedMats = Array.from(byMaterial.keys()).sort((a, b) => a - b);

  for (const matIdx of sortedMats) {
    const group = byMaterial.get(matIdx)!;
    const posArray = new Float32Array(group.positions);
    const normArray = new Float32Array(group.normals);
    const idxArray = new Uint16Array(group.indices);

    // Compute min/max for POSITION accessor (required by glTF 2.0 spec)
    const minPos = [Infinity, Infinity, Infinity];
    const maxPos = [-Infinity, -Infinity, -Infinity];
    for (let i = 0; i < posArray.length; i += 3) {
      for (let k = 0; k < 3; k++) {
        if (posArray[i + k] < minPos[k]) minPos[k] = posArray[i + k];
        if (posArray[i + k] > maxPos[k]) maxPos[k] = posArray[i + k];
      }
    }

    // 1. POSITION bufferView & accessor
    const posBytes = new Uint8Array(posArray.buffer);
    const posViewIdx = bufferViews.length;
    bufferViews.push({
      buffer: 0,
      byteOffset: currentOffset,
      byteLength: posBytes.byteLength,
      target: 34962, // ARRAY_BUFFER
    });
    binaryChunks.push(posBytes);
    currentOffset += posBytes.byteLength;

    const posAccessorIdx = accessors.length;
    accessors.push({
      bufferView: posViewIdx,
      componentType: 5126, // FLOAT
      count: posArray.length / 3,
      type: 'VEC3',
      min: minPos,
      max: maxPos,
    });

    // 2. NORMAL bufferView & accessor
    const normBytes = new Uint8Array(normArray.buffer);
    const normViewIdx = bufferViews.length;
    bufferViews.push({
      buffer: 0,
      byteOffset: currentOffset,
      byteLength: normBytes.byteLength,
      target: 34962,
    });
    binaryChunks.push(normBytes);
    currentOffset += normBytes.byteLength;

    const normAccessorIdx = accessors.length;
    accessors.push({
      bufferView: normViewIdx,
      componentType: 5126,
      count: normArray.length / 3,
      type: 'VEC3',
    });

    // 3. INDICES bufferView & accessor (pad to 4-byte alignment afterwards)
    const idxBytes = new Uint8Array(idxArray.buffer);
    const idxViewIdx = bufferViews.length;
    bufferViews.push({
      buffer: 0,
      byteOffset: currentOffset,
      byteLength: idxBytes.byteLength,
      target: 34963, // ELEMENT_ARRAY_BUFFER
    });
    binaryChunks.push(idxBytes);
    currentOffset += idxBytes.byteLength;

    const idxPad = padTo4Bytes(idxBytes.byteLength);
    if (idxPad > 0) {
      binaryChunks.push(new Uint8Array(idxPad));
      currentOffset += idxPad;
    }

    const idxAccessorIdx = accessors.length;
    accessors.push({
      bufferView: idxViewIdx,
      componentType: 5123, // UNSIGNED_SHORT
      count: idxArray.length,
      type: 'SCALAR',
    });

    primitives.push({
      attributes: {
        POSITION: posAccessorIdx,
        NORMAL: normAccessorIdx,
      },
      indices: idxAccessorIdx,
      material: matIdx,
    });
  }

  const gltfJson = {
    asset: {version: '2.0', generator: 'WORLD//DRIVE Procedural GLB'},
    scene: 0,
    scenes: [{nodes: [0]}],
    nodes: [{mesh: 0, name: 'WorldDriveCoupe'}],
    meshes: [{primitives}],
    materials: [
      {
        name: 'GTAmberBody',
        pbrMetallicRoughness: {
          baseColorFactor: [0.96, 0.62, 0.07, 1.0],
          metallicFactor: 0.72,
          roughnessFactor: 0.24,
        },
      },
      {
        name: 'SmokedCanopy',
        pbrMetallicRoughness: {
          baseColorFactor: [0.05, 0.07, 0.1, 1.0],
          metallicFactor: 0.9,
          roughnessFactor: 0.12,
        },
      },
      {
        name: 'CharcoalTrim',
        pbrMetallicRoughness: {
          baseColorFactor: [0.09, 0.1, 0.12, 1.0],
          metallicFactor: 0.18,
          roughnessFactor: 0.72,
        },
      },
      {
        name: 'Headlights',
        pbrMetallicRoughness: {
          baseColorFactor: [1.0, 0.97, 0.88, 1.0],
          metallicFactor: 0.1,
          roughnessFactor: 0.2,
        },
        emissiveFactor: [1.0, 0.95, 0.82],
      },
      {
        name: 'TaillightBar',
        pbrMetallicRoughness: {
          baseColorFactor: [0.95, 0.1, 0.08, 1.0],
          metallicFactor: 0.1,
          roughnessFactor: 0.2,
        },
        emissiveFactor: [1.0, 0.12, 0.08],
      },
    ],
    buffers: [{byteLength: currentOffset}],
    bufferViews,
    accessors,
  };

  const jsonEncoder = new TextEncoder();
  const rawJsonBytes = jsonEncoder.encode(JSON.stringify(gltfJson));
  const jsonPad = padTo4Bytes(rawJsonBytes.byteLength);
  const jsonChunkLength = rawJsonBytes.byteLength + jsonPad;
  const binChunkLength = currentOffset;
  const totalLength = 12 + 8 + jsonChunkLength + 8 + binChunkLength;

  const glbBuffer = new ArrayBuffer(totalLength);
  const view = new DataView(glbBuffer);
  const bytes = new Uint8Array(glbBuffer);

  // Header
  view.setUint32(0, 0x46546c67, true); // 'glTF'
  view.setUint32(4, 2, true); // version 2
  view.setUint32(8, totalLength, true);

  // JSON chunk header
  view.setUint32(12, jsonChunkLength, true);
  view.setUint32(16, 0x4e4f534a, true); // 'JSON'
  bytes.set(rawJsonBytes, 20);
  for (let i = 0; i < jsonPad; i++) {
    bytes[20 + rawJsonBytes.byteLength + i] = 0x20; // space padding
  }

  // BIN chunk header
  const binHeaderOffset = 20 + jsonChunkLength;
  view.setUint32(binHeaderOffset, binChunkLength, true);
  view.setUint32(binHeaderOffset + 4, 0x004e4942, true); // 'BIN\0'

  let writeOffset = binHeaderOffset + 8;
  for (const chunk of binaryChunks) {
    bytes.set(chunk, writeOffset);
    writeOffset += chunk.byteLength;
  }

  const blob = new Blob([glbBuffer], {type: 'model/gltf-binary'});
  return URL.createObjectURL(blob);
}
