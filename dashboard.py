import streamlit as st
import pandas as pd
import numpy as np
import plotly.graph_objects as go
import plotly.express as px
from datetime import datetime, timedelta
import json
from collections import defaultdict

# Page configuration
st.set_page_config(
    page_title="NeuroCognitive Analytics Dashboard",
    page_icon="🧠",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS for better styling
st.markdown("""
    <style>
    .main {
        background-color: #0f172a;
        color: #f9fafb;
    }
    .stMetric {
        background-color: rgba(15, 23, 42, 0.6);
        padding: 20px;
        border-radius: 12px;
        border: 1px solid rgba(99, 102, 241, 0.2);
    }
    .metric-label {
        color: #cbd5e1;
        font-weight: 600;
    }
    h1, h2, h3 {
        color: #e0e7ff;
    }
    .stSelectbox, .stMultiSelect {
        color: #f9fafb;
    }
    </style>
""", unsafe_allow_html=True)

# Load assessment data from localStorage (simulated via file)
def load_assessment_history():
    """Load assessment history from the frontend's data"""
    try:
        # Try to read from a local JSON file that might be exported
        with open('c:\\R&I\\assessment_history.json', 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        # Return mock data for demonstration
        return generate_mock_data()

def generate_mock_data():
    """Generate realistic mock data for the dashboard"""
    diseases = ['alzheimers', 'parkinsons', 'als', 'huntington']
    risk_levels = ['low', 'moderate', 'high']
    data = []
    
    base_date = datetime.now() - timedelta(days=60)
    
    for i in range(50):
        disease = np.random.choice(diseases)
        risk_level = np.random.choice(risk_levels, p=[0.4, 0.35, 0.25])
        
        # Generate realistic risk scores based on risk level
        if risk_level == 'low':
            risk_score = np.random.uniform(0, 0.33)
        elif risk_level == 'moderate':
            risk_score = np.random.uniform(0.33, 0.67)
        else:
            risk_score = np.random.uniform(0.67, 1.0)
        
        age = np.random.randint(40, 85)
        cognitive_score = np.random.uniform(15, 30) if risk_level == 'high' else np.random.uniform(20, 30)
        
        data.append({
            'id': i,
            'date': base_date + timedelta(days=i),
            'disease': disease,
            'risk_level': risk_level,
            'risk_score': risk_score,
            'age': age,
            'cognitive_score': cognitive_score,
            'biomarker_1': np.random.uniform(0.5, 2.5),
            'biomarker_2': np.random.uniform(0.3, 2.0),
            'mri_score': np.random.uniform(0.1, 0.9),
            'eeg_score': np.random.uniform(0.1, 0.8)
        })
    
    return data

def get_disease_name(disease_type):
    """Convert disease type to full name"""
    names = {
        'alzheimers': "Alzheimer's Disease",
        'parkinsons': "Parkinson's Disease",
        'als': "ALS",
        'huntington': "Huntington's Disease"
    }
    return names.get(disease_type, disease_type)

# Load data
assessment_data = load_assessment_history()
df = pd.DataFrame(assessment_data)

# Convert date column if it exists
if 'date' in df.columns and isinstance(df['date'].iloc[0], str):
    df['date'] = pd.to_datetime(df['date'])

# Sidebar filters
st.sidebar.title("🎛️ Dashboard Controls")
st.sidebar.divider()

# Disease filter
selected_diseases = st.sidebar.multiselect(
    "Select Diseases",
    options=['alzheimers', 'parkinsons', 'als', 'huntington'],
    default=['alzheimers', 'parkinsons', 'als', 'huntington'],
    format_func=get_disease_name
)

# Risk level filter
selected_risk_levels = st.sidebar.multiselect(
    "Select Risk Levels",
    options=['low', 'moderate', 'high'],
    default=['low', 'moderate', 'high']
)

# Age range filter
age_range = st.sidebar.slider(
    "Age Range",
    min_value=int(df['age'].min()),
    max_value=int(df['age'].max()),
    value=(int(df['age'].min()), int(df['age'].max()))
)

# Date range filter
st.sidebar.subheader("Date Range")
date_range = st.sidebar.date_input(
    "Select date range",
    value=(df['date'].min(), df['date'].max()),
    min_value=df['date'].min(),
    max_value=df['date'].max()
)

# Apply filters
filtered_df = df[
    (df['disease'].isin(selected_diseases)) &
    (df['risk_level'].isin(selected_risk_levels)) &
    (df['age'].between(age_range[0], age_range[1])) &
    (df['date'].between(pd.to_datetime(date_range[0]), pd.to_datetime(date_range[1])))
]

# Header
st.title("🧠 NeuroCognitive Analytics Dashboard")
st.markdown("Real-time insights and visualizations for neurodegenera disease screening assessments")
st.divider()

# KPIs Section
col1, col2, col3, col4, col5 = st.columns(5)

with col1:
    st.metric(
        "Total Assessments",
        len(filtered_df),
        f"+{len(filtered_df) - len(df)//3 if len(filtered_df) > len(df)//3 else 0}"
    )

with col2:
    high_risk_count = len(filtered_df[filtered_df['risk_level'] == 'high'])
    st.metric(
        "High Risk Cases",
        high_risk_count,
        f"{(high_risk_count/len(filtered_df)*100):.1f}%" if len(filtered_df) > 0 else "0%",
        delta_color="inverse"
    )

with col3:
    avg_risk_score = filtered_df['risk_score'].mean()
    st.metric(
        "Avg Risk Score",
        f"{avg_risk_score:.2%}",
        f"{avg_risk_score*100:.1f}%"
    )

with col4:
    avg_age = filtered_df['age'].mean()
    st.metric(
        "Average Age",
        f"{avg_age:.1f}",
        "years"
    )

with col5:
    avg_cognitive = filtered_df['cognitive_score'].mean()
    st.metric(
        "Avg Cognitive Score",
        f"{avg_cognitive:.1f}",
        "normalized"
    )

st.divider()

# Charts Section
st.subheader("📊 Key Visualizations")

# Row 1: Risk Distribution and Disease Breakdown
col1, col2 = st.columns(2)

with col1:
    st.markdown("#### Risk Level Distribution")
    risk_counts = filtered_df['risk_level'].value_counts()
    risk_colors = {'low': '#22c55e', 'moderate': '#f97316', 'high': '#ef4444'}
    
    fig_risk = go.Figure(data=[
        go.Pie(
            labels=risk_counts.index,
            values=risk_counts.values,
            marker=dict(colors=[risk_colors.get(level, '#999') for level in risk_counts.index]),
            hole=0.3,
            textposition='inside',
            textinfo='label+percent'
        )
    ])
    fig_risk.update_layout(
        template='plotly_dark',
        showlegend=True,
        height=350,
        margin=dict(l=0, r=0, t=0, b=0)
    )
    st.plotly_chart(fig_risk, use_container_width=True)

with col2:
    st.markdown("#### Assessment Count by Disease")
    disease_counts = filtered_df['disease'].value_counts()
    disease_labels = [get_disease_name(d) for d in disease_counts.index]
    
    fig_disease = go.Figure(data=[
        go.Bar(
            x=disease_labels,
            y=disease_counts.values,
            marker=dict(
                color=disease_counts.values,
                colorscale='Viridis',
                showscale=False
            ),
            text=disease_counts.values,
            textposition='outside'
        )
    ])
    fig_disease.update_layout(
        template='plotly_dark',
        xaxis_title='Disease Type',
        yaxis_title='Number of Assessments',
        height=350,
        showlegend=False,
        hovermode='x unified'
    )
    st.plotly_chart(fig_disease, use_container_width=True)

# Row 2: Trends and Risk Score Distribution
col1, col2 = st.columns(2)

with col1:
    st.markdown("#### Risk Score Trends Over Time")
    df_sorted = filtered_df.sort_values('date')
    
    fig_trends = go.Figure()
    
    for disease in selected_diseases:
        disease_data = df_sorted[df_sorted['disease'] == disease]
        if len(disease_data) > 0:
            fig_trends.add_trace(go.Scatter(
                x=disease_data['date'],
                y=disease_data['risk_score'],
                mode='lines+markers',
                name=get_disease_name(disease),
                hovertemplate='<b>%{fullData.name}</b><br>Date: %{x|%Y-%m-%d}<br>Risk Score: %{y:.1%}<extra></extra>'
            ))
    
    fig_trends.update_layout(
        template='plotly_dark',
        xaxis_title='Date',
        yaxis_title='Risk Score',
        height=350,
        hovermode='x unified'
    )
    st.plotly_chart(fig_trends, use_container_width=True)

with col2:
    st.markdown("#### Risk Score Distribution")
    
    fig_hist = go.Figure()
    
    for risk_level in selected_risk_levels:
        data = filtered_df[filtered_df['risk_level'] == risk_level]['risk_score']
        if len(data) > 0:
            fig_hist.add_trace(go.Histogram(
                x=data,
                name=risk_level.capitalize(),
                opacity=0.75,
                marker=dict(color=risk_colors.get(risk_level, '#999'))
            ))
    
    fig_hist.update_layout(
        template='plotly_dark',
        xaxis_title='Risk Score',
        yaxis_title='Frequency',
        height=350,
        barmode='overlay',
        hovermode='x unified'
    )
    st.plotly_chart(fig_hist, use_container_width=True)

st.divider()

# Disease-Specific Analysis
st.subheader("🔬 Disease-Specific Analysis")

disease_tabs = st.tabs([get_disease_name(d) for d in selected_diseases if d in filtered_df['disease'].values])

for idx, disease in enumerate(selected_diseases):
    if disease not in filtered_df['disease'].values:
        continue
    
    disease_df = filtered_df[filtered_df['disease'] == disease]
    
    with disease_tabs[idx]:
        col1, col2, col3, col4 = st.columns(4)
        
        with col1:
            st.metric("Cases", len(disease_df))
        
        with col2:
            high_risk_pct = (len(disease_df[disease_df['risk_level'] == 'high']) / len(disease_df) * 100) if len(disease_df) > 0 else 0
            st.metric("High Risk %", f"{high_risk_pct:.1f}%")
        
        with col3:
            avg_score = disease_df['risk_score'].mean()
            st.metric("Avg Risk Score", f"{avg_score:.2%}")
        
        with col4:
            avg_cog = disease_df['cognitive_score'].mean()
            st.metric("Avg Cognitive Score", f"{avg_cog:.1f}")
        
        # Risk level breakdown for this disease
        col1, col2 = st.columns(2)
        
        with col1:
            st.markdown(f"##### Risk Levels")
            risk_breakdown = disease_df['risk_level'].value_counts()
            fig_breakdown = go.Figure(data=[
                go.Bar(
                    x=risk_breakdown.index,
                    y=risk_breakdown.values,
                    marker=dict(color=[risk_colors.get(level, '#999') for level in risk_breakdown.index]),
                    text=risk_breakdown.values,
                    textposition='outside'
                )
            ])
            fig_breakdown.update_layout(
                template='plotly_dark',
                showlegend=False,
                height=300,
                margin=dict(l=0, r=0, t=0, b=0)
            )
            st.plotly_chart(fig_breakdown, use_container_width=True)
        
        with col2:
            st.markdown(f"##### Age vs Risk Score")
            fig_scatter = px.scatter(
                disease_df,
                x='age',
                y='risk_score',
                color='risk_level',
                color_discrete_map={'low': '#22c55e', 'moderate': '#f97316', 'high': '#ef4444'},
                title='',
                labels={'age': 'Age', 'risk_score': 'Risk Score'}
            )
            fig_scatter.update_layout(
                template='plotly_dark',
                height=300,
                margin=dict(l=0, r=0, t=0, b=0),
                hovermode='closest'
            )
            st.plotly_chart(fig_scatter, use_container_width=True)

st.divider()

# Biomarker Analysis
st.subheader("🧪 Biomarker Analysis")

col1, col2, col3, col4 = st.columns(4)

with col1:
    st.markdown("#### ELISA Biomarker 1")
    fig_bm1 = go.Figure()
    for risk_level in ['low', 'moderate', 'high']:
        data = filtered_df[filtered_df['risk_level'] == risk_level]['biomarker_1']
        if len(data) > 0:
            fig_bm1.add_trace(go.Box(
                y=data,
                name=risk_level.capitalize(),
                marker=dict(color=risk_colors.get(risk_level, '#999'))
            ))
    fig_bm1.update_layout(template='plotly_dark', height=300, showlegend=False)
    st.plotly_chart(fig_bm1, use_container_width=True)

with col2:
    st.markdown("#### ELISA Biomarker 2")
    fig_bm2 = go.Figure()
    for risk_level in ['low', 'moderate', 'high']:
        data = filtered_df[filtered_df['risk_level'] == risk_level]['biomarker_2']
        if len(data) > 0:
            fig_bm2.add_trace(go.Box(
                y=data,
                name=risk_level.capitalize(),
                marker=dict(color=risk_colors.get(risk_level, '#999'))
            ))
    fig_bm2.update_layout(template='plotly_dark', height=300, showlegend=False)
    st.plotly_chart(fig_bm2, use_container_width=True)

with col3:
    st.markdown("#### MRI Severity")
    fig_mri = go.Figure()
    for risk_level in ['low', 'moderate', 'high']:
        data = filtered_df[filtered_df['risk_level'] == risk_level]['mri_score']
        if len(data) > 0:
            fig_mri.add_trace(go.Box(
                y=data,
                name=risk_level.capitalize(),
                marker=dict(color=risk_colors.get(risk_level, '#999'))
            ))
    fig_mri.update_layout(template='plotly_dark', height=300, showlegend=False)
    st.plotly_chart(fig_mri, use_container_width=True)

with col4:
    st.markdown("#### EEG Anomaly")
    fig_eeg = go.Figure()
    for risk_level in ['low', 'moderate', 'high']:
        data = filtered_df[filtered_df['risk_level'] == risk_level]['eeg_score']
        if len(data) > 0:
            fig_eeg.add_trace(go.Box(
                y=data,
                name=risk_level.capitalize(),
                marker=dict(color=risk_colors.get(risk_level, '#999'))
            ))
    fig_eeg.update_layout(template='plotly_dark', height=300, showlegend=False)
    st.plotly_chart(fig_eeg, use_container_width=True)

st.divider()

# Data Table
st.subheader("📋 Detailed Assessment Data")

# Create display dataframe
display_df = filtered_df.copy()
display_df['disease'] = display_df['disease'].apply(get_disease_name)
display_df['risk_score'] = display_df['risk_score'].apply(lambda x: f"{x:.1%}")
display_df = display_df[[
    'date', 'disease', 'risk_level', 'risk_score', 'age', 
    'cognitive_score', 'biomarker_1', 'biomarker_2', 'mri_score', 'eeg_score'
]].round(3)

st.dataframe(
    display_df.sort_values('date', ascending=False),
    use_container_width=True,
    height=400
)

st.divider()

# Footer
col1, col2, col3 = st.columns(3)

with col1:
    st.markdown("""
    **Data Summary**
    - Total Records: {}
    - Date Range: {} to {}
    - Unique Diseases: {}
    """.format(
        len(filtered_df),
        filtered_df['date'].min().strftime('%Y-%m-%d') if len(filtered_df) > 0 else 'N/A',
        filtered_df['date'].max().strftime('%Y-%m-%d') if len(filtered_df) > 0 else 'N/A',
        filtered_df['disease'].nunique() if len(filtered_df) > 0 else 0
    ))

with col2:
    st.markdown("""
    **Risk Distribution**
    - Low Risk: {} ({:.1f}%)
    - Moderate Risk: {} ({:.1f}%)
    - High Risk: {} ({:.1f}%)
    """.format(
        len(filtered_df[filtered_df['risk_level'] == 'low']),
        len(filtered_df[filtered_df['risk_level'] == 'low'])/len(filtered_df)*100 if len(filtered_df) > 0 else 0,
        len(filtered_df[filtered_df['risk_level'] == 'moderate']),
        len(filtered_df[filtered_df['risk_level'] == 'moderate'])/len(filtered_df)*100 if len(filtered_df) > 0 else 0,
        len(filtered_df[filtered_df['risk_level'] == 'high']),
        len(filtered_df[filtered_df['risk_level'] == 'high'])/len(filtered_df)*100 if len(filtered_df) > 0 else 0
    ))

with col3:
    st.markdown("""
    **System Info**
    - Dashboard Version: 1.0
    - Last Updated: {}
    - Data Source: Assessment History
    """.format(datetime.now().strftime('%Y-%m-%d %H:%M:%S')))

st.markdown("""
---
*NeuroCognitive Analytics Dashboard - Research & Educational Use Only*
""")
