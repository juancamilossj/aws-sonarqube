import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Sparkles,
  Compass,
  Rotate3d,
  Layers,
  Eye,
  Activity
} from 'lucide-react';
import { neuralAudio } from '../utils/AudioPlayer';

export default function NeuralCanvas3D({
  nodes = [],
  selectedNode,
  onSelectNode,
  role = 'student', // 'student' | 'teacher'
  highlightCluster = 'all',
  searchQuery = '',
  onNodePositionChange
}) {
  const mountRef = useRef(null);

  // Three.js Core Refs
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const controlsRef = useRef(null);
  const animFrameIdRef = useRef(null);

  // Node Object Mappings
  const nodeMeshesRef = useRef(new Map()); // id -> THREE.Group
  const synapseLinesRef = useRef([]); // array of line objects with curves
  const pulseParticlesRef = useRef([]); // traveling 3D sparks
  const starFieldRef = useRef(null);

  // Interaction State
  const isDraggingNodeRef = useRef(false);
  const draggedNodeIdRef = useRef(null);
  const dragPlaneRef = useRef(new THREE.Plane());
  const dragPlaneIntersectRef = useRef(new THREE.Vector3());
  const pointerDownPosRef = useRef({ x: 0, y: 0 });
  const hoveredNodeIdRef = useRef(null);

  // Auto-rotation toggle state
  const [autoRotate, setAutoRotate] = useState(false);
  const autoRotateRef = useRef(false);
  autoRotateRef.current = autoRotate;

  // Helper to create high-resolution 3D Billboard Sprite text
  const createLabelSprite = (node, role) => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 160;
    const ctx = canvas.getContext('2d');

    // Transparent Background with Glass Badge
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const boxW = 460;
    const boxH = 120;
    const x = (canvas.width - boxW) / 2;
    const y = 20;

    let primaryColor = node.clusterColor || '#00f2fe';
    if (node.status === 'locked') primaryColor = '#64748b';
    if (node.status === 'mastered') primaryColor = '#00f2fe';
    if (role === 'teacher' && node.cohortStats?.isBottleneck) primaryColor = '#ef4444';

    // Rounded Box
    ctx.fillStyle = 'rgba(7, 9, 19, 0.88)';
    ctx.strokeStyle = primaryColor;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect(x, y, boxW, boxH, 20);
    ctx.fill();
    ctx.stroke();

    // Node Title
    ctx.font = 'bold 32px "Rajdhani", sans-serif';
    ctx.fillStyle = '#f8fafc';
    ctx.textAlign = 'center';
    ctx.fillText(node.title, canvas.width / 2, y + 48);

    // Sub-badge (Cluster & Status)
    ctx.font = 'bold 22px "Space Grotesk", monospace';
    if (role === 'teacher' && node.cohortStats?.isBottleneck) {
      ctx.fillStyle = '#ef4444';
      ctx.fillText(`⚠ REZAGO: ${Math.round((node.cohortStats.studentsStruggling / node.cohortStats.totalStudents) * 100)}% COHORTE`, canvas.width / 2, y + 92);
    } else {
      const statusText =
        node.status === 'mastered' ? '✓ DOMINADO' :
        node.status === 'locked' ? '🔒 BLOQUEADO' :
        `${node.masteryScore}% ACTIVO`;

      ctx.fillStyle = primaryColor;
      ctx.fillText(`${node.cluster.split('&')[0].trim()} | ${statusText}`, canvas.width / 2, y + 92);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    const spriteMaterial = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthWrite: false
    });

    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(65, 20, 1);
    sprite.position.set(0, 24, 0); // Positioned above the node sphere
    return sprite;
  };

  // Build or Rebuild the entire 3D Scene
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.fog = new THREE.FogExp2(0x070913, 0.0007);

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(55, width / height, 1, 4000);
    camera.position.set(0, 150, 600);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.maxDistance = 1400;
    controls.minDistance = 120;
    controls.target.set(0, 0, 0);
    controlsRef.current = controls;

    // 5. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0x00f2fe, 1.2);
    dirLight1.position.set(300, 400, 300);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xa855f7, 1.2);
    dirLight2.position.set(-300, -300, -200);
    scene.add(dirLight2);

    const centerPointLight = new THREE.PointLight(0xffffff, 1.5, 800);
    centerPointLight.position.set(0, 0, 0);
    scene.add(centerPointLight);

    // 6. Deep Space 3D Starfield
    const starCount = 1400;
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      starPos[i * 3] = (Math.random() - 0.5) * 2600;
      starPos[i * 3 + 1] = (Math.random() - 0.5) * 2600;
      starPos[i * 3 + 2] = (Math.random() - 0.5) * 2600;

      const col = Math.random() > 0.5 ? new THREE.Color('#00f2fe') : new THREE.Color('#a855f7');
      starColors[i * 3] = col.r;
      starColors[i * 3 + 1] = col.g;
      starColors[i * 3 + 2] = col.b;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

    const starMat = new THREE.PointsMaterial({
      size: 3.5,
      vertexColors: true,
      transparent: true,
      opacity: 0.7,
      depthWrite: false
    });
    const starMesh = new THREE.Points(starGeo, starMat);
    scene.add(starMesh);
    starFieldRef.current = starMesh;

    // 7. Node Meshes Group
    const nodeMeshes = new Map();
    const sphereGeo = new THREE.SphereGeometry(14, 32, 32);
    const outerShellGeo = new THREE.IcosahedronGeometry(19, 1);
    const ringGeo = new THREE.TorusGeometry(23, 0.8, 16, 64);

    nodes.forEach(node => {
      const nodeGroup = new THREE.Group();
      nodeGroup.position.set(node.x || 0, node.y || 0, node.z || 0);
      nodeGroup.userData = { nodeId: node.id, nodeData: node };

      let colHex = node.clusterColor || '#00f2fe';
      if (node.status === 'locked') colHex = '#475569';
      if (node.status === 'mastered') colHex = '#00f2fe';
      if (role === 'teacher' && node.cohortStats?.isBottleneck) colHex = '#f59e0b';
      const threeColor = new THREE.Color(colHex);

      // Core Soma Sphere
      const coreMat = new THREE.MeshStandardMaterial({
        color: threeColor,
        emissive: threeColor,
        emissiveIntensity: node.status === 'mastered' ? 0.85 : 0.45,
        roughness: 0.25,
        metalness: 0.8
      });
      const coreMesh = new THREE.Mesh(sphereGeo, coreMat);
      coreMesh.name = 'core';
      nodeGroup.add(coreMesh);

      // Outer Holographic Wireframe Shell
      const shellMat = new THREE.MeshBasicMaterial({
        color: threeColor,
        wireframe: true,
        transparent: true,
        opacity: 0.4
      });
      const shellMesh = new THREE.Mesh(outerShellGeo, shellMat);
      shellMesh.name = 'shell';
      nodeGroup.add(shellMesh);

      // Orbiting Sci-Fi Ring
      const ringMat = new THREE.MeshBasicMaterial({
        color: threeColor,
        transparent: true,
        opacity: 0.6,
        side: THREE.DoubleSide
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.rotation.x = Math.PI / 3;
      ringMesh.name = 'ring';
      nodeGroup.add(ringMesh);

      // Bottleneck Critical Alert Ring in Teacher Mode
      if (role === 'teacher' && node.cohortStats?.isBottleneck) {
        const alertRingGeo = new THREE.TorusGeometry(28, 1.2, 16, 48);
        const alertRingMat = new THREE.MeshBasicMaterial({
          color: 0xef4444,
          transparent: true,
          opacity: 0.85
        });
        const alertRingMesh = new THREE.Mesh(alertRingGeo, alertRingMat);
        alertRingMesh.rotation.x = Math.PI / 2;
        alertRingMesh.name = 'alertRing';
        nodeGroup.add(alertRingMesh);
      }

      // Billboard Text Label
      const labelSprite = createLabelSprite(node, role);
      labelSprite.name = 'label';
      nodeGroup.add(labelSprite);

      scene.add(nodeGroup);
      nodeMeshes.set(node.id, nodeGroup);
    });
    nodeMeshesRef.current = nodeMeshes;

    // 8. 3D Synapses (Curves and Lines)
    const nodeMap = new Map(nodes.map(n => [n.id, n]));
    const synapseLines = [];

    nodes.forEach(source => {
      const sGroup = nodeMeshes.get(source.id);
      if (!sGroup) return;

      // Regular Synapses
      (source.synapses || []).forEach(targetId => {
        const target = nodeMap.get(targetId);
        const tGroup = nodeMeshes.get(targetId);
        if (!target || !tGroup) return;

        // Generate CatmullRomCurve3
        const curve = createSynapseCurve(sGroup.position, tGroup.position, 0.15);
        const points = curve.getPoints(40);
        const lineGeo = new THREE.BufferGeometry().setFromPoints(points);

        const isMastered = source.status === 'mastered';
        const lineCol = isMastered ? 0x00f2fe : 0x8b5cf6;
        const lineMat = new THREE.LineBasicMaterial({
          color: lineCol,
          transparent: true,
          opacity: isMastered ? 0.65 : 0.35,
          linewidth: 2
        });

        const line = new THREE.Line(lineGeo, lineMat);
        scene.add(line);

        synapseLines.push({
          sourceId: source.id,
          targetId: target.id,
          line,
          curve,
          isInterdisciplinary: false,
          color: lineCol
        });
      });

      // Interdisciplinary Bridges (Dashed Golden Curved Lines)
      (source.interdisciplinaryBridges || []).forEach(bridge => {
        const target = nodeMap.get(bridge.targetId);
        const tGroup = nodeMeshes.get(bridge.targetId);
        if (!target || !tGroup) return;

        const curve = createSynapseCurve(sGroup.position, tGroup.position, 0.35); // higher 3D arc
        const points = curve.getPoints(50);
        const lineGeo = new THREE.BufferGeometry().setFromPoints(points);

        const lineMat = new THREE.LineDashedMaterial({
          color: 0xf59e0b,
          dashSize: 8,
          gapSize: 4,
          transparent: true,
          opacity: 0.75
        });

        const line = new THREE.Line(lineGeo, lineMat);
        line.computeLineDistances();
        scene.add(line);

        synapseLines.push({
          sourceId: source.id,
          targetId: target.id,
          line,
          curve,
          isInterdisciplinary: true,
          color: 0xf59e0b
        });
      });
    });
    synapseLinesRef.current = synapseLines;

    // 9. Resize Listener
    const handleResize = () => {
      if (!container || !camera || !renderer) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // 10. Animation Loop
    let clock = new THREE.Clock();

    const animate = () => {
      animFrameIdRef.current = requestAnimationFrame(animate);

      const delta = clock.getDelta();
      const time = clock.getElapsedTime();

      // Auto-rotation when toggled
      if (autoRotateRef.current) {
        controls.autoRotate = true;
        controls.autoRotateSpeed = 1.0;
      } else {
        controls.autoRotate = false;
      }
      controls.update();

      // Rotate Starfield gently
      if (starFieldRef.current) {
        starFieldRef.current.rotation.y = time * 0.015;
      }

      // Animate Individual Node Elements (spinning shells and pulsing cores)
      nodeMeshes.forEach((group, id) => {
        const shell = group.getObjectByName('shell');
        const ring = group.getObjectByName('ring');
        const alertRing = group.getObjectByName('alertRing');
        const core = group.getObjectByName('core');

        if (shell) {
          shell.rotation.x = time * 0.5;
          shell.rotation.y = time * 0.6;
        }
        if (ring) {
          ring.rotation.z = -time * 0.8;
        }
        if (alertRing) {
          alertRing.rotation.z = time * 1.5;
          const alertScale = 1 + Math.sin(time * 4) * 0.12;
          alertRing.scale.set(alertScale, alertScale, alertScale);
        }
        if (core) {
          const isSelected = selectedNode?.id === id;
          const isHovered = hoveredNodeIdRef.current === id;
          const pulse = (isSelected || isHovered) ? 1 + Math.sin(time * 5) * 0.18 : 1 + Math.sin(time * 2 + group.position.x * 0.01) * 0.05;
          core.scale.set(pulse, pulse, pulse);
        }
      });

      // Update 3D Traveling Action Potentials
      updateActionPotentials(scene, time);

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animFrameIdRef.current);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [nodes, role]);

  // Create curved 3D Synapse path
  const createSynapseCurve = (start, end, arcFactor = 0.2) => {
    const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
    const dist = start.distanceTo(end);

    // Vector perpendicular in 3D
    const dir = new THREE.Vector3().subVectors(end, start).normalize();
    const up = new THREE.Vector3(0, 1, 0);
    const normal = new THREE.Vector3().crossVectors(dir, up).normalize();
    if (normal.lengthSq() < 0.001) normal.set(1, 0, 0);

    // Elevate middle point in 3D arc
    mid.addScaledVector(up, dist * arcFactor * 0.8);
    mid.addScaledVector(normal, (Math.sin(start.x) * dist * arcFactor * 0.5));

    return new THREE.CatmullRomCurve3([start.clone(), mid, end.clone()]);
  };

  // Recompute lines connected to a dragged node
  const updateConnectedLines = (nodeId, newPos) => {
    const nodeMeshes = nodeMeshesRef.current;
    synapseLinesRef.current.forEach(item => {
      if (item.sourceId === nodeId || item.targetId === nodeId) {
        const sGroup = nodeMeshes.get(item.sourceId);
        const tGroup = nodeMeshes.get(item.targetId);
        if (sGroup && tGroup) {
          const newCurve = createSynapseCurve(
            sGroup.position,
            tGroup.position,
            item.isInterdisciplinary ? 0.35 : 0.15
          );
          item.curve = newCurve;

          const points = newCurve.getPoints(item.isInterdisciplinary ? 50 : 40);
          item.line.geometry.dispose();
          item.line.geometry = new THREE.BufferGeometry().setFromPoints(points);
          if (item.isInterdisciplinary) {
            item.line.computeLineDistances();
          }
        }
      }
    });
  };

  // 3D Traveling Action Potential Particle System
  const updateActionPotentials = (scene, time) => {
    const pulses = pulseParticlesRef.current;
    const lines = synapseLinesRef.current;

    // Spawn new 3D pulse occasionally
    if (Math.random() < 0.25 && pulses.length < 35 && lines.length > 0) {
      const randomLine = lines[Math.floor(Math.random() * lines.length)];
      const sphereGeo = new THREE.SphereGeometry(2.5, 12, 12);
      const sparkMat = new THREE.MeshBasicMaterial({
        color: randomLine.color || 0x00f2fe,
        transparent: true,
        opacity: 0.95
      });
      const sparkMesh = new THREE.Mesh(sphereGeo, sparkMat);
      scene.add(sparkMesh);

      pulses.push({
        mesh: sparkMesh,
        curve: randomLine.curve,
        progress: 0,
        speed: 0.012 + Math.random() * 0.014
      });
    }

    // Advance pulses along 3D curves
    for (let i = pulses.length - 1; i >= 0; i--) {
      const p = pulses[i];
      p.progress += p.speed;

      if (p.progress >= 1) {
        scene.remove(p.mesh);
        p.mesh.geometry.dispose();
        p.mesh.material.dispose();
        pulses.splice(i, 1);
        continue;
      }

      const pos = p.curve.getPointAt(p.progress);
      p.mesh.position.copy(pos);
    }
  };

  // Center / Focus camera on selected node
  useEffect(() => {
    if (selectedNode && controlsRef.current && cameraRef.current) {
      const targetPos = new THREE.Vector3(selectedNode.x || 0, selectedNode.y || 0, selectedNode.z || 0);

      // Smoothly look at the node
      const controls = controlsRef.current;
      controls.target.copy(targetPos);

      // Camera offset
      const offset = new THREE.Vector3(0, 50, 220);
      cameraRef.current.position.copy(targetPos).add(offset);
      controls.update();
    }
  }, [selectedNode]);

  // Handle Raycasting Pointer Events (Hover, Click, and 3D Drag)
  const getRaycaster = (clientX, clientY) => {
    const container = mountRef.current;
    if (!container || !cameraRef.current) return null;
    const rect = container.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((clientX - rect.left) / container.clientWidth) * 2 - 1,
      -((clientY - rect.top) / container.clientHeight) * 2 + 1
    );
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, cameraRef.current);
    return { raycaster, mouse };
  };

  const handlePointerDown = (e) => {
    const result = getRaycaster(e.clientX, e.clientY);
    if (!result) return;
    const { raycaster } = result;

    pointerDownPosRef.current = { x: e.clientX, y: e.clientY };

    // Test intersections with node meshes
    const meshes = Array.from(nodeMeshesRef.current.values());
    const intersects = raycaster.intersectObjects(meshes, true);

    if (intersects.length > 0) {
      // Find top-level group
      let obj = intersects[0].object;
      while (obj.parent && !obj.userData?.nodeId) {
        obj = obj.parent;
      }

      if (obj.userData?.nodeId) {
        const nodeId = obj.userData.nodeId;
        draggedNodeIdRef.current = nodeId;
        isDraggingNodeRef.current = true;

        // Disable OrbitControls during node dragging
        if (controlsRef.current) {
          controlsRef.current.enabled = false;
        }

        // Set up interactive drag plane facing the camera
        const camera = cameraRef.current;
        const normal = new THREE.Vector3();
        camera.getWorldDirection(normal).negate(); // plane normal points to camera
        dragPlaneRef.current.setFromNormalAndCoplanarPoint(normal, obj.position);
      }
    }
  };

  const handlePointerMove = (e) => {
    const result = getRaycaster(e.clientX, e.clientY);
    if (!result) return;
    const { raycaster } = result;

    // 1. If currently dragging a 3D node
    if (isDraggingNodeRef.current && draggedNodeIdRef.current) {
      const nodeGroup = nodeMeshesRef.current.get(draggedNodeIdRef.current);
      if (nodeGroup && raycaster.ray.intersectPlane(dragPlaneRef.current, dragPlaneIntersectRef.current)) {
        const newPos = dragPlaneIntersectRef.current;
        nodeGroup.position.copy(newPos);

        // Update connected synapse 3D curves
        updateConnectedLines(draggedNodeIdRef.current, newPos);

        if (onNodePositionChange) {
          onNodePositionChange(draggedNodeIdRef.current, newPos.x, newPos.y, newPos.z);
        }
      }
      return;
    }

    // 2. Hover detection
    const meshes = Array.from(nodeMeshesRef.current.values());
    const intersects = raycaster.intersectObjects(meshes, true);

    if (intersects.length > 0) {
      let obj = intersects[0].object;
      while (obj.parent && !obj.userData?.nodeId) {
        obj = obj.parent;
      }
      if (obj.userData?.nodeId) {
        hoveredNodeIdRef.current = obj.userData.nodeId;
        if (mountRef.current) mountRef.current.style.cursor = 'pointer';
        return;
      }
    }

    hoveredNodeIdRef.current = null;
    if (mountRef.current) mountRef.current.style.cursor = 'grab';
  };

  const handlePointerUp = (e) => {
    const dx = Math.abs(e.clientX - pointerDownPosRef.current.x);
    const dy = Math.abs(e.clientY - pointerDownPosRef.current.y);
    const isClick = (dx < 5 && dy < 5);

    if (isDraggingNodeRef.current && draggedNodeIdRef.current) {
      if (isClick) {
        const node = nodes.find(n => n.id === draggedNodeIdRef.current);
        if (node) {
          onSelectNode(node);
          neuralAudio.playNodeSelect();
        }
      }
    }

    isDraggingNodeRef.current = false;
    draggedNodeIdRef.current = null;

    // Re-enable OrbitControls
    if (controlsRef.current) {
      controlsRef.current.enabled = true;
    }
  };

  // Camera presets
  const setCameraPreset = (preset) => {
    const controls = controlsRef.current;
    const camera = cameraRef.current;
    if (!controls || !camera) return;

    neuralAudio.playNodeSelect();

    if (preset === 'front') {
      camera.position.set(0, 0, 650);
      controls.target.set(0, 0, 0);
    } else if (preset === 'top') {
      camera.position.set(0, 750, 20);
      controls.target.set(0, 0, 0);
    } else if (preset === 'iso') {
      camera.position.set(450, 350, 450);
      controls.target.set(0, 0, 0);
    }
    controls.update();
  };

  const zoomCamera = (factor) => {
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls) return;

    camera.position.multiplyScalar(factor);
    controls.update();
  };

  return (
    <div className="relative w-full h-full select-none overflow-hidden bg-[#070913]">
      {/* 3D WebGL Canvas Container */}
      <div
        ref={mountRef}
        className="w-full h-full block cursor-grab active:cursor-grabbing"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      />

      {/* Floating 3D Navigation HUD */}
      <div className="absolute bottom-6 right-6 flex flex-col gap-2 z-20">
        {/* Auto Rotate Toggle */}
        <button
          onClick={() => {
            setAutoRotate(!autoRotate);
            neuralAudio.playNodeSelect();
          }}
          title={autoRotate ? "Detener Rotación Automática" : "Activar Rotación Automática 3D"}
          className={`p-3 rounded-xl border backdrop-blur-md shadow-lg transition-all hover:scale-105 active:scale-95 ${
            autoRotate
              ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-cyan-500/30'
              : 'bg-slate-900/80 text-cyan-400 border-cyan-500/30 hover:bg-slate-800'
          }`}
        >
          <Rotate3d className="w-5 h-5 animate-spin" style={{ animationDuration: '8s' }} />
        </button>

        {/* Camera Preset: Isométrica */}
        <button
          onClick={() => setCameraPreset('iso')}
          title="Vista Isométrica 3D"
          className="p-3 bg-slate-900/80 hover:bg-slate-800 text-purple-400 hover:text-purple-300 rounded-xl border border-purple-500/30 backdrop-blur-md shadow-lg shadow-purple-500/10 transition-all hover:scale-105 active:scale-95"
        >
          <Compass className="w-5 h-5" />
        </button>

        {/* Camera Preset: Frontal */}
        <button
          onClick={() => setCameraPreset('front')}
          title="Vista Frontal"
          className="p-3 bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-slate-100 rounded-xl border border-slate-700 backdrop-blur-md shadow-lg transition-all hover:scale-105 active:scale-95 text-xs font-mono font-bold"
        >
          2D
        </button>

        {/* Zoom In */}
        <button
          onClick={() => zoomCamera(0.85)}
          title="Acercar (Zoom In)"
          className="p-3 bg-slate-900/80 hover:bg-slate-800 text-cyan-400 hover:text-cyan-300 rounded-xl border border-cyan-500/30 backdrop-blur-md shadow-lg shadow-cyan-500/10 transition-all hover:scale-105 active:scale-95"
        >
          <ZoomIn className="w-5 h-5" />
        </button>

        {/* Zoom Out */}
        <button
          onClick={() => zoomCamera(1.15)}
          title="Alejar (Zoom Out)"
          className="p-3 bg-slate-900/80 hover:bg-slate-800 text-cyan-400 hover:text-cyan-300 rounded-xl border border-cyan-500/30 backdrop-blur-md shadow-lg shadow-cyan-500/10 transition-all hover:scale-105 active:scale-95"
        >
          <ZoomOut className="w-5 h-5" />
        </button>

        {/* Reset Camera */}
        <button
          onClick={() => setCameraPreset('iso')}
          title="Centrar Conectoma 3D"
          className="p-3 bg-slate-900/80 hover:bg-slate-800 text-purple-400 hover:text-purple-300 rounded-xl border border-purple-500/30 backdrop-blur-md shadow-lg shadow-purple-500/10 transition-all hover:scale-105 active:scale-95"
        >
          <Maximize2 className="w-5 h-5" />
        </button>
      </div>

      {/* Top 3D Indicator Pill */}
      <div className="absolute top-20 left-6 pointer-events-none z-10 hidden md:flex items-center gap-2 bg-slate-950/80 backdrop-blur-md border border-cyan-500/30 px-3.5 py-1.5 rounded-full text-xs text-slate-300 shadow-xl shadow-cyan-950/30">
        <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
        <span className="font-mono text-cyan-300 font-bold">ESPACIO 3D ACTIVO:</span>
        <span>Arrastra nodos por el espacio tridimensional | Clic izquierdo + arrastrar para rotar | Clic derecho para desplazar</span>
      </div>
    </div>
  );
}
