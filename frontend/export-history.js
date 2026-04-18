/**
 * Export Assessment History to JSON
 * This script exports the assessment history from localStorage to a JSON file
 * Can be run in browser console or embedded in the app
 */

function exportAssessmentHistoryToFile() {
  // Get assessment history from localStorage
  const assessmentHistory = JSON.parse(localStorage.getItem("assessmentHistory")) || [];
  
  if (assessmentHistory.length === 0) {
    alert("No assessment history to export!");
    return;
  }

  // Convert to JSON format for Streamlit dashboard
  const exportData = assessmentHistory.map((entry, index) => ({
    id: index,
    date: entry.date,
    time: entry.time,
    disease: entry.disorderType,
    diseaseName: entry.diseaseName,
    risk_level: entry.riskLevel,
    risk_score: entry.riskScore,
    age: entry.age,
    cognitive_score: entry.cognitiveScore
  }));

  // Create JSON blob
  const jsonString = JSON.stringify(exportData, null, 2);
  const blob = new Blob([jsonString], { type: "application/json" });
  const url = window.URL.createObjectURL(blob);
  
  // Create download link
  const a = document.createElement("a");
  a.href = url;
  a.download = `assessment_history_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  
  window.URL.revokeObjectURL(url);
  console.log("Assessment history exported successfully!");
  alert(`Exported ${exportData.length} assessment records!`);
}

// Make function available globally
window.exportAssessmentHistoryToFile = exportAssessmentHistoryToFile;

// Also auto-save to a temporary file location when assessments are made
function autoSaveToBackend() {
  const assessmentHistory = JSON.parse(localStorage.getItem("assessmentHistory")) || [];
  
  // Transform data for dashboard
  const dashboardData = assessmentHistory.map((entry, index) => {
    // Generate synthetic but realistic biomarker data based on risk
    const riskFactor = {
      'low': { biomarker_1: [0.5, 1.2], biomarker_2: [0.3, 0.8], mri_score: [0.1, 0.4], eeg_score: [0.1, 0.3] },
      'moderate': { biomarker_1: [1.0, 1.8], biomarker_2: [0.6, 1.3], mri_score: [0.3, 0.6], eeg_score: [0.3, 0.6] },
      'high': { biomarker_1: [1.5, 2.5], biomarker_2: [1.0, 2.0], mri_score: [0.5, 0.9], eeg_score: [0.5, 0.8] }
    };
    
    const risk = entry.riskLevel;
    const ranges = riskFactor[risk] || riskFactor['low'];
    
    return {
      id: index,
      date: entry.date,
      time: entry.time,
      disease: entry.disorderType,
      diseaseName: entry.diseaseName,
      risk_level: entry.riskLevel,
      risk_score: entry.riskScore,
      age: entry.age,
      cognitive_score: entry.cognitiveScore,
      biomarker_1: Math.random() * (ranges.biomarker_1[1] - ranges.biomarker_1[0]) + ranges.biomarker_1[0],
      biomarker_2: Math.random() * (ranges.biomarker_2[1] - ranges.biomarker_2[0]) + ranges.biomarker_2[0],
      mri_score: Math.random() * (ranges.mri_score[1] - ranges.mri_score[0]) + ranges.mri_score[0],
      eeg_score: Math.random() * (ranges.eeg_score[1] - ranges.eeg_score[0]) + ranges.eeg_score[0]
    };
  });
  
  return dashboardData;
}

console.log("Assessment export utilities loaded!");
console.log("Call exportAssessmentHistoryToFile() to download history as JSON");
