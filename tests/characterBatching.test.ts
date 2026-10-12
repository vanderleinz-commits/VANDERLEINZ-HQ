import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { synchronizeCharacterInstances } from '../src/AnimatedCharacterBatch.ts';

function fixture() {
  const root = new THREE.Group(), joint = new THREE.Group(), prop = new THREE.Group();
  const geometry = new THREE.BoxGeometry(.1, .1, .1), material = new THREE.MeshBasicMaterial();
  const parts = [new THREE.Mesh(geometry, material), new THREE.Mesh(geometry, material)];
  parts[0].visible = parts[1].visible = false;
  parts[0].raycast = parts[1].raycast = () => undefined;
  joint.add(parts[0]); prop.add(parts[1]); root.add(joint, prop);
  const mesh = new THREE.InstancedMesh(geometry, material, 2);
  root.add(mesh);
  const batch = { mesh, sources: parts.map(part => ({ mesh: part, visible: true, raycast: THREE.Mesh.prototype.raycast })) };
  const sync = () => synchronizeCharacterInstances(root, [batch], new THREE.Matrix4(), new THREE.Matrix4());
  const hitsAt = (x: number) => {
    root.updateWorldMatrix(true, true);
    return new THREE.Raycaster(new THREE.Vector3(x, 0, 2), new THREE.Vector3(0, 0, -1)).intersectObject(root, true);
  };
  return { root, joint, prop, mesh, sync, hitsAt };
}

test('animated instance bounds follow moving joints and clicks hit the visible batches only', () => {
  const rig = fixture();
  rig.prop.visible = false;
  rig.sync();
  assert.ok(rig.hitsAt(0).some(hit => hit.object === rig.mesh));
  assert.ok(rig.mesh.boundingSphere);
  rig.joint.position.x = 3;
  rig.sync();
  assert.equal(rig.mesh.boundingSphere, null);
  const hits = rig.hitsAt(3);
  assert.ok(hits.length > 0);
  assert.ok(hits.every(hit => hit.object === rig.mesh));
  assert.equal(rig.hitsAt(0).length, 0);
});

test('attached prop visibility compacts instance counts and refreshes their hit bounds', () => {
  const rig = fixture();
  rig.prop.position.x = 3;
  rig.prop.visible = false;
  rig.sync();
  assert.equal(rig.mesh.count, 1);
  assert.equal(rig.hitsAt(3).length, 0);
  rig.prop.visible = true;
  rig.sync();
  assert.equal(rig.mesh.count, 2);
  assert.ok(rig.hitsAt(3).some(hit => hit.object === rig.mesh));
  rig.prop.visible = false;
  rig.sync();
  assert.equal(rig.mesh.count, 1);
  assert.equal(rig.hitsAt(3).length, 0);
});
