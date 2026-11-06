import React, { useState } from 'react';
import {
  X,
  Zap,
  CheckCircle,
  Lock,
  ArrowRight,
  BookOpen,
  Share2,
  AlertTriangle,
  Lightbulb,
  Sparkles,
  HelpCircle,
  ExternalLink
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { neuralAudio } from '../utils/AudioPlayer';

export default function NodeDetailModal({
  node,
  onClose,
  onCompleteNode,
  allNodes = [],
  role = 'student',
  onSelectNodeById
}) {
  const [activeTab, setActiveTab] = useState('quiz'); // 'quiz' | 'synapses' | 'bridges' | 'resources'
  const [selectedOption, setSelectedOption] = useState(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!node) return null;

  const quiz = node.quiz && node.quiz[0];
  const isMastered = node.status === 'mastered';
  const isLocked = node.status === 'locked';

  // Handle quiz submission
  const handleCheckAnswer = async () => {
    if (selectedOption === null) return;
    setSubmitting(true);

    const correct = selectedOption === quiz.correctIndex;
    setIsCorrect(correct);
    setQuizSubmitted(true);

    if (correct) {
      // Trigger celebrations
      neuralAudio.playLevelUp();
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#00f2fe', '#a855f7', '#10b981', '#f59e0b']
      });

      // Complete on backend
      await onCompleteNode(node.id);
    } else {
      neuralAudio.playAlert();
    }
    setSubmitting(false);
  };

  const nodeMap = new Map(allNodes.map(n => [n.id, n]));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md select-none animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-slate-950/95 border border-cyan-500/40 rounded-3xl shadow-2xl shadow-cyan-950/80 overflow-hidden flex flex-col max-h-[90vh]">

        {/* Modal Top Header */}
        <div className="p-5 border-b border-slate-800 bg-gradient-to-r from-slate-900/80 via-slate-950 to-slate-900/80 flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span
                className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase border"
                style={{
                  backgroundColor: `${node.clusterColor}22`,
                  borderColor: node.clusterColor,
                  color: node.clusterColor
                }}
              >
                {node.cluster}
              </span>

              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
                Nivel: {node.level}
              </span>

              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono flex items-center gap-1 font-bold ${
                isMastered ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' :
                isLocked ? 'bg-slate-800 text-slate-400 border border-slate-700' :
                'bg-purple-500/20 text-purple-300 border border-purple-500/40'
              }`}>
                {isMastered ? <CheckCircle className="w-3 h-3" /> : isLocked ? <Lock className="w-3 h-3" /> : <Zap className="w-3 h-3" />}
                {isMastered ? 'DOMINADO' : isLocked ? 'BLOQUEADO' : 'EN PROCESO'}
              </span>

              <span className="text-[11px] font-mono text-amber-400 flex items-center gap-0.5">
                +{node.xpReward || 150} XP
              </span>
            </div>

            <h2 className="text-xl font-black text-slate-100 font-['Rajdhani'] tracking-wide">
              {node.title}
            </h2>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              {node.summary}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-slate-100 border border-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex border-b border-slate-800 px-5 bg-slate-900/50">
          <button
            onClick={() => {
              setActiveTab('quiz');
              neuralAudio.playNodeSelect();
            }}
            className={`py-2.5 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'quiz'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Desafío de Activación</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('synapses');
              neuralAudio.playNodeSelect();
            }}
            className={`py-2.5 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'synapses'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Ruta Sináptica</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('bridges');
              neuralAudio.playNodeSelect();
            }}
            className={`py-2.5 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'bridges'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Puentes Interdisciplinarios</span>
            {node.interdisciplinaryBridges?.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-300 text-[10px] flex items-center justify-center font-bold">
                {node.interdisciplinaryBridges.length}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              setActiveTab('resources');
              neuralAudio.playNodeSelect();
            }}
            className={`py-2.5 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'resources'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Holo-Labs</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">

          {/* TAB 1: DIAGNOSTIC QUIZ / CHALLENGE */}
          {activeTab === 'quiz' && (
            <div className="space-y-4">
              {isLocked ? (
                <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-center space-y-2">
                  <Lock className="w-8 h-8 text-slate-500 mx-auto" />
                  <h4 className="text-sm font-bold text-slate-300">
                    Neurona Bloqueada por Prerrequisitos
                  </h4>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    Para activar los impulsos de esta competencia, primero debes dominar los conceptos previos en su cadena sináptica.
                  </p>
                  <div className="pt-2 flex flex-wrap justify-center gap-2">
                    {(node.prerequisites || []).map(preId => {
                      const pre = nodeMap.get(preId);
                      return pre ? (
                        <button
                          key={preId}
                          onClick={() => {
                            onClose();
                            onSelectNodeById(preId);
                          }}
                          className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-mono border border-slate-700 flex items-center gap-1"
                        >
                          <span>{pre.title}</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      ) : null;
                    })}
                  </div>
                </div>
              ) : quiz ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1">
                      <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
                      Evaluación de Activación Cognitiva
                    </span>
                    {isMastered && (
                      <span className="text-xs font-mono text-emerald-400 flex items-center gap-1 font-bold">
                        <CheckCircle className="w-3.5 h-3.5" /> Dominio Completado
                      </span>
                    )}
                  </div>

                  <p className="text-sm font-semibold text-slate-100 bg-slate-900/60 p-3.5 rounded-xl border border-slate-800/80">
                    {quiz.question}
                  </p>

                  <div className="space-y-2">
                    {quiz.options.map((option, idx) => {
                      const isChosen = selectedOption === idx;
                      let optionStyle = 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-300';

                      if (quizSubmitted) {
                        if (idx === quiz.correctIndex) {
                          optionStyle = 'bg-emerald-950/40 border-emerald-500 text-emerald-200';
                        } else if (isChosen && !isCorrect) {
                          optionStyle = 'bg-rose-950/40 border-rose-500 text-rose-200';
                        }
                      } else if (isChosen) {
                        optionStyle = 'bg-cyan-950/40 border-cyan-400 text-cyan-200 shadow-sm shadow-cyan-500/20';
                      }

                      return (
                        <div
                          key={idx}
                          onClick={() => !quizSubmitted && setSelectedOption(idx)}
                          className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex items-center gap-3 ${optionStyle}`}
                        >
                          <div className={`w-5 h-5 rounded-full border flex items-center justify-center font-mono text-[10px] font-bold ${
                            isChosen ? 'border-cyan-400 bg-cyan-400/20 text-cyan-300' : 'border-slate-700 text-slate-500'
                          }`}>
                            {String.fromCharCode(65 + idx)}
                          </div>
                          <span className="flex-1">{option}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Feedback Explanation */}
                  {quizSubmitted && (
                    <div className={`p-3.5 rounded-xl border text-xs leading-relaxed ${
                      isCorrect
                        ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                        : 'bg-rose-950/30 border-rose-500/40 text-rose-200'
                    }`}>
                      <div className="font-bold mb-1 flex items-center gap-1.5">
                        {isCorrect ? '¡Activación Exitosa!' : 'Impulso Fallido - Revisión Recomendada'}
                      </div>
                      <p>{quiz.explanation}</p>
                    </div>
                  )}

                  {/* Action Button */}
                  <div className="pt-2">
                    {!quizSubmitted ? (
                      <button
                        onClick={handleCheckAnswer}
                        disabled={selectedOption === null || submitting}
                        className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs tracking-wider uppercase font-['Rajdhani'] shadow-lg shadow-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        {submitting ? 'Transmitiendo Potencial...' : 'Disparar Potencial de Acción (Comprobar)'}
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setQuizSubmitted(false);
                          setSelectedOption(null);
                        }}
                        className="w-full py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all"
                      >
                        Reintentar Desafío
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-400">No hay desafíos asociados a este nodo.</p>
              )}
            </div>
          )}

          {/* TAB 2: SYNAPSE PATH & PREREQUISITES */}
          {activeTab === 'synapses' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono mb-2">
                  Prerrequisitos Requeridos (Entradas)
                </h4>
                {node.prerequisites && node.prerequisites.length > 0 ? (
                  <div className="space-y-2">
                    {node.prerequisites.map(preId => {
                      const pre = nodeMap.get(preId);
                      if (!pre) return null;
                      const isPreMastered = pre.status === 'mastered';
                      return (
                        <div
                          key={preId}
                          onClick={() => {
                            onClose();
                            onSelectNodeById(preId);
                          }}
                          className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-cyan-500/40 cursor-pointer transition-all"
                        >
                          <div>
                            <div className="text-xs font-bold text-slate-200">{pre.title}</div>
                            <div className="text-[10px] text-slate-400">{pre.cluster}</div>
                          </div>
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                            isPreMastered ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                          }`}>
                            {isPreMastered ? '✓ CUMPLIDO' : 'PENDIENTE'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">Este nodo es un concepto raíz (no requiere prerrequisitos previos).</p>
                )}
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono mb-2">
                  Sinapsis Conectadas (Hacia Dónde Conduce)
                </h4>
                {node.synapses && node.synapses.length > 0 ? (
                  <div className="space-y-2">
                    {node.synapses.map(synId => {
                      const target = nodeMap.get(synId);
                      if (!target) return null;
                      return (
                        <div
                          key={synId}
                          onClick={() => {
                            onClose();
                            onSelectNodeById(synId);
                          }}
                          className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-purple-500/40 cursor-pointer transition-all"
                        >
                          <div>
                            <div className="text-xs font-bold text-slate-200">{target.title}</div>
                            <div className="text-[10px] text-slate-400">{target.cluster}</div>
                          </div>
                          <ArrowRight className="w-4 h-4 text-slate-500" />
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">No tiene sinapsis salientes registradas.</p>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: INTERDISCIPLINARY BRIDGES */}
          {activeTab === 'bridges' && (
            <div className="space-y-3">
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-200/90 flex items-start gap-2">
                <Lightbulb className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <span>
                  Los puentes interdisciplinarios rompen los silos académicos conectando saberes que tradicionalmente se enseñaban separados.
                </span>
              </div>

              {node.interdisciplinaryBridges && node.interdisciplinaryBridges.length > 0 ? (
                <div className="space-y-2.5">
                  {node.interdisciplinaryBridges.map((bridge, idx) => {
                    const target = nodeMap.get(bridge.targetId);
                    return (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl bg-slate-900/70 border border-amber-500/30 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5 font-['Rajdhani']">
                            <span>{node.title}</span>
                            <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
                            <span>{target ? target.title : bridge.targetId}</span>
                          </span>

                          {target && (
                            <button
                              onClick={() => {
                                onClose();
                                onSelectNodeById(target.id);
                              }}
                              className="text-[10px] font-mono text-cyan-400 hover:underline flex items-center gap-1"
                            >
                              <span>Ver nodo</span>
                              <ExternalLink className="w-3 h-3" />
                            </button>
                          )}
                        </div>

                        <p className="text-xs text-slate-300 leading-relaxed">
                          {bridge.description}
                        </p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic text-center py-4">
                  Aún no se han configurado puentes interdisciplinares para esta neurona.
                </p>
              )}
            </div>
          )}

          {/* TAB 4: RESOURCES & HOLO-LABS */}
          {activeTab === 'resources' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-400">
                Experiencias de simulación y micro-cápsulas conceptuales para activar la neurona:
              </p>

              {node.resources && node.resources.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {node.resources.map((res, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-cyan-500/40 transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                            {res.type}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {res.duration}
                          </span>
                        </div>
                        <h5 className="text-xs font-bold text-slate-200 mt-1">
                          {res.title}
                        </h5>
                      </div>

                      <button
                        onClick={() => alert(`Iniciando experiencia: ${res.title}`)}
                        className="mt-3 w-full py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        <span>Entrar a Simulación</span>
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">No hay laboratorios asignados.</p>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer with Teacher Cohort Telemetry (if role === teacher) */}
        {role === 'teacher' && node.cohortStats && (
          <div className="p-3.5 bg-amber-950/20 border-t border-amber-500/30 flex items-center justify-between text-xs text-amber-200/90 font-mono">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>
                Rendimiento de Cohorte: <strong className="text-amber-300">{node.cohortStats.averageScore}%</strong> ({node.cohortStats.studentsStruggling}/{node.cohortStats.totalStudents} con rezago)
              </span>
            </div>
            {node.cohortStats.isBottleneck && (
              <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold">
                CUELLO DE BOTELLA
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
