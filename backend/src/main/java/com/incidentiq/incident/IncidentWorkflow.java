package com.incidentiq.incident;

/** Centralized state-machine rules for incident lifecycle transitions. */
public final class IncidentWorkflow {
    private IncidentWorkflow() {}

    public static boolean canTransition(IncidentStatus from, IncidentStatus to) {
        if (from == null || to == null || from == to) return true;
        return switch (from) {
            case OPEN -> to == IncidentStatus.IN_PROGRESS;
            case IN_PROGRESS -> to == IncidentStatus.PENDING || to == IncidentStatus.RESOLVED;
            case PENDING -> to == IncidentStatus.IN_PROGRESS || to == IncidentStatus.RESOLVED;
            case RESOLVED -> to == IncidentStatus.CLOSED || to == IncidentStatus.IN_PROGRESS;
            case CLOSED -> false;
        };
    }
}
