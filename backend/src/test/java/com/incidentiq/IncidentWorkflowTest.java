package com.incidentiq;

import com.incidentiq.incident.IncidentStatus;
import com.incidentiq.incident.IncidentWorkflow;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class IncidentWorkflowTest {
    @Test void openIncidentCanStartWork() {
        assertTrue(IncidentWorkflow.canTransition(IncidentStatus.OPEN, IncidentStatus.IN_PROGRESS));
    }
    @Test void openIncidentCannotSkipDirectlyToClosed() {
        assertFalse(IncidentWorkflow.canTransition(IncidentStatus.OPEN, IncidentStatus.CLOSED));
    }
    @Test void resolvedIncidentCanBeReopenedForMoreWork() {
        assertTrue(IncidentWorkflow.canTransition(IncidentStatus.RESOLVED, IncidentStatus.IN_PROGRESS));
    }
    @Test void closedIncidentIsTerminal() {
        assertFalse(IncidentWorkflow.canTransition(IncidentStatus.CLOSED, IncidentStatus.IN_PROGRESS));
    }
}
