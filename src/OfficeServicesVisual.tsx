import type { Simulation } from './simulation';
import type { FloorView } from './BuildingShell';
import { floorOf } from './navigation';
import { CATERING_COUNTER_POINT, FLOOR_SURFACE_HEIGHT, pantryDrinkPoint } from './officeLayout';
import { PALETTE } from './artDirection';

/** Cups appear only after the catering staff has completed a physical delivery. */
export function OfficeServicesVisual({simulation,floorView}:{simulation:Simulation;floorView:FloorView}) {
  return <group>
    {simulation.services.drinks.filter(drink=>floorView==='all'||floorOf(drink.position)===floorView).map((drink,index)=><group key={index} position={[drink.position[0],(drink.position[2]??0)+FLOOR_SURFACE_HEIGHT,drink.position[1]]}>
      <mesh position={[0,.014,0]} receiveShadow><cylinderGeometry args={[.14,.13,.025,16]} /><meshStandardMaterial color={PALETTE.cloud} roughness={.8} /></mesh>
      <mesh position={[0,.075,0]} castShadow><cylinderGeometry args={[.083,.066,.12,16]} /><meshStandardMaterial color={PALETTE.cream} roughness={.72} /></mesh>
      <mesh position={[0,.138,0]}><cylinderGeometry args={[.071,.071,.004,16]} /><meshStandardMaterial color="#6B4935" roughness={.83} /></mesh>
      <mesh position={[.086,.082,0]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[.041,.013,6,12]} /><meshStandardMaterial color={PALETTE.cream} roughness={.72} /></mesh>
    </group>)}
    {simulation.services.coffee?.phase==='prepare'&&floorView!==1&&<group position={[pantryDrinkPoint[0],FLOOR_SURFACE_HEIGHT+.99,pantryDrinkPoint[1]-.64]}>
      <mesh position={[0,.061,0]} castShadow><cylinderGeometry args={[.066,.052,.12,12]} /><meshStandardMaterial color={PALETTE.cream} roughness={.72} /></mesh>
      <mesh position={[0,.121,0]}><cylinderGeometry args={[.054,.054,.005,12]} /><meshStandardMaterial color="#6B4935" roughness={.83} /></mesh>
    </group>}
    {simulation.services.catering.phase==='ready'&&floorView!==1&&<group position={[CATERING_COUNTER_POINT[0],(CATERING_COUNTER_POINT[2]??0)+FLOOR_SURFACE_HEIGHT+1.02,CATERING_COUNTER_POINT[1]]}>
      {[-.28,.28].map((x,index)=><group key={x} position={[x,0,0]}>
        <mesh position={[0,.045,0]} castShadow><boxGeometry args={[.44,.08,.3]} /><meshStandardMaterial color={PALETTE.cloud} roughness={.75} /></mesh>
        <mesh position={[0,.095,0]}><boxGeometry args={[.38,.026,.24]} /><meshStandardMaterial color={index?'#C8A16F':'#839F72'} roughness={.92} /></mesh>
        {[-.1,0,.1].map(z=><mesh key={z} position={[z,.116,0]}><sphereGeometry args={[.045,8,6]} /><meshStandardMaterial color={index?'#DAAE6A':'#BC854D'} roughness={.9} /></mesh>)}
      </group>)}
      <mesh position={[0,.025,.27]}><cylinderGeometry args={[.12,.12,.04,12]} /><meshStandardMaterial color={PALETTE.cloud} roughness={.8} /></mesh>
    </group>}
  </group>;
}
