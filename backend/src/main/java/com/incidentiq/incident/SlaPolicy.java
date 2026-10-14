package com.incidentiq.incident;
import jakarta.persistence.*;
@Entity @Table(name="sla_policies")
public class SlaPolicy {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
 @Enumerated(EnumType.STRING) @Column(nullable=false,unique=true,length=20) private IncidentPriority priority;
 @Column(name="response_minutes",nullable=false) private int responseMinutes;
 @Column(name="resolution_minutes",nullable=false) private int resolutionMinutes;
 @Column(nullable=false) private boolean active=true;
 protected SlaPolicy(){} public Long getId(){return id;} public IncidentPriority getPriority(){return priority;} public int getResponseMinutes(){return responseMinutes;} public int getResolutionMinutes(){return resolutionMinutes;} public boolean isActive(){return active;}
}
