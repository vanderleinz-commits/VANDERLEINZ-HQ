import { useLayoutEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

type Candidate = { mesh: THREE.Mesh; geometry: THREE.BufferGeometry };
type Bucket = { material: THREE.Material; castShadow: boolean; receiveShadow: boolean; candidates: Candidate[] };
const noRaycast: THREE.Mesh['raycast'] = () => {};

/** Bake authored static furniture once; animated screens and doors stay outside. */
export function StaticFurnitureBatch({ children }: { children: ReactNode }) {
  const source = useRef<THREE.Group>(null), output = useRef<THREE.Group>(null);
  const { scene } = useThree();
  useLayoutEffect(() => {
    if (!source.current || !output.current) return;
    const original = source.current, destination = output.current;
    scene.updateMatrixWorld(true);
    const inverse = destination.matrixWorld.clone().invert();
    const buckets = new Map<string, Bucket>(), temporary: THREE.BufferGeometry[] = [];
    const owned: THREE.BufferGeometry[] = [], proxies: THREE.Mesh[] = [];
    const originals: { mesh: THREE.Mesh; raycast: THREE.Mesh['raycast'] }[] = [];
    let unsupported = false;
    original.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) {
        if (object instanceof THREE.Sprite || object instanceof THREE.Line || object instanceof THREE.Points) unsupported = true;
        return;
      }
      if (object instanceof THREE.SkinnedMesh || object instanceof THREE.InstancedMesh || Array.isArray(object.material) || Object.keys(object.geometry.morphAttributes).length) { unsupported = true; return; }
      // Material identity protects canvas signs and every authored shader setting.
      const key = `${object.material.uuid}:${Number(object.castShadow)}:${Number(object.receiveShadow)}${object.material.transparent ? `:${object.uuid}` : ''}`;
      if (!buckets.has(key)) buckets.set(key, { material: object.material, castShadow: object.castShadow, receiveShadow: object.receiveShadow, candidates: [] });
      const geometry = object.geometry.index ? object.geometry.toNonIndexed() : object.geometry.clone();
      geometry.clearGroups();
      geometry.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inverse, object.matrixWorld));
      temporary.push(geometry);
      buckets.get(key)!.candidates.push({ mesh: object, geometry });
    });
    if (unsupported) { temporary.forEach((geometry) => geometry.dispose()); return; }
    try {
      for (const bucket of buckets.values()) {
        // Attribute signatures prevent unrelated geometry layouts from being merged.
        const compatible = new Map<string, Candidate[]>();
        for (const candidate of bucket.candidates) {
          const signature = Object.keys(candidate.geometry.attributes).sort().map((name) => {
            const attribute = candidate.geometry.getAttribute(name);
            return `${name}:${attribute.itemSize}:${attribute.normalized}:${attribute.array.constructor.name}`;
          }).join('|');
          if (!compatible.has(signature)) compatible.set(signature, []);
          compatible.get(signature)!.push(candidate);
        }
        for (const candidates of compatible.values()) {
          const geometry = candidates.length === 1 ? candidates[0].geometry.clone() : mergeGeometries(candidates.map((candidate) => candidate.geometry), false);
          if (!geometry) throw new Error('Static furniture geometry is incompatible.');
          geometry.computeBoundingBox(); geometry.computeBoundingSphere();
          owned.push(geometry);
          const mesh = new THREE.Mesh(geometry, bucket.material);
          mesh.castShadow = bucket.castShadow; mesh.receiveShadow = bucket.receiveShadow;
          mesh.name = 'Static furniture';
          proxies.push(mesh);
        }
      }
      destination.add(...proxies);
      destination.updateMatrixWorld(true);
      original.traverse((object) => { if (object instanceof THREE.Mesh) { originals.push({ mesh: object, raycast: object.raycast }); object.raycast = noRaycast; } });
      original.visible = false;
      destination.userData.staticFurniture = { originalMeshes: originals.length, renderMeshes: proxies.length };
    } catch {
      // An unsupported asset leaves the original furniture fully usable.
      destination.remove(...proxies);
      originals.forEach(({ mesh, raycast }) => { mesh.raycast = raycast; }); originals.length = 0;
      original.visible = true;
      owned.forEach((geometry) => geometry.dispose()); owned.length = 0;
    } finally { temporary.forEach((geometry) => geometry.dispose()); }
    return () => {
      originals.forEach(({ mesh, raycast }) => { mesh.raycast = raycast; });
      original.visible = true;
      destination.remove(...proxies);
      owned.forEach((geometry) => geometry.dispose());
      delete destination.userData.staticFurniture;
    };
  }, [scene]);
  return <group userData={{ cameraObstacle: true }}>
    <group ref={source}>{children}</group>
    <group ref={output} dispose={null} />
  </group>;
}
