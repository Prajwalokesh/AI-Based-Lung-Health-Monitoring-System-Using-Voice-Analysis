import { useState } from "react";
import { FileText, Download, CheckCircle, AlertCircle } from "lucide-react";
import { jsPDF } from "jspdf";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// Map ML predictions to medical recommendations
const getPrescriptionForPrediction = (predictedLabel) => {
  const prescriptions = {
    Asthma: {
      diagnosis: "Asthma Indicators Detected",
      severity: "high",
      summary:
        "Voice analysis shows patterns consistent with asthma. Immediate medical evaluation recommended.",
      findings: [
        "Wheezing patterns detected in voice analysis",
        "Restricted airflow indicators",
        "Breathing difficulty patterns observed",
        "Chronic respiratory stress signals",
      ],
      recommendations: [
        "Consult with a pulmonologist for proper diagnosis",
        "Avoid known allergens and environmental triggers",
        "Keep rescue inhaler readily available",
        "Monitor peak flow regularly",
        "Avoid strenuous physical activity until assessed",
        "Stay in clean, dust-free environment",
      ],
      medications: [
        "Quick-relief inhaler (Albuterol) - as prescribed",
        "Long-term controller medication - consult pulmonologist",
        "Corticosteroids if severe - doctor prescribed",
        "Antihistamines for allergy management",
      ],
    },
    Bronchiectasis: {
      diagnosis: "Bronchiectasis Indicators Detected",
      severity: "high",
      summary:
        "Analysis indicates potential bronchiectasis patterns. Medical consultation is strongly recommended.",
      findings: [
        "Chronic coughing patterns detected",
        "Excessive mucus production indicators",
        "Airway damage patterns observed",
        "Persistent respiratory infection signals",
      ],
      recommendations: [
        "Seek immediate medical attention from a respiratory specialist",
        "Begin airway clearance therapy",
        "Regular monitoring and follow-up appointments",
        "Stay well-hydrated to help clear mucus",
        "Avoid smoking and secondhand smoke",
        "Get vaccinated against respiratory infections",
      ],
      medications: [
        "Mucolytics to help clear mucus - as prescribed",
        "Antibiotics if infection present - doctor prescribed",
        "Bronchodilators to open airways",
        "Corticosteroids if needed - consult specialist",
      ],
    },
    Bronchiolitis: {
      diagnosis: "Bronchiolitis Indicators Detected",
      severity: "medium",
      summary:
        "Voice analysis suggests bronchiolitis patterns. Medical evaluation recommended.",
      findings: [
        "Small airway inflammation detected",
        "Wheezing and crackle patterns observed",
        "Respiratory tract irritation indicators",
        "Typical viral infection signature patterns",
      ],
      recommendations: [
        "Consult with healthcare provider for evaluation",
        "Get adequate rest and sleep",
        "Stay well-hydrated",
        "Monitor symptoms closely",
        "Avoid smoke and air pollutants",
        "Use humidifier to ease breathing",
      ],
      medications: [
        "Bronchodilators as needed - doctor prescribed",
        "Cough suppressants for symptomatic relief",
        "Fever reducers if temperature elevated",
        "Antiviral medications if applicable",
      ],
    },
    Pneumonia: {
      diagnosis: "Pneumonia Indicators Detected",
      severity: "high",
      summary:
        "Analysis indicates patterns that may be consistent with pneumonia. Medical evaluation is recommended as soon as possible.",
      findings: [
        "Lower respiratory infection indicators detected",
        "Possible lung inflammation patterns",
        "Breathing abnormality signals observed",
        "Respiratory distress risk markers present",
      ],
      recommendations: [
        "Seek prompt medical evaluation",
        "Rest and avoid strenuous activity",
        "Stay hydrated and monitor temperature",
        "Track breathing changes closely",
        "Avoid smoke, dust, and cold air",
        "Follow a clinician's guidance for treatment",
      ],
      medications: [
        "Antibiotics if bacterial infection is confirmed - doctor prescribed",
        "Fever reducers for symptom relief",
        "Cough relief medications as advised by a clinician",
        "Oxygen support if recommended by a healthcare provider",
      ],
    },
    COPD: {
      diagnosis: "COPD (Chronic Obstructive Pulmonary Disease) Indicators",
      severity: "high",
      summary:
        "Analysis reveals COPD patterns. Urgent medical consultation is essential.",
      findings: [
        "Persistent obstruction of airflow detected",
        "Emphysema or chronic bronchitis patterns",
        "Long-term lung damage indicators",
        "Progressive respiratory decline signals",
      ],
      recommendations: [
        "Schedule urgent appointment with pulmonologist",
        "Quit smoking immediately if applicable",
        "Begin pulmonary rehabilitation program",
        "Monitor oxygen saturation regularly",
        "Exercise within limitations to maintain fitness",
        "Maintain clean home environment",
      ],
      medications: [
        "Long-acting bronchodilators - as prescribed",
        "Inhaled corticosteroids - doctor prescribed",
        "Short-acting beta-agonists for acute symptoms",
        "Phosphodiesterase-4 inhibitors if needed",
      ],
    },
    LRTI: {
      diagnosis: "Lower Respiratory Tract Infection (LRTI) Detected",
      severity: "medium",
      summary:
        "Analysis indicates lower respiratory tract infection patterns. Medical evaluation recommended.",
      findings: [
        "Lower airway inflammation detected",
        "Productive cough patterns observed",
        "Bacterial or viral infection indicators",
        "Lung tissue involvement signals",
      ],
      recommendations: [
        "Consult with healthcare provider for diagnosis",
        "Get complete rest and avoid strenuous activity",
        "Drink plenty of fluids",
        "Use steam inhalation to relieve symptoms",
        "Monitor temperature and symptoms",
        "Cover mouth when coughing",
      ],
      medications: [
        "Antibiotics if bacterial - doctor prescribed",
        "Cough expectorant to clear mucus",
        "Pain relievers for throat discomfort",
        "Fever reducers as needed",
      ],
    },
    URTI: {
      diagnosis: "Upper Respiratory Tract Infection (URTI) Detected",
      severity: "low",
      summary:
        "Analysis shows upper respiratory tract infection patterns. Rest and monitoring recommended.",
      findings: [
        "Upper airway inflammation detected",
        "Nasal or throat involvement observed",
        "Typical viral infection signature",
        "Mild respiratory distress indicators",
      ],
      recommendations: [
        "Rest and allow body to recover naturally",
        "Stay hydrated with warm fluids",
        "Use honey or lozenges for throat relief",
        "Gargle with salt water",
        "Monitor symptoms for improvement",
        "Avoid close contact with others to prevent spread",
      ],
      medications: [
        "Over-the-counter pain relievers as needed",
        "Decongestants for congestion relief",
        "Cough drops for throat soothing",
        "Vitamin C supplements",
      ],
    },
    Healthy: {
      diagnosis: "Normal Respiratory Function",
      severity: "low",
      summary:
        "Your respiratory system appears to be functioning normally. No immediate concerns detected.",
      findings: [
        "Clear breathing patterns observed",
        "No signs of respiratory distress",
        "Voice quality is normal",
        "Lung function appears healthy",
      ],
      recommendations: [
        "Continue maintaining a healthy lifestyle",
        "Stay hydrated and get adequate rest",
        "Regular exercise to maintain lung health",
        "Monitor any changes in breathing patterns",
        "Avoid smoking and secondhand smoke",
      ],
      medications: [],
    },
  };

  return prescriptions[predictedLabel] || prescriptions.Healthy;
};

