import { useLayoutEffect, useRef } from 'react';
import type { RefObject } from 'react';
import * as THREE from 'three';

type Source = {
  mesh: THREE.Mesh;
  visible: boolean;
  raycast: THREE.Mesh['raycast'];
};
type Batch = { mesh: THREE.InstancedMesh; sources: Source[] };

export function synchronizeCharacterInstances(owner: THREE.Group, batches: readonly Batch[], inverse: THREE.Matrix4, local: THREE.Matrix4) {
  if (batches.length === 0) return;
  // Floor visibility belongs to the actor hierarchy, including Studio mode.
  for (let ancestor: THREE.Object3D | null = owner; ancestor; ancestor = ancestor.parent) {
    if (!ancestor.visible) return;
  }
  owner.updateWorldMatrix(true, true);
  inverse.copy(owner.matrixWorld).invert();
  for (const batch of batches) {
    let count = 0;
    for (const source of batch.sources) {
      let visible = source.visible;
      // Source meshes themselves are hidden from rendering. Prop groups retain
      // their animation visibility, so cups, trays and tools appear normally.
      for (let parent = source.mesh.parent; visible && parent && parent !== owner; parent = parent.parent) {
        visible = parent.visible;
      }
      if (!visible) continue;
      local.multiplyMatrices(inverse, source.mesh.matrixWorld);
      batch.mesh.setMatrixAt(count++, local);
    }
    batch.mesh.count = count;
    batch.mesh.visible = count > 0;
    // InstancedMesh caches raycast bounds separately from rendering. Rebuild
    // them lazily on the next pointer hit after a pose or prop count changes.
    batch.mesh.boundingSphere = null;
    if (count > 0) batch.mesh.instanceMatrix.needsUpdate = true;
  }
}

/**
 * The procedural joints remain the animation source. Compatible opaque parts
 * share one draw while keeping their individual animated transforms and shape.
 * The owning rig calls synchronize after its animation, without another frame
 * subscription or a render-priority change.
 */
export function useAnimatedCharacterBatch(root: RefObject<THREE.Group | null>, shapeKey: string) {
  const batches = useRef<Batch[]>([]);
  const inverse = useRef(new THREE.Matrix4()), local = useRef(new THREE.Matrix4());

  function synchronize() {
    const owner = root.current;
    if (owner) synchronizeCharacterInstances(owner, batches.current, inverse.current, local.current);
  }

  useLayoutEffect(() => {
    const owner = root.current;
    if (!owner) return;
    const groups = new Map<string, THREE.Mesh[]>();
    owner.traverse(object => {
      if (!(object instanceof THREE.Mesh) || object instanceof THREE.InstancedMesh || Array.isArray(object.material)) return;
      // Transparent cheek and glass surfaces keep ordinary per-mesh ordering.
      if (object.material.transparent) return;
      const key = `${object.geometry.uuid}/${object.material.uuid}/${object.castShadow}/${object.receiveShadow}`;
      const group = groups.get(key) ?? [];
      group.push(object);
      groups.set(key, group);
    });
    const created: Batch[] = [];
    for (const meshes of groups.values()) {
      if (meshes.length < 2) continue;
      const first = meshes[0];
      const mesh = new THREE.InstancedMesh(first.geometry, first.material, meshes.length);
      mesh.name = 'animated-character-parts';
      mesh.castShadow = first.castShadow;
      mesh.receiveShadow = first.receiveShadow;
      mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      // Actor/floor visibility is managed above this small batch. Animated limbs
      // must never disappear because a cached instance bound became outdated.
      mesh.frustumCulled = false;
      const sources = meshes.map(source => ({ mesh: source, visible: source.visible, raycast: source.raycast }));
      for (const source of sources) {
        source.mesh.visible = false;
        source.mesh.raycast = () => undefined;
      }
      owner.add(mesh);
      created.push({ mesh, sources });
    }
    batches.current = created;
    synchronize();
    return () => {
      for (const batch of created) {
        for (const source of batch.sources) {
          source.mesh.visible = source.visible;
          source.mesh.raycast = source.raycast;
        }
        owner.remove(batch.mesh);
        // Only the instance buffer belongs to the batch. Geometry and materials
        // are shared by all office and Studio characters and stay alive.
        batch.mesh.dispose();
      }
      batches.current = [];
    };
  }, [root, shapeKey]);

  return synchronize;
}
