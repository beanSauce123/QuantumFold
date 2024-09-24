import React, { useState, useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Component for each amino acid sphere
const AminoAcid = ({ position, targetPosition, color }) => {
  const ref = useRef();

  // Smooth animation using lerp (linear interpolation)
  useFrame(() => {
    ref.current.position.lerp(new THREE.Vector3(...targetPosition), 0.1); // Smooth transition to target position
  });

  return (
    <mesh ref={ref} position={position} castShadow receiveShadow>
      <sphereGeometry args={[0.2, 32, 32]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
    </mesh>
  );
};

// ProteinChain component rendering a chain of amino acids
const ProteinChain = ({ chain }) => (
  <group>
    {chain?.map((aminoAcid, index) => (
      <AminoAcid
        key={index}
        position={aminoAcid.position}
        targetPosition={aminoAcid.targetPosition}
        color={aminoAcid.color}
      />
    ))}
  </group>
);

// ProteinFolding component for displaying protein folding
const ProteinFolding = ({ foldingSteps, stepIndex, cameraPosition }) => (
  <Canvas shadows camera={{ position: cameraPosition, fov: 30 }}>
    <ambientLight intensity={0.5} />
    <spotLight
      position={[10, 10, 10]}
      angle={0.15}
      penumbra={1}
      castShadow
      shadow-mapSize-width={1024}
      shadow-mapSize-height={1024}
    />
    <pointLight position={[-10, -10, -10]} />
    {foldingSteps.length > 0 && (
      <ProteinChain chain={foldingSteps[stepIndex] || foldingSteps[0]} />
    )}
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -3, 0]} receiveShadow>
      <planeGeometry args={[100, 100]} />
      <shadowMaterial opacity={0.3} />
    </mesh>
  </Canvas>
);

// Function to create a simplified folded state for a section of insulin
const createInsulinFoldedState = (numAminoAcids) => {
  return Array(numAminoAcids).fill().map((_, i) => ({
    position: [i * 0.5, 0, 0], // Initial unfolded state (a line)
    targetPosition: [
      Math.sin(i * Math.PI / 5) * 1.5, // Helical shape in 3D
      Math.cos(i * Math.PI / 5) * 1.5,
      i * 0.2 // Slight vertical offset to give a helical look
    ],
    color: 'purple', // Target color
  }));
};

// Calculate how close the current positions are to the target
const calculateCorrectness = (currentChain, targetChain) => {
  const threshold = 0.2; // Distance threshold for being considered "correct"
  let correctCount = 0;

  currentChain?.forEach((aminoAcid, index) => {
    const distance = Math.sqrt(
      Math.pow(aminoAcid.targetPosition[0] - targetChain[index].targetPosition[0], 2) +
      Math.pow(aminoAcid.targetPosition[1] - targetChain[index].targetPosition[1], 2)
    );
    if (distance < threshold) correctCount += 1;
  });

  return (correctCount / currentChain.length) * 100; // Percentage correctness
};

// Quantum folding simulation with adjustable probability
const simulateQuantumFolding = (numAminoAcids, targetState, quantumProbability) => {
  const foldingSteps = [];
  const correctnessArray = [];
  const initialChain = Array(numAminoAcids).fill().map((_, i) => ({
    position: [i * 0.5, 0, 0],
    targetPosition: [i * 0.5, 0, 0], // Starts in the unfolded position
    color: 'skyblue',
  }));

  foldingSteps.push(initialChain);
  correctnessArray.push(calculateCorrectness(initialChain, targetState));

  // As the steps progress, increase the probability of reaching the target state
  for (let i = 0; i < 10; i++) {
    const chainCopy = JSON.parse(JSON.stringify(initialChain));
    const probabilityOfFoldingCorrectly = Math.min(1, i / 10) * quantumProbability; // Adjustable quantum probability

    chainCopy.forEach((aminoAcid, index) => {
      const isFoldedCorrectly = Math.random() < probabilityOfFoldingCorrectly; // Increase chance to fold correctly
      // Move toward the target state with increasing probability
      aminoAcid.targetPosition[0] = isFoldedCorrectly ? targetState[index].targetPosition[0] : Math.random() * 2 - 1;
      aminoAcid.targetPosition[1] = isFoldedCorrectly ? targetState[index].targetPosition[1] : Math.random() * 2 - 1;
      aminoAcid.color = isFoldedCorrectly ? 'green' : 'red'; // Green for success, red for not folded correctly
    });

    foldingSteps.push(chainCopy);
    correctnessArray.push(calculateCorrectness(chainCopy, targetState));
  }

  return { foldingSteps, correctnessArray };
};

