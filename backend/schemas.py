"""
QueueSense - Backend Pydantic Schemas
"""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class SimulationInput(BaseModel):
    booked_slots: int = Field(default=12, ge=0, le=30, description="Booked 15-min slots in this hour")
    total_scheduled: int = Field(default=13, ge=0, le=40, description="Total patients scheduled for this hour")
    avg_lead_days: float = Field(default=18.0, ge=0.0, le=120.0, description="Mean scheduling lead time in days")
    avg_age: float = Field(default=52.0, ge=0.0, le=110.0, description="Mean age of scheduled patients")
    senior_ratio: float = Field(default=0.35, ge=0.0, le=1.0, description="Fraction of patients aged 60+")
    sched_hour: int = Field(default=10, ge=8, le=17, description="Operating hour bucket (8 to 17)")
    cum_attended_today: float = Field(default=12.0, ge=0.0, description="Cumulative patients attended so far today")
    cum_workload_today: float = Field(default=145.0, ge=0.0, description="Cumulative consult minutes delivered today")
    prev_hour_wait: float = Field(default=38.0, ge=0.0, description="Average patient wait time in the previous hour")
    prev_2h_wait: float = Field(default=30.0, ge=0.0, description="Average patient wait time 2 hours ago")
    prev_hour_workload: float = Field(default=64.0, ge=0.0, description="Total consultation workload in previous hour")
    rolling_3h_wait: float = Field(default=34.0, ge=0.0, description="Rolling 3-hour average wait time")
    prev_day_avg_wait: float = Field(default=40.0, ge=0.0, description="Previous clinic day's overall average wait time")
    day_of_week: int = Field(default=0, ge=0, le=6, description="Day of week (0=Mon, 6=Sun)")
    month: int = Field(default=10, ge=1, le=12, description="Month of year (1-12)")


class GateTelemetry(BaseModel):
    input_gate: float = Field(..., description="LSTM Input Gate activation (new information admittance)")
    forget_gate: float = Field(..., description="LSTM Forget Gate activation (retained historical backlog)")
    output_gate: float = Field(..., description="LSTM Output Gate activation (hidden state emission)")
    candidate_cell: float = Field(..., description="Candidate cell memory magnitude")
    cell_state_norm: float = Field(..., description="Norm of cumulative cell state vector")
    hidden_state_norm: float = Field(..., description="Norm of recurrent hidden state vector")


class ModelPrediction(BaseModel):
    model_name: str
    architecture: str
    overload_probability: float
    is_overloaded: bool
    predicted_wait_mins: float
    queue_utilization_rho: float
    status: str
    risk_level: str


class PredictionResponse(BaseModel):
    mlp: ModelPrediction
    lstm: ModelPrediction
    lstm_gates: GateTelemetry
    queue_backlog_delta_mins: float
    staffing_recommendation: str
    suggested_buffer_slots: int
    overload_risk_category: str
    timestamp: str


class PresetScenario(BaseModel):
    id: str
    title: str
    category: str
    description: str
    clinical_rationale: str
    recommended_action: str
    params: SimulationInput


class HealthResponse(BaseModel):
    status: str
    version: str
    models_loaded: bool
    architecture: str
    memory_efficient: bool
