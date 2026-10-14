package com.incidentiq.incident;
import com.incidentiq.user.AppUser;
import jakarta.persistence.*;
import java.time.Instant;
@Entity @Table(name="incident_history")
public class IncidentHistory {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
 @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="incident_id",nullable=false) private Incident incident;
 @ManyToOne(fetch=FetchType.EAGER) @JoinColumn(name="actor_id") private AppUser actor;
 @Column(nullable=false,length=80) private String action;
 @Column(name="old_value",length=500) private String oldValue;
 @Column(name="new_value",length=500) private String newValue;
 @Column(name="created_at",nullable=false) private Instant createdAt=Instant.now();
 protected IncidentHistory(){} public IncidentHistory(Incident i,AppUser a,String action,String oldValue,String newValue){incident=i;actor=a;this.action=action;this.oldValue=oldValue;this.newValue=newValue;}
 public Long getId(){return id;} public AppUser getActor(){return actor;} public String getAction(){return action;} public String getOldValue(){return oldValue;} public String getNewValue(){return newValue;} public Instant getCreatedAt(){return createdAt;}
}
