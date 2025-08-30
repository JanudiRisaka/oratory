"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { scenarios, facialAnalysisGoals, getGoalLabel } from "@/app/config/practiceConfig";
import { toast } from "sonner";
import { processUploadedVideo } from "@/features/facial-analysis/engine/fileProcessor";
import { generateUnifiedFeedbackReport } from "../feedback/reportGenerator";
import { saveFeedbackToFirestore } from "@/lib/firebase/services/sessionService";
import type { FeedbackHistoryItem } from "@/features/facial-analysis/types";

export default function UploadPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);

  const [uploadScenario, setUploadScenario] = useState("");
  const [uploadGoals, setUploadGoals] = useState<(typeof facialAnalysisGoals)[number][]>([]);

  const handleUploadClick = () => {
    if (isAnalyzing) return;
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("video/")) {
      toast.error("Invalid File Type", { description: "Please upload a valid video file (e.g., MP4, WebM)." });
      return;
    }

    setFileToUpload(file);
    setUploadScenario(scenarios[0].id);
    setUploadGoals([...scenarios[0].suggestedGoals]);
    setShowUploadDialog(true);

    event.target.value = "";
  };

  const handleSubmitForAnalysis = async () => {
    if (!fileToUpload || !uploadScenario) return;

    setIsAnalyzing(true);
    setShowUploadDialog(false);

    try {
      toast.info("Starting Analysis", { description: "This may take a minute depending on the video length..." });

      const { backendReport, detailedReport } = await processUploadedVideo(fileToUpload);

      const unifiedReport = generateUnifiedFeedbackReport(backendReport, detailedReport, uploadGoals, uploadScenario);

      const dataToSave: Omit<FeedbackHistoryItem, 'id' | 'createdAt'> = {

        overallScore: unifiedReport.overallScore,
        positivityScore: unifiedReport.positivityScore,
        steadinessScore: unifiedReport.steadinessScore,
        expressivenessScore: unifiedReport.expressivenessScore,
        date: unifiedReport.date,
        session: unifiedReport.session,
        duration: unifiedReport.duration,
        keyInsights: unifiedReport.keyInsights,
        actionItems: unifiedReport.actionItems,

        rawReport: backendReport,
        scenarioId: uploadScenario,
      };
      const newSessionId = await saveFeedbackToFirestore(dataToSave);
      console.log("SUCCESS: Uploaded session saved to Firestore with ID:", newSessionId);

      localStorage.setItem("newlyCompletedSessionId", newSessionId);
      router.push('/dashboard/feedback');

    } catch (error: any) {
      toast.error("Analysis Failed", { description: error.message || "Could not process the video." });
      setIsAnalyzing(false);
      setFileToUpload(null);
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-8">
      {/* --- Upload Dialog --- */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Prepare Your Recording</DialogTitle>
            <DialogDescription>
              Select the scenario that best matches your video to get tailored feedback.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="scenario">Practice Scenario</Label>
              <Select value={uploadScenario} onValueChange={(value) => {
                  setUploadScenario(value);
                  const scenario = scenarios.find(s => s.id === value);
                  if (scenario) setUploadGoals([...scenario.suggestedGoals]);
              }}>
                <SelectTrigger><SelectValue placeholder="Select a scenario" /></SelectTrigger>
                <SelectContent>
                  {scenarios.map(s => <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Focus Goals (Optional)</Label>
              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 border rounded-md">
                {facialAnalysisGoals.map(goalId => (
                <div key={goalId} className="flex items-center space-x-2">
                  <Checkbox
                    id={`goal-${goalId}`}
                    checked={uploadGoals.includes(goalId)}
                    onCheckedChange={(checked) => {
                      setUploadGoals(prev => checked ? [...prev, goalId] : prev.filter(g => g !== goalId));
                    }}
                  />
                  <label htmlFor={`goal-${goalId}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    {/* --- USE THE HELPER FUNCTION --- */}
                    {getGoalLabel(goalId)}
                  </label>
                </div>
              ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUploadDialog(false)}>Cancel</Button>
            <Button onClick={handleSubmitForAnalysis} disabled={!uploadScenario}>
              Analyze Session
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- Main Page Content --- */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Upload Recording</h1>
          <p className="text-muted-foreground">Get post-session feedback on a pre-recorded video.</p>
        </div>
      </div>

      <Card
        className="group hover:shadow-lg transition-shadow border-2 border-dashed hover:border-primary cursor-pointer min-h-[300px] flex items-center justify-center"
        onClick={handleUploadClick}
      >
        <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} accept="video/mp4,video/webm" disabled={isAnalyzing}/>
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center text-center">
            {isAnalyzing ? (
              <>
                <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
                <p className="font-semibold text-primary">Analyzing Your Video...</p>
                <p className="text-sm text-muted-foreground">This may take a moment.</p>
              </>
            ) : (
              <>
                <Upload className="w-12 h-12 text-muted-foreground group-hover:text-primary transition-colors mb-4" />
                <p className="font-semibold text-lg">Click to Upload a Recording</p>
                <p className="text-sm text-muted-foreground">MP4 or WebM files are supported</p>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}