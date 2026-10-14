package com.incidentiq.incident;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface IncidentHistoryRepository extends JpaRepository<IncidentHistory,Long>{List<IncidentHistory> findByIncidentIdOrderByCreatedAtDesc(Long incidentId);}
