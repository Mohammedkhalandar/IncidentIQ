package com.incidentiq.incident;
import com.incidentiq.user.AppUser;
import com.incidentiq.user.Team;
import jakarta.persistence.*;
import java.time.Instant;
@Entity @Table(name="incidents")
public class Incident {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
 @Column(name="incident_key",nullable=false,unique=true,length=40) private String incidentKey;
 @Column(nullable=false,length=180) private String title;
 @Column(nullable=false,columnDefinition="TEXT") private String description;
 @Enumerated(EnumType.STRING) @Column(nullable=false,length=30) private IncidentStatus status=IncidentStatus.OPEN;
 @Enumerated(EnumType.STRING) @Column(nullable=false,length=20) private IncidentPriority priority;
 @Column(nullable=false,length=50) private String category;
 @ManyToOne(fetch=FetchType.EAGER) @JoinColumn(name="reporter_id",nullable=false) private AppUser reporter;
 @ManyToOne(fetch=FetchType.EAGER) @JoinColumn(name="assignee_id") private AppUser assignee;
 @ManyToOne(fetch=FetchType.EAGER) @JoinColumn(name="team_id") private Team team;
 @Column(name="response_due_at",nullable=false) private Instant responseDueAt;
 @Column(name="resolution_due_at",nullable=false) private Instant resolutionDueAt;
 @Column(name="first_response_at") private Instant firstResponseAt;
 @Column(name="response_breached",nullable=false) private boolean responseBreached;
 @Column(name="resolution_breached",nullable=false) private boolean resolutionBreached;
 @Column(name="created_at",nullable=false) private Instant createdAt=Instant.now();
 @Column(name="updated_at",nullable=false) private Instant updatedAt=Instant.now();
 @Column(name="resolved_at") private Instant resolvedAt;
 protected Incident(){}
 public Incident(String key,String title,String description,IncidentPriority priority,String category,AppUser reporter,Team team,Instant responseDueAt,Instant resolutionDueAt){this(key,title,description,priority,category,reporter,team,Instant.now(),responseDueAt,resolutionDueAt);}
 public Incident(String key,String title,String description,IncidentPriority priority,String category,AppUser reporter,Team team,Instant createdAt,Instant responseDueAt,Instant resolutionDueAt){this.incidentKey=key;this.title=title;this.description=description;this.priority=priority;this.category=category;this.reporter=reporter;this.team=team;this.createdAt=createdAt;this.updatedAt=createdAt;this.responseDueAt=responseDueAt;this.resolutionDueAt=resolutionDueAt;}
 public void setAssignee(AppUser v){assignee=v;touch();} public void setTeam(Team v){team=v;touch();} public void setTitle(String v){title=v;touch();} public void setDescription(String v){description=v;touch();} public void setPriority(IncidentPriority v){priority=v;touch();} public void setCategory(String v){category=v;touch();}
 public void updateSlaDeadlines(Instant responseDueAt,Instant resolutionDueAt){this.responseDueAt=responseDueAt;this.resolutionDueAt=resolutionDueAt;this.responseBreached=false;this.resolutionBreached=false;touch();}
 public void setStatus(IncidentStatus v){status=v;if(v==IncidentStatus.RESOLVED)resolvedAt=Instant.now();else if(v!=IncidentStatus.CLOSED)resolvedAt=null;if(firstResponseAt==null&&v!=IncidentStatus.OPEN)firstResponseAt=Instant.now();touch();}
 public void markFirstResponse(){if(firstResponseAt==null)firstResponseAt=Instant.now();} public void markResponseBreach(){responseBreached=true;} public void markResolutionBreach(){resolutionBreached=true;} private void touch(){updatedAt=Instant.now();}
 public Long getId(){return id;} public String getIncidentKey(){return incidentKey;} public String getTitle(){return title;} public String getDescription(){return description;} public IncidentStatus getStatus(){return status;} public IncidentPriority getPriority(){return priority;} public String getCategory(){return category;} public AppUser getReporter(){return reporter;} public AppUser getAssignee(){return assignee;} public Team getTeam(){return team;} public Instant getResponseDueAt(){return responseDueAt;} public Instant getResolutionDueAt(){return resolutionDueAt;} public Instant getFirstResponseAt(){return firstResponseAt;} public boolean isResponseBreached(){return responseBreached;} public boolean isResolutionBreached(){return resolutionBreached;} public Instant getCreatedAt(){return createdAt;} public Instant getUpdatedAt(){return updatedAt;} public Instant getResolvedAt(){return resolvedAt;}
}