// Classical brute-force simulation
const simulateClassicalFolding = (numAminoAcids, targetState) => {
  const foldingSteps = [];
  const correctnessArray = [];
  const initialChain = Array(numAminoAcids).fill().map((_, i) => ({
    position: [i * 0.5, 0, 0],
    targetPosition: [i * 0.5, 0, 0],
    color: 'blue',
  }));

  foldingSteps.push(initialChain);
  correctnessArray.push(calculateCorrectness(initialChain, targetState));

  for (let i = 0; i < 5; i++) {
    const chainCopy = JSON.parse(JSON.stringify(initialChain));
    chainCopy.forEach((aminoAcid, index) => {
      aminoAcid.targetPosition[1] = Math.sin(index + i);
      aminoAcid.color = 'orange'; // Classical color
    });

    foldingSteps.push(chainCopy);
    correctnessArray.push(calculateCorrectness(chainCopy, targetState));
  }

  return { foldingSteps, correctnessArray };
};

// Main App component with quantum probability slider
function App() {
  const [quantumFoldingSteps, setQuantumFoldingSteps] = useState([]);
  const [classicalFoldingSteps, setClassicalFoldingSteps] = useState([]);
  const [targetFolding, setTargetFolding] = useState([]);
  const [quantumCorrectness, setQuantumCorrectness] = useState([]);
  const [classicalCorrectness, setClassicalCorrectness] = useState([]);
  const [stepIndex, setStepIndex] = useState(0);

  // Interactivity state for quantum folding probability
  const [quantumProbability, setQuantumProbability] = useState(1); // Quantum folding probability

  useEffect(() => {
    const targetState = createInsulinFoldedState(10); // Simplified insulin section with 10 amino acids
    const quantumResult = simulateQuantumFolding(10, targetState, quantumProbability); // Quantum folding
    const classicalResult = simulateClassicalFolding(10, targetState); // Classical folding

    setQuantumFoldingSteps(quantumResult.foldingSteps);
    setClassicalFoldingSteps(classicalResult.foldingSteps);
    setTargetFolding(targetState);
    setQuantumCorrectness(quantumResult.correctnessArray);
    setClassicalCorrectness(classicalResult.correctnessArray);

    const interval = setInterval(() => {
      setStepIndex((prev) => (prev + 1) % quantumResult.foldingSteps.length);
    }, 1000);

    return () => clearInterval(interval);
  }, [quantumProbability]);

  return (
    <div className="App">
      <h1>Protein Folding: Quantum vs Classical (Insulin Section)</h1>
      
      {/* Explanation Section */}
      <div className="explanation">
        <h2>Simulation Context</h2>
        <p>
          This simulation demonstrates the utility of quantum computing in solving the protein folding problem.
          We are simulating the folding of a simplified model of the insulin protein.
        
          You can adjust the quantum probability slider to control the efficiency 
          of the quantum folding process. Higher probabilities represent more optimized quantum folding, while lower 
          probabilities reduce the quantum algorithm's effectiveness. The colors of the amino acids represent their folding success - green means that the amino acid is folded correctly according to the target state and red means that the amino acid is far from the target state.
As the quantum probability increases, more amino acids will turn green, indicating more correct folding as the quantum algorithm approaches the optimal configuration. You can observe the differences in folding accuracy 
          between the quantum and classical approaches as they try to reach the target folded state.
        </p>
      </div>

      {/* Quantum probability control */}
      <div>
        <label>
          Quantum Probability: {quantumProbability.toFixed(2)}
          <input
            type="range"
            min="0.1"
            max="1"
            step="0.1"
            value={quantumProbability}
            onChange={(e) => setQuantumProbability(Number(e.target.value))}
          />
        </label>
      </div>

      <div className="visualization">
        <h2>Quantum Folding</h2>
        <p>Correctness: {quantumCorrectness[stepIndex]?.toFixed(2)}%</p>
        {quantumFoldingSteps.length > 0 && (
          <ProteinFolding foldingSteps={quantumFoldingSteps} stepIndex={stepIndex} cameraPosition={[0, 0, 8]} />
        )}

        <h2>Classical Folding</h2>
        <p>Correctness: {classicalCorrectness[stepIndex]?.toFixed(2)}%</p>
        {classicalFoldingSteps.length > 0 && (
          <ProteinFolding foldingSteps={classicalFoldingSteps} stepIndex={stepIndex} cameraPosition={[0, 0, 8]} />
        )}

        <h2>Target Folded State (Simplified Insulin Section)</h2>
        {targetFolding.length > 0 && (
          <ProteinFolding foldingSteps={[targetFolding]} stepIndex={0} cameraPosition={[0, 0, 8]} />
        )}
      </div>
    </div>
  );
}

export default App;
