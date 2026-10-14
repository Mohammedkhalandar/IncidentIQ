package com.incidentiq.incident;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
public interface SlaPolicyRepository extends JpaRepository<SlaPolicy,Long>{Optional<SlaPolicy> findByPriorityAndActiveTrue(IncidentPriority priority);}
