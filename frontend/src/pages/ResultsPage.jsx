import { useLocation, Link } from "react-router-dom";
import ResultsDisplay from "@/components/ResultsDisplay";
import { Button } from "@/components/ui/button";

export default function ResultsPage() {
  const location = useLocation();
  const analysisData = location.state?.analysisData;

  // Redirect if no analysis data
  if (!analysisData) {
    return (
      <div className="min-h-screen bg-linear-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            No Analysis Data Found
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Please complete the analysis form first to view results.
          </p>
          <Link to="/analyze" className="cursor-pointer">
            <Button>Go to Analysis</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Page Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold mb-4 text-gray-900 dark:text-white">
            Your Health
            <span className="bg-linear-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400 bg-clip-text text-transparent">
              {" "}
              Analysis Results
            </span>
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Review your comprehensive health report below
          </p>
        </div>

        {/* Results Display */}
        <div className="max-w-4xl mx-auto space-y-6">
          <ResultsDisplay analysisData={analysisData} />
        </div>

        {/* Actions */}
        <div className="max-w-4xl mx-auto mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/analyze" className="cursor-pointer">
            <Button size="lg" variant="outline" className="w-full sm:w-auto">
              Start New Analysis
            </Button>
          </Link>
          <Link to="/" className="cursor-pointer">
            <Button size="lg" className="w-full sm:w-auto">
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
