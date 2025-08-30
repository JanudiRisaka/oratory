// app/dashboard/practice/page.tsx
"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";

import dynamic from 'next/dynamic';

const SlidesPanel = dynamic(
  () => import('../../../components/practice/SlidesPanel').then((mod) => mod.SlidesPanel),
  {
    ssr: false,
    loading: () => <div className="flex items-center justify-center h-full"><p>Loading Slides Panel...</p></div>
  }
);
import { NotesPanel } from "../../../components/practice/NotesPanel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Camera, CameraOff, Play, Square, Settings, ArrowRight, RotateCcw, Save,
  GripVertical, Info, Maximize2, Minimize2, X, Clock, HelpCircle, LayoutDashboard, Globe
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";

import { CameraPanel } from "../../../components/practice/CameraPanel";
import { useFacialProcessor } from '@/features/facial-analysis/hooks/useFacialProcessor';
import { AnalysisEngine } from '@/features/facial-analysis/engine/AnalysisEngine';
import { LiveFeedbackData } from '@/features/facial-analysis/types';
import { LiveCoachPanel } from '@/components/practice/LiveCoachPanel';
import { WorkspacePanel, DragState, PanelConfig, PanelComponentMap } from './types';
import { SummaryReport } from "@/features/facial-analysis/types";
import { useToast } from "@/hooks/use-toast";
import { generateUnifiedFeedbackReport } from "../feedback/reportGenerator";
import { saveSessionToFirestore, saveFeedbackToFirestore } from "@/lib/firebase/services/sessionService";
import { scenarios, facialAnalysisGoals, getGoalLabel } from "@/app/config/practiceConfig";

const timeOptions = [{ value: 2, label: "2 minutes" }, { value: 4, label: "4 minutes" }, { value: 6, label: "6 minutes" }, { value: 8, label: "8 minutes" }, { value: 0, label: "Custom" }];

