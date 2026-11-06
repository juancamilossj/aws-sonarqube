import React, { useRef, useEffect, useState, useCallback } from 'react';
import { ZoomIn, ZoomOut, Maximize2, Sparkles, AlertTriangle, Layers } from 'lucide-react';

export default function NeuralCanvas({
  nodes,
  selectedNode,
  onSelectNode,
  role = 'student', // 'student' | 'teacher'
  highlightCluster = 'all',
  searchQuery = '',
  onNodePositionChange
}) {
  const canvasRef = useRef(null);

  // Camera transform state
  const cameraRef = useRef({
    x: 0,
    y: 0,
    zoom: 1,
    isDragging: false,
    dragStartX: 0,
    dragStartY: 0
  });

  // Dragging individual node
  const draggingNodeRef = useRef(null);
  const hoveredNodeRef = useRef(null);

  // Background ambient particles
  const ambientParticlesRef = useRef([]);

  // Traveling action potential pulses along synapses
  const pulsesRef = useRef([]);

  // Animation frame ID
  const animFrameIdRef = useRef(null);

  // Initialize camera and ambient particles
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    cameraRef.current.x = canvas.clientWidth / 2;
    cameraRef.current.y = canvas.clientHeight / 2;

    // Generate 60 ambient particles
    const particles = [];
    for (let i = 0; i < 60; i++) {
      particles.push({
        x: (Math.random() - 0.5) * 2000,
        y: (Math.random() - 0.5) * 2000,
        radius: Math.random() * 2 + 0.8,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        alpha: Math.random() * 0.5 + 0.2
      });
    }
    ambientParticlesRef.current = particles;
  }, []);

  // Center camera when selected node changes externally (e.g., from search)
  useEffect(() => {
    if (selectedNode && canvasRef.current) {
      const canvas = canvasRef.current;
      const targetX = canvas.clientWidth / 2 - selectedNode.x * cameraRef.current.zoom;
      const targetY = canvas.clientHeight / 2 - selectedNode.y * cameraRef.current.zoom;

      // Smooth pan to selected node
      cameraRef.current.x = targetX;
      cameraRef.current.y = targetY;
    }
  }, [selectedNode]);

  // Main Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Handle high DPI displays
    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    let time = 0;

    const render = () => {
      time += 0.02;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      const camera = cameraRef.current;

      // Clear Canvas
      ctx.clearRect(0, 0, width, height);

      // Deep space gradient
      const bgGrad = ctx.createRadialGradient(
        width / 2, height / 2, 50,
        width / 2, height / 2, Math.max(width, height)
      );
      bgGrad.addColorStop(0, '#0c1126');
      bgGrad.addColorStop(0.6, '#070913');
      bgGrad.addColorStop(1, '#03050a');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Save transform for world-space rendering
      ctx.save();
      ctx.translate(camera.x, camera.y);
      ctx.scale(camera.zoom, camera.zoom);

      // 1. Draw Holographic Grid Lines & Coordinates
      drawGrid(ctx, camera, width, height);

      // 2. Draw Floating Ambient Particles
      drawAmbientParticles(ctx);

      // Map nodes for fast lookup
      const nodeMap = new Map();
      nodes.forEach(n => nodeMap.set(n.id, n));

      // Determine active highlight paths based on hovered or selected node
      const activeFocusNode = hoveredNodeRef.current || selectedNode;
      const focusedNodeId = activeFocusNode?.id;
      const connectedNodeIds = new Set();
      if (activeFocusNode) {
        connectedNodeIds.add(activeFocusNode.id);
        (activeFocusNode.prerequisites || []).forEach(id => connectedNodeIds.add(id));
        (activeFocusNode.synapses || []).forEach(id => connectedNodeIds.add(id));
        (activeFocusNode.interdisciplinaryBridges || []).forEach(b => connectedNodeIds.add(b.targetId));
      }

      // 3. Draw Synapses (Axons & Dendrites)
      drawSynapses(ctx, nodes, nodeMap, focusedNodeId, connectedNodeIds, time, role);

      // 4. Draw Traveling Action Potential Pulses
      updateAndDrawPulses(ctx, nodes, nodeMap, time);

      // 5. Draw Neural Nodes (Somas)
      drawNodes(ctx, nodes, focusedNodeId, connectedNodeIds, time, role, highlightCluster, searchQuery);

      ctx.restore();

      animFrameIdRef.current = requestAnimationFrame(render);
    };

    animFrameIdRef.current = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animFrameIdRef.current);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [nodes, selectedNode, role, highlightCluster, searchQuery]);

  // Draw Subtle Cybernetic Coordinate Grid
  const drawGrid = (ctx, camera, screenW, screenH) => {
    ctx.strokeStyle = 'rgba(0, 242, 254, 0.04)';
    ctx.lineWidth = 1;

    const gridSize = 100;
    const startX = -1200;
    const endX = 1200;
    const startY = -1200;
    const endY = 1200;

    ctx.beginPath();
    for (let x = startX; x <= endX; x += gridSize) {
      ctx.moveTo(x, startY);
      ctx.lineTo(x, endY);
    }
    for (let y = startY; y <= endY; y += gridSize) {
      ctx.moveTo(startX, y);
      ctx.lineTo(endX, y);
    }
    ctx.stroke();

    // Subtle coordinate dots at intersections
    ctx.fillStyle = 'rgba(0, 242, 254, 0.15)';
    for (let x = startX; x <= endX; x += gridSize * 2) {
      for (let y = startY; y <= endY; y += gridSize * 2) {
        ctx.beginPath();
        ctx.arc(x, y, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  };

  // Draw floating dust particles
  const drawAmbientParticles = (ctx) => {
    ambientParticlesRef.current.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x > 1000) p.x = -1000;
      if (p.x < -1000) p.x = 1000;
      if (p.y > 1000) p.y = -1000;
      if (p.y < -1000) p.y = 1000;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(168, 85, 247, ${p.alpha * 0.4})`;
      ctx.fill();
    });
  };

  // Draw Synapses
  const drawSynapses = (ctx, nodes, nodeMap, focusedNodeId, connectedNodeIds, time, role) => {
    nodes.forEach(source => {
      // 1. Regular Synapses (Prerequisites / Downstream)
      (source.synapses || []).forEach(targetId => {
        const target = nodeMap.get(targetId);
        if (!target) return;

        const isDirectConnection =
          focusedNodeId && (source.id === focusedNodeId || target.id === focusedNodeId);
        const isDimmed =
          focusedNodeId && !isDirectConnection;

        // Base styling
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(source.x, source.y);

        // Slight Bezier curve for organic biological feel
        const midX = (source.x + target.x) / 2;
        const midY = (source.y + target.y) / 2;
        const dx = target.x - source.x;
        const dy = target.y - source.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const curveOffset = Math.sin(time + dist * 0.01) * 8;
        const cx = midX - (dy / dist) * curveOffset;
        const cy = midY + (dx / dist) * curveOffset;

        ctx.quadraticCurveTo(cx, cy, target.x, target.y);

        if (isDirectConnection) {
          ctx.strokeStyle = '#00f2fe';
          ctx.lineWidth = 3;
          ctx.shadowColor = '#00f2fe';
          ctx.shadowBlur = 12;
        } else if (isDimmed) {
          ctx.strokeStyle = 'rgba(75, 85, 99, 0.15)';
          ctx.lineWidth = 1;
        } else {
          // Standard state based on source mastery
          if (source.status === 'mastered') {
            ctx.strokeStyle = 'rgba(0, 242, 254, 0.45)';
            ctx.lineWidth = 2;
            ctx.shadowColor = '#00f2fe';
            ctx.shadowBlur = 6;
          } else if (source.status === 'in_progress') {
            ctx.strokeStyle = 'rgba(168, 85, 247, 0.4)';
            ctx.lineWidth = 1.5;
            ctx.shadowColor = '#a855f7';
            ctx.shadowBlur = 4;
          } else {
            ctx.strokeStyle = 'rgba(51, 65, 85, 0.3)';
            ctx.lineWidth = 1;
          }
        }

        ctx.stroke();
        ctx.restore();
      });

      // 2. Interdisciplinary Bridges (Dashed Golden/Violet Shimmering Sinapsis)
      (source.interdisciplinaryBridges || []).forEach(bridge => {
        const target = nodeMap.get(bridge.targetId);
        if (!target) return;

        const isDirectConnection =
          focusedNodeId && (source.id === focusedNodeId || target.id === focusedNodeId);

        ctx.save();
        ctx.setLineDash([6, 6]);
        ctx.lineDashOffset = -time * 15; // Flowing animated dash

        ctx.beginPath();
        ctx.moveTo(source.x, source.y);

        // High arc for interdisciplinary bridges
        const midX = (source.x + target.x) / 2;
        const midY = (source.y + target.y) / 2;
        const dx = target.x - source.x;
        const dy = target.y - source.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const arc = Math.min(60, dist * 0.25);
        const cx = midX - (dy / dist) * arc;
        const cy = midY + (dx / dist) * arc;

        ctx.quadraticCurveTo(cx, cy, target.x, target.y);

        if (isDirectConnection) {
          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 3;
          ctx.shadowColor = '#f59e0b';
          ctx.shadowBlur = 14;
        } else {
          ctx.strokeStyle = 'rgba(245, 158, 11, 0.4)';
          ctx.lineWidth = 2;
          ctx.shadowColor = 'rgba(245, 158, 11, 0.3)';
          ctx.shadowBlur = 6;
        }

        ctx.stroke();
        ctx.restore();
      });
    });
  };

  // Draw and update animated action potentials
  const updateAndDrawPulses = (ctx, nodes, nodeMap, time) => {
    // Generate new pulse occasionally
    if (Math.random() < 0.25 && pulsesRef.current.length < 45) {
      const activeSources = nodes.filter(n => n.status === 'mastered' || n.status === 'in_progress');
      if (activeSources.length > 0) {
        const randomSource = activeSources[Math.floor(Math.random() * activeSources.length)];
        const targets = randomSource.synapses || [];
        if (targets.length > 0) {
          const randomTargetId = targets[Math.floor(Math.random() * targets.length)];
          const target = nodeMap.get(randomTargetId);
          if (target) {
            pulsesRef.current.push({
              sourceId: randomSource.id,
              targetId: target.id,
              progress: 0,
              speed: 0.012 + Math.random() * 0.015,
              color: randomSource.clusterColor || '#00f2fe',
              size: Math.random() * 2.5 + 2
            });
          }
        }
      }
    }

    // Update and draw pulses
    for (let i = pulsesRef.current.length - 1; i >= 0; i--) {
      const pulse = pulsesRef.current[i];
      pulse.progress += pulse.speed;

      if (pulse.progress >= 1) {
        pulsesRef.current.splice(i, 1);
        continue;
      }

      const sNode = nodeMap.get(pulse.sourceId);
      const tNode = nodeMap.get(pulse.targetId);
      if (!sNode || !tNode) {
        pulsesRef.current.splice(i, 1);
        continue;
      }

      // Linear interpolation along position
      const px = sNode.x + (tNode.x - sNode.x) * pulse.progress;
      const py = sNode.y + (tNode.y - sNode.y) * pulse.progress;

      ctx.save();
      ctx.beginPath();
      ctx.arc(px, py, pulse.size, 0, Math.PI * 2);
      ctx.fillStyle = pulse.color;
      ctx.shadowColor = pulse.color;
      ctx.shadowBlur = 10;
      ctx.fill();

      // Tail
      ctx.beginPath();
      const prevX = sNode.x + (tNode.x - sNode.x) * Math.max(0, pulse.progress - 0.05);
      const prevY = sNode.y + (tNode.y - sNode.y) * Math.max(0, pulse.progress - 0.05);
      ctx.moveTo(px, py);
      ctx.lineTo(prevX, prevY);
      ctx.strokeStyle = pulse.color;
      ctx.lineWidth = pulse.size * 0.8;
      ctx.stroke();

      ctx.restore();
    }
  };

  // Draw Somas (Neural Nodes)
  const drawNodes = (ctx, nodes, focusedNodeId, connectedNodeIds, time, role, highlightCluster, searchQuery) => {
    nodes.forEach(node => {
      const isSelected = selectedNode?.id === node.id;
      const isHovered = hoveredNodeRef.current?.id === node.id;
      const isConnected = connectedNodeIds.has(node.id);

      // Filtering check
      const matchesCluster = highlightCluster === 'all' || node.cluster === highlightCluster;
      const matchesSearch = !searchQuery || node.title.toLowerCase().includes(searchQuery.toLowerCase());
      const isDimmed = (focusedNodeId && !isConnected) || !matchesCluster || !matchesSearch;

      ctx.save();
      ctx.globalAlpha = isDimmed ? 0.22 : 1;

      const baseRadius = isSelected ? 34 : 26;
      const pulseOsc = Math.sin(time * 3 + (node.x + node.y) * 0.01) * 2;
      const currentRadius = baseRadius + (isSelected || isHovered ? pulseOsc : 0);

      // 1. Bottleneck Halo in Teacher Mode
      if (role === 'teacher' && node.cohortStats?.isBottleneck) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(node.x, node.y, currentRadius + 18 + Math.sin(time * 4) * 4, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.7)';
        ctx.lineWidth = 2.5;
        ctx.setLineDash([5, 5]);
        ctx.stroke();
        ctx.restore();
      }

      // 2. Outer Synaptic Corona (Radial Glow)
      const glowGrad = ctx.createRadialGradient(
        node.x, node.y, currentRadius * 0.3,
        node.x, node.y, currentRadius * 2.2
      );

      let primaryColor = node.clusterColor || '#00f2fe';
      if (node.status === 'locked') primaryColor = '#475569';
      if (node.status === 'mastered') primaryColor = '#00f2fe';
      if (role === 'teacher' && node.cohortStats?.isBottleneck) primaryColor = '#f59e0b';

      glowGrad.addColorStop(0, `${primaryColor}aa`);
      glowGrad.addColorStop(0.5, `${primaryColor}33`);
      glowGrad.addColorStop(1, 'transparent');

      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(node.x, node.y, currentRadius * 2.2, 0, Math.PI * 2);
      ctx.fill();

      // 3. Segmented Orbit Ring
      ctx.save();
      ctx.translate(node.x, node.y);
      ctx.rotate(time * 0.8 * (node.status === 'mastered' ? 1 : -0.5));
      ctx.beginPath();
      ctx.arc(0, 0, currentRadius + 7, 0, Math.PI * 1.5);
      ctx.strokeStyle = primaryColor;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(0, 0, currentRadius + 7, Math.PI * 1.7, Math.PI * 1.9);
      ctx.strokeStyle = primaryColor;
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.restore();

      // 4. Core Soma (Circle)
      ctx.beginPath();
      ctx.arc(node.x, node.y, currentRadius, 0, Math.PI * 2);
      ctx.fillStyle = node.status === 'locked' ? '#0f172a' : '#0d1127';
      ctx.fill();

      // Core border
      ctx.lineWidth = isSelected ? 3.5 : 2;
      ctx.strokeStyle = primaryColor;
      ctx.shadowColor = primaryColor;
      ctx.shadowBlur = isSelected ? 20 : 10;
      ctx.stroke();
      ctx.shadowBlur = 0; // reset

      // 5. Inner Nucleus / Level Glyphs
      ctx.beginPath();
      ctx.arc(node.x, node.y, currentRadius * 0.45, 0, Math.PI * 2);
      ctx.fillStyle = primaryColor;
      ctx.fill();

      // 6. Label & Status Pill
      drawNodeLabel(ctx, node, currentRadius, primaryColor, role);

      ctx.restore();
    });
  };

  // Draw node title and indicator badge
  const drawNodeLabel = (ctx, node, radius, color, role) => {
    const labelY = node.y + radius + 18;
    const title = node.title;

    ctx.font = '600 13px "Rajdhani", sans-serif';
    const textWidth = ctx.measureText(title).width;
    const padding = 10;
    const boxW = textWidth + padding * 2;
    const boxH = 22;

    // Dark glass badge background
    ctx.fillStyle = 'rgba(7, 9, 19, 0.85)';
    ctx.strokeStyle = `${color}66`;
    ctx.lineWidth = 1;

    roundRect(ctx, node.x - boxW / 2, labelY - 14, boxW, boxH, 4);
    ctx.fill();
    ctx.stroke();

    // Title text
    ctx.fillStyle = '#f1f5f9';
    ctx.textAlign = 'center';
    ctx.fillText(title, node.x, labelY + 2);

    // Sub-badge (Mastery % or Cohort Struggle Alert)
    const subBadgeY = labelY + 18;
    ctx.font = '700 10px "Space Grotesk", monospace';

    if (role === 'teacher' && node.cohortStats?.isBottleneck) {
      const struggleText = `⚠ REZAGO: ${Math.round((node.cohortStats.studentsStruggling / node.cohortStats.totalStudents) * 100)}%`;
      ctx.fillStyle = '#ef4444';
      ctx.fillText(struggleText, node.x, subBadgeY);
    } else {
      const statusText =
        node.status === 'mastered' ? '✓ DOMINADO' :
        node.status === 'locked' ? '🔒 BLOQUEADO' :
        `${node.masteryScore}% ACTIVO`;

      ctx.fillStyle =
        node.status === 'mastered' ? '#00f2fe' :
        node.status === 'locked' ? '#64748b' :
        '#a855f7';

      ctx.fillText(statusText, node.x, subBadgeY);
    }
  };

  // Helper: Round Rectangle
  const roundRect = (ctx, x, y, width, height, radius) => {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  };

  // Screen to World Coordinates conversion
  const screenToWorld = useCallback((screenX, screenY) => {
    const camera = cameraRef.current;
    return {
      x: (screenX - camera.x) / camera.zoom,
      y: (screenY - camera.y) / camera.zoom
    };
  }, []);

  // Mouse / Touch Event Handlers
  const handleMouseDown = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const worldPos = screenToWorld(mouseX, mouseY);

    // Check if clicked a node
    const clickedNode = nodes.find(n => {
      const dist = Math.hypot(n.x - worldPos.x, n.y - worldPos.y);
      return dist <= 35;
    });

    if (clickedNode) {
      draggingNodeRef.current = clickedNode;
      onSelectNode(clickedNode);
    } else {
      // Start camera drag
      cameraRef.current.isDragging = true;
      cameraRef.current.dragStartX = mouseX - cameraRef.current.x;
      cameraRef.current.dragStartY = mouseY - cameraRef.current.y;
    }
  };

  const handleMouseMove = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const worldPos = screenToWorld(mouseX, mouseY);

    // Node Dragging
    if (draggingNodeRef.current) {
      draggingNodeRef.current.x = worldPos.x;
      draggingNodeRef.current.y = worldPos.y;
      if (onNodePositionChange) {
        onNodePositionChange(draggingNodeRef.current.id, worldPos.x, worldPos.y);
      }
      return;
    }

    // Camera Panning
    if (cameraRef.current.isDragging) {
      cameraRef.current.x = mouseX - cameraRef.current.dragStartX;
      cameraRef.current.y = mouseY - cameraRef.current.dragStartY;
      return;
    }

    // Hover Detection
    const hovered = nodes.find(n => {
      const dist = Math.hypot(n.x - worldPos.x, n.y - worldPos.y);
      return dist <= 35;
    });

    if (hovered !== hoveredNodeRef.current) {
      hoveredNodeRef.current = hovered;
      canvas.style.cursor = hovered ? 'pointer' : 'grab';
    }
  };

  const handleMouseUp = () => {
    draggingNodeRef.current = null;
    cameraRef.current.isDragging = false;
  };

  // Zoom controls
  const handleWheel = (e) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
    applyZoom(zoomFactor, e.clientX, e.clientY);
  };

  const applyZoom = (factor, originScreenX, originScreenY) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ox = originScreenX !== undefined ? originScreenX - rect.left : canvas.clientWidth / 2;
    const oy = originScreenY !== undefined ? originScreenY - rect.top : canvas.clientHeight / 2;

    const camera = cameraRef.current;
    const newZoom = Math.min(2.5, Math.max(0.35, camera.zoom * factor));

    // Keep origin point fixed during zoom
    camera.x = ox - (ox - camera.x) * (newZoom / camera.zoom);
    camera.y = oy - (oy - camera.y) * (newZoom / camera.zoom);
    camera.zoom = newZoom;
  };

  const resetView = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    cameraRef.current.x = canvas.clientWidth / 2;
    cameraRef.current.y = canvas.clientHeight / 2;
    cameraRef.current.zoom = 1;
  };

  return (
    <div className="relative w-full h-full select-none overflow-hidden bg-[#070913]">
      <canvas
        ref={canvasRef}
        className="w-full h-full block cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      />

      {/* Floating HUD Controls */}
      <div className="absolute bottom-6 right-6 flex flex-col gap-2 z-20">
        <button
          onClick={() => applyZoom(1.2)}
          title="Acercar (Zoom In)"
          className="p-3 bg-cyber-card/80 hover:bg-slate-800 text-cyan-400 hover:text-cyan-300 rounded-xl border border-cyan-500/30 backdrop-blur-md shadow-lg shadow-cyan-500/10 transition-all hover:scale-105 active:scale-95"
        >
          <ZoomIn className="w-5 h-5" />
        </button>
        <button
          onClick={() => applyZoom(0.8)}
          title="Alejar (Zoom Out)"
          className="p-3 bg-cyber-card/80 hover:bg-slate-800 text-cyan-400 hover:text-cyan-300 rounded-xl border border-cyan-500/30 backdrop-blur-md shadow-lg shadow-cyan-500/10 transition-all hover:scale-105 active:scale-95"
        >
          <ZoomOut className="w-5 h-5" />
        </button>
        <button
          onClick={resetView}
          title="Centrar Red (Reset Camera)"
          className="p-3 bg-cyber-card/80 hover:bg-slate-800 text-purple-400 hover:text-purple-300 rounded-xl border border-purple-500/30 backdrop-blur-md shadow-lg shadow-purple-500/10 transition-all hover:scale-105 active:scale-95"
        >
          <Maximize2 className="w-5 h-5" />
        </button>
      </div>

      {/* Interactive Helper Overlay */}
      <div className="absolute top-20 left-6 pointer-events-none z-10 hidden md:flex items-center gap-2 bg-slate-950/70 backdrop-blur-md border border-slate-800 px-3 py-1.5 rounded-full text-xs text-slate-400">
        <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-spin" style={{ animationDuration: '6s' }} />
        <span>Arrastra nodos para reorganizar tu conectoma | Rueda para Zoom | Clic para activar</span>
      </div>
    </div>
  );
}
