import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Loader2 } from "lucide-react";
import AudioInput from "@/components/AudioInput";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function AnalyzePage() {
  const navigate = useNavigate();
  const [audioBlob, setAudioBlob] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let interval;
    if (isAnalyzing) {
      setProgress(0);
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 95) {
            return prev;
          }
          return prev + 1;
        });
      }, 30);
    } else {
      setProgress(0);
    }
    return () => clearInterval(interval);
  }, [isAnalyzing]);

  const isFormValid = () => !!audioBlob;

  const handleAnalyze = async () => {
    if (!isFormValid()) {
      alert("Please fill in all required fields and provide audio input");
      return;
    }

    setIsAnalyzing(true);

    try {
      const formData = new FormData();

      const file =
        audioBlob instanceof File
          ? audioBlob
          : new File([audioBlob], "recording.wav", {
              type: audioBlob?.type || "audio/wav",
            });
      formData.append("file", file, file.name || "recording.wav");

      const response = await fetch("http://127.0.0.1:4000/api/analysis/recommend", {
        method: "POST",
        body: formData,
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.message || "Analysis request failed");
      }

      setProgress(100);
      navigate("/results", {
        state: {
          analysisData: payload?.data ?? payload,
        },
      });
    } catch (error) {
      console.error(error);
      alert(error.message || "Failed to analyze audio");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Page Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold mb-4 text-gray-900 dark:text-white">
            Health Analysis
            <span className="bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400 bg-clip-text text-transparent">
              {" "}
              Dashboard
            </span>
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Upload or record audio to get your respiratory analysis
          </p>
        </div>

        {/* Analysis Form */}
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Audio Input */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center text-white font-bold">
                1
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Audio Input
              </h2>
            </div>
            <AudioInput onAudioChange={setAudioBlob} />
          </div>

          {/* Analyze Button */}
          <Card className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border-2">
            <CardContent>
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-1">
                    Ready to Analyze?
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {isFormValid()
                      ? "Audio is ready. Click analyze to get your results."
                      : "Please provide an audio sample before analyzing."}
                  </p>
                </div>
                <Button
                  size="lg"
                  onClick={handleAnalyze}
                  disabled={!isFormValid() || isAnalyzing}
                  className="w-full sm:w-auto bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      Analyze Health
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Processing Indicator */}
          {isAnalyzing && (
            <Card className="border-2 border-emerald-200 dark:border-emerald-800">
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="shrink-0">
                    <Loader2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400 animate-spin" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                      Processing Your Audio...
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Our AI model is analyzing your voice patterns. This may
                      take a few moments.
                    </p>
                  </div>
                </div>
                <div className="mt-4 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
