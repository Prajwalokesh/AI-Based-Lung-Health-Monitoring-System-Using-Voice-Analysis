import { useState, useRef, useEffect } from "react";
import { Mic, Square, Upload, Trash2, Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function AudioInput({ onAudioChange }) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioURL, setAudioURL] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const audioRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioURL) URL.revokeObjectURL(audioURL);
    };
  }, [audioURL]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/wav" });
        const url = URL.createObjectURL(blob);
        setAudioBlob(blob);
        setAudioURL(url);
        setUploadedFileName("");
        onAudioChange?.(blob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      alert("Could not access microphone. Please check permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setAudioBlob(file);
      setAudioURL(url);
      setUploadedFileName(file.name);
      setRecordingTime(0);
      onAudioChange?.(file);
    }
  };

  const clearAudio = () => {
    if (audioURL) URL.revokeObjectURL(audioURL);
    setAudioBlob(null);
    setAudioURL(null);
    setRecordingTime(0);
    setUploadedFileName("");
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    onAudioChange?.(null);
  };

  const togglePlayback = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleProgressClick = (e) => {
    if (audioRef.current) {
      const progressBar = e.currentTarget;
      const clickPosition = e.nativeEvent.offsetX;
      const progressBarWidth = progressBar.offsetWidth;
      const clickPercentage = clickPosition / progressBarWidth;
      const newTime = clickPercentage * duration;
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mic className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          Audio Input
        </CardTitle>
        <CardDescription>
          Record your voice or upload an audio file for analysis
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!audioBlob ? (
          <>
            {/* Recording Section
            <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg border-gray-300 dark:border-gray-600">
              {!isRecording ? (
                <>
                  <Button
                    size="lg"
                    onClick={startRecording}
                    className="mb-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
                  >
                    <Mic className="mr-2 h-5 w-5" />
                    Start Recording
                  </Button>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Click to start recording your voice
                  </p>
                </>
              ) : (
                <>
                  <div className="relative mb-4">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center animate-pulse">
                      <Mic className="h-10 w-10 text-white" />
                    </div>
                  </div>
                  <Badge className="mb-4 text-lg px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white">
                    {formatTime(recordingTime)}
                  </Badge>
                  <Button size="lg" variant="outline" onClick={stopRecording}>
                    <Square className="mr-2 h-5 w-5" />
                    Stop Recording
                  </Button>
                </>
              )}
            </div> */}

            {/* Divider */}
            {/* <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-card text-gray-500 dark:text-gray-400">
                  OR
                </span>
              </div>
            </div> */}

            {/* Upload Section */}
            <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg border-gray-300 dark:border-gray-600">
              <Upload className="h-12 w-12 text-gray-400 mb-4" />
              <label htmlFor="audio-upload">
                <Button variant="outline" className="mb-2" asChild>
                  <span>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Audio File
                  </span>
                </Button>
              </label>
              <input
                id="audio-upload"
                type="file"
                accept="audio/*"
                className="hidden"
                onChange={handleFileUpload}
              />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Supports MP3, WAV, and other audio formats
              </p>
            </div>
          </>
        ) : (
          <>
            {/* Audio Preview */}
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 p-6 rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-white mb-1">
                    {uploadedFileName || "Recorded Audio"}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Ready for analysis
                  </p>
                </div>
                <Badge className="bg-green-500">Ready</Badge>
              </div>

              {/* Audio Player */}
              <audio
                ref={audioRef}
                src={audioURL}
                onEnded={() => setIsPlaying(false)}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                className="hidden"
              />

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  className={"rounded-full"}
                  size="icon"
                  onClick={togglePlayback}
                >
                  {isPlaying ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                </Button>
                <div className="flex-1 flex items-center gap-2">
                  <span className="text-xs text-gray-600 dark:text-gray-400 min-w-[35px]">
                    {formatTime(currentTime)}
                  </span>
                  <div
                    className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden cursor-pointer"
                    onClick={handleProgressClick}
                  >
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-75 ease-linear"
                      style={{ width: `${progressPercentage}%` }}
                    ></div>
                  </div>
                  <span className="text-xs text-gray-600 dark:text-gray-400 min-w-[35px]">
                    {formatTime(duration)}
                  </span>
                </div>
                <Button
                  variant="destructive"
                  className={"rounded-full opacity-70 hover:opacity-95"}
                  size="icon"
                  onClick={clearAudio}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