export default function ResultsDisplay({ analysisData }) {
  const [results] = useState(() => {
    if (analysisData?.result?.predicted_label) {
      const prescription = getPrescriptionForPrediction(
        analysisData.result.predicted_label,
      );
      return {
        ...prescription,
        date: new Date().toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
        reportId: `RP${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        predictionLabel: analysisData.result.predicted_label,
        prediction: analysisData.result,
      };
    }
    return {
      diagnosis: "Normal Respiratory Function",
      severity: "low",
      summary:
        "Your respiratory system appears to be functioning normally. No immediate concerns detected.",
      findings: [
        "Clear breathing patterns observed",
        "No signs of respiratory distress",
        "Voice quality is normal",
        "Lung function appears healthy",
      ],
      recommendations: [
        "Continue maintaining a healthy lifestyle",
        "Stay hydrated and get adequate rest",
        "Regular exercise to maintain lung health",
        "Monitor any changes in breathing patterns",
      ],
      medications: [],
      date: new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      reportId: `RP${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      predictionLabel: "Healthy",
    };
  });

  const getSeverityColor = (severity) => {
    switch (severity) {
      case "low":
        return "bg-green-500";
      case "medium":
        return "bg-yellow-500";
      case "high":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getSeverityIcon = (severity) => {
    return severity === "low" ? CheckCircle : AlertCircle;
  };

  const downloadReport = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const lineHeight = 7;
    let yPosition = margin;

    // Helper function to add text with word wrap
    const addText = (
      text,
      fontSize = 10,
      isBold = false,
      color = [0, 0, 0],
    ) => {
      doc.setFontSize(fontSize);
      doc.setTextColor(color[0], color[1], color[2]);
      if (isBold) {
        doc.setFont(undefined, "bold");
      } else {
        doc.setFont(undefined, "normal");
      }

      const lines = doc.splitTextToSize(text, pageWidth - 2 * margin);
      lines.forEach((line) => {
        if (yPosition > pageHeight - margin) {
          doc.addPage();
          yPosition = margin;
        }
        doc.text(line, margin, yPosition);
        yPosition += lineHeight;
      });
    };

    const addSpace = (space = 5) => {
      yPosition += space;
    };

    // Header
    doc.setFillColor(16, 185, 129); // emerald-500
    doc.rect(0, 0, pageWidth, 30, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont(undefined, "bold");
    doc.text("Health Analysis Report", margin, 20);

    yPosition = 40;

    // Report Info
    addText(`Report ID: ${results.reportId}`, 10, true);
    addText(`Date: ${results.date}`, 10);
    addText(`Generated by HealthVoice AI`, 9, false, [107, 114, 128]);
    addSpace(10);

    // Prediction Summary Section
    doc.setFillColor(236, 253, 245); // emerald-50
    doc.rect(margin - 5, yPosition - 5, pageWidth - 2 * margin + 10, 25, "F");
    addText("Prediction Summary", 14, true, [16, 185, 129]);
    addSpace(2);
    addText(`Predicted Condition: ${results.predictionLabel}`, 11);
    addSpace(10);

    // Diagnosis Section
    addText("Diagnosis", 14, true, [16, 185, 129]);
    addSpace(2);
    addText(results.diagnosis, 12, true);
    addSpace(3);
    addText(results.summary, 10);
    addSpace(10);

    // Key Findings Section
    addText("Key Findings", 14, true, [16, 185, 129]);
    addSpace(2);
    results.findings.forEach((finding) => {
      addText(`• ${finding}`, 10);
    });
    addSpace(10);

    // Recommendations Section
    addText("Recommendations", 14, true, [16, 185, 129]);
    addSpace(2);
    results.recommendations.forEach((rec) => {
      addText(`• ${rec}`, 10);
    });
    addSpace(10);

    // Medications Section
    addText("Suggested Medications", 14, true, [16, 185, 129]);
    addSpace(2);
    if (results.medications.length > 0) {
      results.medications.forEach((med) => {
        addText(`• ${med}`, 10);
      });
    } else {
      addText(
        "No medications required at this time.",
        10,
        false,
        [107, 114, 128],
      );
    }
    addSpace(15);

    // Footer Note
    doc.setFillColor(254, 252, 232); // yellow-50
    doc.rect(margin - 5, yPosition - 2, pageWidth - 2 * margin + 10, 20, "F");
    addText("⚠ Important Note:", 10, true, [202, 138, 4]);
    addText(
      "This is an AI-generated analysis. Please consult with a healthcare professional for proper medical advice and treatment.",
      9,
      false,
      [113, 63, 18],
    );

    // Save the PDF
    doc.save(`health-report-${results.reportId}.pdf`);
  };

  const SeverityIcon = getSeverityIcon(results.severity);

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="bg-linear-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border-2">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-2xl mb-2 flex items-center gap-2">
                <FileText className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                Health Analysis Report
              </CardTitle>
              <CardDescription className="text-base">
                Report ID: {results.reportId} • Generated on {results.date}
              </CardDescription>
            </div>
            <Button
              onClick={downloadReport}
              variant="outline"
              className="ml-4 hidden sm:flex"
            >
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Predicted Condition
              </p>
              <p className="font-semibold text-gray-900 dark:text-white">
                {results.predictionLabel}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Report Date</p>
              <p className="font-semibold text-gray-900 dark:text-white">
                {results.date}
              </p>
            </div>
          </div>

          {/* Download button for mobile - at bottom */}
          <div className="mt-6 sm:hidden">
            <Button
              onClick={downloadReport}
              variant="outline"
              className="w-full"
            >
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Diagnosis Card */}
      <Card className="border-l-4 border-l-emerald-500">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">Diagnosis</CardTitle>
            <Badge
              className={`${getSeverityColor(
                results.severity,
              )} text-white flex items-center gap-1`}
            >
              <SeverityIcon className="h-3 w-3" />
              {results.severity === "low"
                ? "Normal"
                : results.severity === "medium"
                  ? "Monitor"
                  : "Urgent"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
            {results.diagnosis}
          </h3>
          <p className="text-gray-600 dark:text-gray-300 text-lg">
            {results.summary}
          </p>
        </CardContent>
      </Card>

      {/* Findings Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Key Findings</CardTitle>
          <CardDescription>
            Analysis detected the following patterns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {results.findings.map((finding, index) => (
              <li key={index} className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-emerald-500 mt-2 shrink-0"></div>
                <span className="text-gray-700 dark:text-gray-300">
                  {finding}
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Recommendations Card */}
      <Card className="border-l-4 border-l-green-500">
        <CardHeader>
          <CardTitle className="text-xl">Recommendations</CardTitle>
          <CardDescription>
            Follow these guidelines for better health
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {results.recommendations.map((rec, index) => (
              <li key={index} className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                <span className="text-gray-700 dark:text-gray-300">{rec}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Medications Card */}
      {results.medications.length > 0 && (
        <Card className="border-l-4 border-l-purple-500">
          <CardHeader>
            <CardTitle className="text-xl">Suggested Medications</CardTitle>
            <CardDescription>
              Consult with a doctor before taking any medication
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {results.medications.map((med, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-teal-500 mt-2 shrink-0"></div>
                  <span className="text-gray-700 dark:text-gray-300">
                    {med}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Disclaimer */}
      <Card className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
        <CardContent>
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-yellow-900 dark:text-yellow-100 mb-1">
                Important Disclaimer
              </p>
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                This is an AI-generated analysis and should not replace
                professional medical advice. Please consult with a qualified
                healthcare provider for proper diagnosis and treatment.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