export default function PracticePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [currentView, setCurrentView] = useState<"config" | "workspace">("config");
  const [selectedScenario, setSelectedScenario] = useState<string>("");
  const [selectedGoals, setSelectedGoals] = useState<(typeof facialAnalysisGoals)[number][]>([]);
  const [practiceTime, setPracticeTime] = useState<number>(15);
  const [customTime, setCustomTime] = useState<string>("");
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [notes, setNotes] = useState("");
  const [showGrid, setShowGrid] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const workspaceRef = useRef<HTMLDivElement>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [showPanels, setShowPanels] = useState(false);
  const [presentationFile, setPresentationFile] = useState<File | null>(null);

  const [feedbackData, setFeedbackData] = useState<LiveFeedbackData | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [analysisEngine] = useState(() => new AnalysisEngine());
  const analysisEngineRef = useRef(analysisEngine);
  const feedbackIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const [panels, setPanels] = useState<WorkspacePanel[]>([]);
  const [dragState, setDragState] = useState<DragState>({ isDragging: false, isResizing: false, dragStart: { x: 0, y: 0 }, initialPosition: { x: 0, y: 0 }, initialSize: { width: 0, height: 0 }, resizeHandle: null });
  const [activePanelId, setActivePanelId] = useState<string | null>(null);
  const hasLoadedLayout = useRef(false);
  const hasAutoStarted = useRef(false);
  const hasStopped = useRef(false);

  useEffect(() => {
    if (videoRef.current) {
        analysisEngineRef.current.setVideoElement(videoRef.current);
    }
  }, [videoRef.current]);

  useEffect(() => {
    const originalError = console.error;
    console.error = (...args) => {
      if (typeof args[0] === 'string' && args[0].includes('Created TensorFlow Lite XNNPACK delegate for CPU')) {

        return;
      }

      originalError(...args);
    };

    return () => {
      console.error = originalError;
    };
  }, []);

  const { isLoaded: isModelLoaded, error: ferError,  isProcessing,  startProcessing, stopProcessing } = useFacialProcessor(
    videoRef,
    analysisEngineRef
  );

  const handleFileSelect = (file: File | null) => {
    setPresentationFile(file);
  };

  const panelComponents = useMemo((): PanelComponentMap => ({
    camera: <CameraPanel videoRef={videoRef} isModelLoaded={isModelLoaded} isProcessing={isProcessing} />,
    feedback: <LiveCoachPanel isSessionActive={isSessionActive} feedbackData={feedbackData} />,
    notes: <NotesPanel notes={notes} setNotes={setNotes} />,
    slides: <SlidesPanel file={presentationFile} onFileSelect={handleFileSelect} />
  }), [isSessionActive, feedbackData, isModelLoaded, isProcessing, presentationFile, notes]);

  const getDefaultPanels = (components: PanelComponentMap): WorkspacePanel[] => [
    { id: "camera", title: "Live Camera Feed", component: components.camera, position: { x: 20, y: 20 }, size: { width: 500, height: 375 }, isVisible: true, isMinimized: false, zIndex: 1 },
    { id: "feedback", title: "Live AI Coach", component: components.feedback, position: { x: 540, y: 20 }, size: { width: 320, height: 450 }, isVisible: true, isMinimized: false, zIndex: 1 },
    { id: "notes", title: "Smart Notes Panel", component: components.notes, position: { x: 880, y: 20 }, size: { width: 350, height: 400 }, isVisible: true, isMinimized: false, zIndex: 1 },
    { id: "slides", title: "Presentation Slides", component: components.slides, position: { x: 20, y: 415 }, size: { width: 500, height: 280 }, isVisible: true, isMinimized: false, zIndex: 1 }
  ];

  useEffect(() => {
    const defaultPanels = getDefaultPanels(panelComponents);

    if (!hasLoadedLayout.current) {
      hasLoadedLayout.current = true;
      const savedLayoutJSON = localStorage.getItem('oratory_workspace');
      let initialPanels: WorkspacePanel[];

      if (savedLayoutJSON) {
        try {
          const savedConfigs: PanelConfig[] = JSON.parse(savedLayoutJSON);
          initialPanels = savedConfigs
            .map((config: PanelConfig) => {
              const defaultPanel = defaultPanels.find(p => p.id === config.id);
              if (!defaultPanel) return null;
              return { ...config, title: defaultPanel.title, component: panelComponents[config.id] };
            })
            .filter((panel): panel is WorkspacePanel => panel !== null);
          defaultPanels.forEach(defaultPanel => {
            if (!initialPanels.some(p => p.id === defaultPanel.id)) {
                initialPanels.push(defaultPanel);
            }
          });
        } catch (error) {
          console.error("Failed to parse saved layout, using default.", error);
          initialPanels = defaultPanels;
        }
      } else {
        initialPanels = defaultPanels;
      }
      setPanels(initialPanels);
    } else {
      setPanels(currentPanels =>
        currentPanels.map(panel => ({
          ...panel,
          component: panelComponents[panel.id] || panel.component
        }))
      );
    }
  }, [panelComponents]);

  useEffect(() => {
    if (isSessionActive) {
      feedbackIntervalRef.current = setInterval(() => {
        if (analysisEngineRef.current) {
          const data = analysisEngineRef.current.getLiveFeedback(selectedGoals);
          setFeedbackData(data);
        }
      }, 1000);
    } else {
      if (feedbackIntervalRef.current) clearInterval(feedbackIntervalRef.current);
      setFeedbackData(null);
    }
    return () => {
      if (feedbackIntervalRef.current) clearInterval(feedbackIntervalRef.current);
    };
  }, [isSessionActive, selectedGoals]);

  // useEffect(() => {
  //   if (isSessionActive && timeRemaining > 0) {
  //     timerIntervalRef.current = setInterval(() => {
  //       setTimeRemaining(prevTime => Math.max(0, prevTime - 1));
  //     }, 1000);
  //   } else if (timeRemaining <= 0 && isSessionActive) {
  //     stopSession();
  //   }
  //   return () => {
  //     if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
  //   };
  // }, [isSessionActive, timeRemaining]);

  useEffect(() => {
    if (isSessionActive && timeRemaining > 0) {
      timerIntervalRef.current = setInterval(() => {
        setTimeRemaining(prevTime => {
          if (prevTime <= 1) {
            if (!hasStopped.current) {
              stopSession();
            }
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [isSessionActive, timeRemaining]);

  useEffect(() => {
    if (dragState.isDragging || dragState.isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      }
    }
  }, [dragState, activePanelId]);

  useEffect(() => {
    if (currentView === 'workspace' && !isProcessing && !hasAutoStarted.current) {
        startProcessing();
        hasAutoStarted.current = true;
    }
    else if (currentView === 'config' && isProcessing) {
        stopProcessing();
        hasAutoStarted.current = false;
    }
  }, [currentView, isProcessing, startProcessing, stopProcessing]);

  const resetWorkspace = () => {
    const panelComponents: PanelComponentMap = {
      camera: <CameraPanel videoRef={videoRef} isModelLoaded={isModelLoaded} isProcessing={isProcessing} />,
      feedback: <LiveCoachPanel isSessionActive={isSessionActive} feedbackData={feedbackData} />,
      notes: <NotesPanel notes={notes} setNotes={setNotes} />,
      slides: <SlidesPanel file={presentationFile} onFileSelect={handleFileSelect} />
    };
    setPanels(getDefaultPanels(panelComponents));
    localStorage.removeItem('oratory_workspace');
    alert('Workspace layout has been reset to default.');
  };

  const selectedScenarioData = scenarios.find(s => s.id === selectedScenario);

  const handleScenarioSelect = (scenarioId: string) => {
    setSelectedScenario(scenarioId);
    const scenario = scenarios.find(s => s.id === scenarioId);
    if (scenario) {
      setSelectedGoals([...scenario.suggestedGoals]);
      setPracticeTime(scenario.timeRecommendation);
    }
  };

  const handleGoalToggle = (goal: (typeof facialAnalysisGoals)[number]) => {
    setSelectedGoals(prev => prev.includes(goal) ? prev.filter(g => g !== goal) : [...prev, goal]);
  };

  const handleProceedToWorkspace = () => {
    if (!selectedScenario) {
      alert("Please select a scenario first.");
      return;
    }

    localStorage.setItem('selectedGoals', JSON.stringify(selectedGoals));
    localStorage.setItem('selectedScenario', selectedScenario);

    setCurrentView("workspace");
    const finalTime = practiceTime > 0 ? practiceTime : parseInt(customTime) || 0;
    setTimeRemaining(finalTime * 60);
  };

  const handleBackToConfig = () => {
    if (isSessionActive) stopSession();
    setCurrentView("config");
  };

  const handlePanelToggle = (panelId: string, checked: boolean) => {
    setPanels(prevPanels =>
      prevPanels.map(panel =>
        panel.id === panelId ? { ...panel, isVisible: checked } : panel
      )
    );
  };

  const startSession = () => {
    console.log("[Practice Page] startsession function called.");
    if (!videoRef.current?.srcObject) {
      toast({
      title: "Camera Is not ready",
      description: "Click Camera Icon or Permission.",
      variant: "destructive"
      })
      return;
    }

    analysisEngineRef.current.startSession();


    setIsSessionActive(true);
    console.log("DEBUG: UI Session started.");
  };

  const stopSession = async () => {
    console.log("DEBUG: stopSession function called.");
    if (hasStopped.current) {
      console.log("Blocker: stopSession has already been initiated.");
      return;
    }
    hasStopped.current = true;
    console.log("Action: stopSession initiated.");

    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    setIsSessionActive(false);
    setIsAnalyzing(true);

    try {
      const detailedReport = analysisEngineRef.current.getDetailedReport();
      const backendReport = analysisEngineRef.current.getBackendReport();

      if (!backendReport || (backendReport as any).error) {
        throw new Error((backendReport as any).error || "Failed to generate backend report.");
      }

      const finalReport = generateUnifiedFeedbackReport(backendReport, detailedReport, selectedGoals, selectedScenario);

      const dataToSave = {
        ...finalReport,
        rawReport: backendReport,
        scenarioId: selectedScenario,
      };

      const newSessionId = await saveFeedbackToFirestore(dataToSave);

      console.log("SUCCESS: Full feedback report saved to Firestore with ID:", newSessionId);

      localStorage.setItem("newlyCompletedSessionId", newSessionId);

      router.push("/dashboard/feedback");

    } catch (error: any) {
      console.error("DEBUG: An error occurred in stopSession handler:", error);
      toast({
        title: "Analysis Failed",
        description: error.message || "Could not save your session data.",
        variant: "destructive"
      });
      hasStopped.current = false;
      setIsAnalyzing(false);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const saveWorkspace = () => {
    const panelsToSave = panels.map(panel => ({
      id: panel.id,
      position: panel.position,
      size: panel.size,
      isVisible: panel.isVisible,
      isMinimized: panel.isMinimized,
      zIndex: panel.zIndex
    }));
    localStorage.setItem('oratory_workspace', JSON.stringify(panelsToSave));
    toast({
      title: "✅ Layout Saved",
      description: "Your workspace configuration has been saved successfully.",
      variant: "success"
    })
  };

  const handleMouseDown = (e: React.MouseEvent, panelId: string, action: 'drag' | 'resize', handle?: string) => {
    e.preventDefault();
    e.stopPropagation();

    const panel = panels.find(p => p.id === panelId);
    if (!panel) return;

    setActivePanelId(panelId);

    setPanels(prev => prev.map(p =>
      p.id === panelId
        ? { ...p, zIndex: Math.max(...prev.map(panel => panel.zIndex)) + 1 }
        : p
    ));

    setDragState({
      isDragging: action === 'drag',
      isResizing: action === 'resize',
      dragStart: { x: e.clientX, y: e.clientY },
      initialPosition: { ...panel.position },
      initialSize: { ...panel.size },
      resizeHandle: handle || null
    });
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!activePanelId || (!dragState.isDragging && !dragState.isResizing)) return;

    const deltaX = e.clientX - dragState.dragStart.x;
    const deltaY = e.clientY - dragState.dragStart.y;

    setPanels(prev => prev.map(panel => {
      if (panel.id !== activePanelId) return panel;

      if (dragState.isDragging) {
        const newX = Math.max(0, dragState.initialPosition.x + deltaX);
        const newY = Math.max(0, dragState.initialPosition.y + deltaY);
        const snapSize = 20;
        const snappedX = showGrid ? Math.round(newX / snapSize) * snapSize : newX;
        const snappedY = showGrid ? Math.round(newY / snapSize) * snapSize : newY;
        return { ...panel, position: { x: snappedX, y: snappedY } };
      }

      if (dragState.isResizing) {
        let newWidth = dragState.initialSize.width;
        let newHeight = dragState.initialSize.height;
        if (dragState.resizeHandle?.includes('right')) { newWidth = Math.max(200, dragState.initialSize.width + deltaX) }
        if (dragState.resizeHandle?.includes('left')) { newWidth = Math.max(200, dragState.initialSize.width - deltaX) }
        if (dragState.resizeHandle?.includes('bottom')) { newHeight = Math.max(150, dragState.initialSize.height + deltaY) }
        if (dragState.resizeHandle?.includes('top')) { newHeight = Math.max(150, dragState.initialSize.height - deltaY) }
        return { ...panel, size: { width: newWidth, height: newHeight } };
      }
      return panel;
    }));
  }

  const handleMouseUp = () => {
    setDragState({ isDragging: false, isResizing: false, dragStart: { x: 0, y: 0 }, initialPosition: { x: 0, y: 0 }, initialSize: { width: 0, height: 0 }, resizeHandle: null });
    setActivePanelId(null);
  }

  if (currentView === "config") {
    return (
      <TooltipProvider>
        <div className="space-y-6 p-4 md:p-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-50 dark:bg-blue-950 rounded-full">
              <Globe className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-600">
                Feedback Optimized for South Asian Cultural Contexts
              </span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Intelligent Session Configuration</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Choose your practice scenario and customize your session for culturally-aware AI feedback
            </p>
          </div>

          {/* Scenario Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Select Your Practice Scenario</CardTitle>
              <CardDescription>
                Each scenario provides tailored feedback based on cultural context and expectations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {scenarios.map((scenario) => {
                  const Icon = scenario.icon
                  return (
                    <Tooltip key={scenario.id}>
                      <TooltipTrigger asChild>
                        <Card
                          className={`cursor-pointer transition-all hover:shadow-md ${selectedScenario === scenario.id ? 'ring-2 ring-primary bg-primary/5' : 'hover:bg-accent'}`}
                          onClick={() => handleScenarioSelect(scenario.id)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start space-x-3">
                              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                                <Icon className="w-5 h-5 text-primary" />
                              </div>
                              <div className="flex-1">
                                <h3 className="font-semibold">{scenario.title}</h3>
                                <p className="text-sm text-muted-foreground">{scenario.subtitle}</p>
                                <p className="text-xs text-muted-foreground mt-1">{scenario.description}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="max-w-xs">
                        <p className="text-sm">{scenario.culturalTip}</p>
                      </TooltipContent>
                    </Tooltip>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {selectedScenario && (
            <>
              {/* Goal-Based Customization Here */}
              <Card>
                <CardHeader>
                  <CardTitle>Customize Your Practice Goals</CardTitle>
                  <CardDescription>
                    Select the areas you want to focus on during your practice session
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {facialAnalysisGoals.map((goalId) => (
                      <div key={goalId} className="flex items-center space-x-2">
                        <Checkbox
                          id={goalId}
                          checked={selectedGoals.includes(goalId)}
                          onCheckedChange={() => handleGoalToggle(goalId)}
                        />
                        <Label
                          htmlFor={goalId}
                          className="text-sm cursor-pointer"
                        >
                          {/* --- USE THE HELPER FUNCTION --- */}
                          {getGoalLabel(goalId)}
                        </Label>
                      </div>
                    ))}
                  </div>

                  {selectedGoals.length > 0 && (
                    <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                      <p className="text-sm font-medium mb-2">Selected Goals:</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedGoals.map((goalId) => (
                          <Badge key={goalId} variant="secondary">
                            {/* --- USE THE HELPER FUNCTION --- */}
                            {getGoalLabel(goalId)}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Time Management */}
              <Card>
                <CardHeader><CardTitle>Session Duration</CardTitle><CardDescription>Set your practice session length</CardDescription></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {timeOptions.map((option) => (
                      <Button key={option.value} variant={practiceTime === option.value ? "default" : "outline"} onClick={() => setPracticeTime(option.value)} className="h-12">
                        <div className="text-center"><div className="font-medium">{option.label}</div></div>
                      </Button>
                    ))}
                  </div>
                  {practiceTime === 0 && (
                    <div className="space-y-2">
                      <Label htmlFor="custom-time">Custom Duration (minutes)</Label>
                      <Input id="custom-time" type="number" placeholder="Enter minutes" value={customTime} onChange={(e) => { setCustomTime(e.target.value); setPracticeTime(parseInt(e.target.value) || 0) }} />
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Cultural Context Display */}
              {selectedScenarioData && (
                <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/50">
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-blue-900 dark:text-blue-100">Cultural Context for {selectedScenarioData.title}</h4>
                        <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">{selectedScenarioData.culturalTip}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* CTA Button */}
              <div className="text-center py-4">
                <Button size="lg" onClick={handleProceedToWorkspace} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                  <Settings className="w-5 h-5 mr-2" />
                  Customize Workspace & Prepare
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </>
          )}
        </div>
      </TooltipProvider>
    )
  }

  // --- WORKSPACE VIEW ---
  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Top Control Bar */}
      <div className="bg-card border-b border-border p-2">
        <div className="flex items-center justify-between">
          {/* Left Side */}
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" onClick={handleBackToConfig}>← Back</Button>
            <Separator orientation="vertical" className="h-6" />
            <div className="hidden md:flex items-center space-x-2">
              <Badge variant="outline">{selectedScenarioData?.title || "Practice Session"}</Badge>
              <span className="text-sm text-muted-foreground">{selectedGoals.length} goals selected</span>
            </div>
          </div>

          {/* Right Side */}
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-2 p-2 bg-muted rounded-md">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="font-mono text-lg">{formatTime(timeRemaining)}</span>
            </div>

            {/* --- Popover for Workspace Controls --- */}
            <Popover open={showPanels} onOpenChange={setShowPanels}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="icon" title="Toggle Panels">
                  <LayoutDashboard className="w-4 h-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-60">
                <div className="space-y-4">
                  <h4 className="font-medium leading-none">Workspace Panels</h4>
                  <div className="space-y-2">
                    {panels.map((panel) => (
                      <div key={panel.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={panel.id}
                          checked={panel.isVisible}
                          onCheckedChange={(checked) => handlePanelToggle(panel.id, !!checked)}
                        />
                        <label htmlFor={panel.id} className="text-sm font-medium leading-none capitalize">
                          {panel.title}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {/* --- Popover for Help --- */}
            <Popover open={showHelp} onOpenChange={setShowHelp}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="icon" title="Help">
                  <HelpCircle className="w-4 h-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                  <h4 className="font-medium mb-2">Workspace Controls</h4>
                  <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                    <li>Drag panels by their header to reposition</li>
                    <li>Resize panels by dragging edges or corners</li>
                    <li>Toggle grid snap for precise alignment</li>
                    <li>Save your layout for future sessions</li>
                  </ul>
              </PopoverContent>
            </Popover>

            <Button variant="outline" size="icon" onClick={saveWorkspace} title="Save Layout"><Save className="w-4 h-4" /></Button>
            <Button variant="outline" size="icon" onClick={resetWorkspace} title="Reset Layout"><RotateCcw className="w-4 h-4" /></Button>

            <Separator orientation="vertical" className="h-6" />

            <Button variant={isProcessing ? "default" : "outline"} size="sm" onClick={isProcessing ? stopProcessing : startProcessing}>
                {isProcessing ? <CameraOff className="w-4 h-4" /> : <Camera className="w-4 h-4" />}
            </Button>

            {/* Mic Button is now commented out */}
            {/*
            <Button variant={isMicOn ? "secondary" : "outline"} size="icon" disabled={!isCameraOn} title="Toggle Microphone">
              {isMicOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
            </Button>
            */}

            <Button variant={isSessionActive ? "destructive" : "default"} onClick={isSessionActive ? stopSession : startSession} disabled={!isProcessing} className="w-36">
              {isSessionActive ? (<><Square className="w-4 h-4 mr-2" />Stop Session</>) : (<><Play className="w-4 h-4 mr-2" />Start Session</>)}
            </Button>
          </div>
        </div>
      </div>
      {/* Workspace Area */}
      <div ref={workspaceRef} className={`flex-1 relative bg-muted/20 overflow-hidden ${showGrid ? 'bg-grid-pattern' : ''}`} style={{ backgroundImage: showGrid ? 'radial-gradient(circle, hsl(var(--border)) 1px, transparent 1px)' : 'none', backgroundSize: showGrid ? '20px 20px' : 'auto' }}>
        {panels.filter(panel => panel.isVisible).map((panel) => (
          <div key={panel.id} className="absolute bg-card border border-border rounded-lg shadow-lg select-none" style={{ left: panel.position.x, top: panel.position.y, width: panel.size.width, height: panel.isMinimized ? 40 : panel.size.height, zIndex: panel.zIndex, cursor: dragState.isDragging && activePanelId === panel.id ? 'grabbing' : 'default' }}>
            <div className="flex items-center justify-between p-2 border-b border-border bg-muted/50 rounded-t-lg cursor-grab active:cursor-grabbing" onMouseDown={(e) => handleMouseDown(e, panel.id, 'drag')}>
              <div className="flex items-center space-x-2"><GripVertical className="w-4 h-4 text-muted-foreground" /><span className="text-sm font-medium">{panel.title}</span></div>
              <div className="flex items-center space-x-1">
                <Button variant="ghost" size="sm" className="w-6 h-6 p-0" onClick={() => { setPanels(prev => prev.map(p => p.id === panel.id ? { ...p, isMinimized: !p.isMinimized } : p)) }}>{panel.isMinimized ? <Maximize2 className="w-3 h-3" /> : <Minimize2 className="w-3 h-3" />}</Button>
                <Button variant="ghost" size="sm" className="w-6 h-6 p-0" onClick={() => { setPanels(prev => prev.map(p => p.id === panel.id ? { ...p, isVisible: false } : p)) }}><X className="w-3 h-3" /></Button>
              </div>
            </div>
            {!panel.isMinimized && (<div className="p-4 h-[calc(100%-40px)] overflow-auto">{panel.component}</div>)}
            {!panel.isMinimized && (<>
              <div className="absolute -bottom-1 -right-1 w-3 h-3 cursor-se-resize" onMouseDown={(e) => handleMouseDown(e, panel.id, 'resize', 'bottom-right')} />
            </>)}
          </div>
        ))}
        {isSessionActive && (<div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50"><div className="bg-red-500 text-white px-4 py-2 rounded-full flex items-center space-x-2 animate-pulse"><div className="w-2 h-2 bg-white rounded-full" /> <span className="text-sm font-medium">Recording Session</span></div></div>)}
      </div>
    </div>
  )
}