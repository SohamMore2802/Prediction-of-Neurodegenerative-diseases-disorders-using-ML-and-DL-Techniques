# 🧠 NeuroCognitive Analytics Dashboard

A comprehensive Streamlit-based analytics and visualization dashboard for the NeuroCognitive Insights ML screening platform.

## Features

### 📊 Dashboard Overview
- **Real-time Analytics** - Monitor assessment metrics and trends
- **Interactive Visualizations** - Explore data with Plotly charts
- **Disease-Specific Analysis** - Detailed breakdowns for each neurological condition
- **Biomarker Tracking** - Visualize ELISA, MRI, and EEG measurements
- **Advanced Filtering** - Filter by disease, risk level, age, and date range

### 🎯 Key Metrics
- Total assessments across all diseases
- High-risk case identification
- Average risk scores by disease
- Demographic insights (age, cognitive scores)
- Temporal trends and patterns

### 📈 Visualizations Included

1. **Risk Level Distribution** (Donut Chart)
   - Breakdown of low, moderate, and high-risk assessments

2. **Disease Assessment Count** (Bar Chart)
   - Number of assessments per disease

3. **Risk Score Trends** (Line Chart)
   - Risk progression over time by disease

4. **Risk Score Distribution** (Histogram)
   - Statistical distribution of risk scores

5. **Disease-Specific Tabs**
   - Risk level breakdown
   - Age vs Risk Score scatter plot
   - Custom metrics for each disease

6. **Biomarker Analysis** (Box Plots)
   - ELISA Biomarker 1 & 2
   - MRI Severity Scores
   - EEG Anomaly Scores

7. **Detailed Data Table**
   - Sortable, filterable assessment records

## Installation

### Prerequisites
- Python 3.8+
- FastAPI backend running on `http://localhost:8000`

### Setup

1. Install required packages:
```bash
pip install streamlit plotly pandas numpy requests
```

2. Run the dashboard:
```bash
streamlit run dashboard.py
```

3. Open your browser to:
```
http://localhost:8501
```

## Data Sources

The dashboard can fetch data from multiple sources:

### Option 1: Export from Frontend (Recommended)
1. Go to any disease workspace (Alzheimer's, Parkinson's, etc.)
2. Open browser console (F12 → Console)
3. Run: `exportAssessmentHistoryToFile()`
4. Save the downloaded JSON file to `c:\R&I\assessment_history.json`
5. Refresh the dashboard

### Option 2: Live API Integration
The dashboard includes mock data generation by default but can be extended to:
- Connect directly to the FastAPI backend
- Stream real-time assessment data
- Query historical assessments from a database

## Dashboard Controls

### Sidebar Filters
- **Select Diseases** - Choose one or more neurological conditions
- **Risk Levels** - Filter by low, moderate, or high risk
- **Age Range** - Adjust minimum and maximum age
- **Date Range** - Select time period for analysis

### Data Export
All filtered data can be viewed in the detailed table at the bottom of the dashboard. Use your browser's developer tools to export or copy the data.

## Customization

### Add New Diseases
Edit the `get_disease_name()` function to add support for new diseases:
```python
names = {
    'alzheimers': "Alzheimer's Disease",
    'parkinsons': "Parkinson's Disease",
    'als': "ALS",
    'huntington': "Huntington's Disease",
    'custom_disease': "Custom Disease Name"  # Add here
}
```

### Modify Color Scheme
Update the `risk_colors` dictionary:
```python
risk_colors = {
    'low': '#22c55e',      # Green
    'moderate': '#f97316', # Orange
    'high': '#ef4444'      # Red
}
```

### Add New Visualizations
Add custom charts in the visualization sections:
```python
fig_custom = go.Figure(data=[
    go.Bar(x=categories, y=values)
])
st.plotly_chart(fig_custom, use_container_width=True)
```

## File Structure

```
c:\R&I\
├── dashboard.py                 # Main Streamlit app
├── frontend/
│   ├── app.js
│   ├── export-history.js       # Export utility (NEW)
│   ├── alzheimers.html
│   ├── parkinsons.html
│   ├── als.html
│   └── huntington.html
├── backend/
│   └── main.py
└── assessment_history.json     # Data file (generated from export)
```

## Performance Tips

1. **For Large Datasets** - Use date range filters to reduce data volume
2. **Export Regularly** - Keep assessment history file updated
3. **Cache Data** - Consider implementing Streamlit caching for faster loads
4. **Optimize Charts** - Use sampling for large datasets

## Technical Stack

- **Framework**: Streamlit
- **Visualization**: Plotly
- **Data Processing**: Pandas, NumPy
- **Styling**: Custom CSS with dark theme
- **Data Source**: LocalStorage (Browser) → JSON Export

## API Integration (Future)

The dashboard can be extended to connect directly to the FastAPI backend:

```python
import requests

@st.cache_data
def fetch_assessments():
    response = requests.get('http://localhost:8000/assessments')
    return response.json()
```

## Troubleshooting

### Dashboard won't start
```bash
streamlit run dashboard.py --logger.level=debug
```

### No data showing
- Ensure `assessment_history.json` exists
- Run export from browser console: `exportAssessmentHistoryToFile()`
- Check file path: `c:\R&I\assessment_history.json`

### Charts not displaying
- Clear Streamlit cache: `streamlit cache clear`
- Restart dashboard: `Ctrl+C` then run again

## Usage Examples

### Generate Sample Report
1. Start dashboard with mock data
2. Filter by disease and date range
3. Export table data for report generation

### Track Disease Progression
1. Set date range for follow-up period
2. View trend lines showing risk score changes
3. Compare biomarker values across time

### Risk Stratification
1. Filter by high-risk cases
2. Analyze demographics (age, cognitive scores)
3. Identify patterns in biomarker values

## Security & Privacy

- **Local Data**: All data is stored in browser localStorage
- **Export Control**: Users control when/how data is exported
- **Research Use**: Dashboard marked for research and educational use only
- **No Cloud Storage**: Data stays on local machine

## Contributing

To extend the dashboard:

1. Add new metrics to KPI section
2. Create custom visualizations
3. Integrate with backend API
4. Add statistical analyses
5. Implement predictive models

## License

Research and Educational Use Only

## Support

For issues or questions:
1. Check browser console for errors (F12)
2. Review Streamlit logs: `streamlit run dashboard.py --logger.level=debug`
3. Verify FastAPI backend is running on port 8000
4. Ensure all dependencies are installed
