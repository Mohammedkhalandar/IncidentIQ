package com.incidentiq.incident;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
public interface IncidentRepository extends JpaRepository<Incident,Long>{
 @Query("select i from Incident i where (:status is null or i.status=:status) and (:priority is null or i.priority=:priority) and (:search is null or lower(i.title) like lower(concat('%',:search,'%')) or lower(i.incidentKey) like lower(concat('%',:search,'%')) or lower(i.description) like lower(concat('%',:search,'%'))) order by i.createdAt desc")
 Page<Incident> search(@Param("status") IncidentStatus status,@Param("priority") IncidentPriority priority,@Param("search") String search,Pageable pageable);
 List<Incident> findByStatusNotIn(List<IncidentStatus> statuses); long countByStatus(IncidentStatus status); long countByPriority(IncidentPriority priority); long countByResponseBreachedTrue(); long countByResolutionBreachedTrue();
}
