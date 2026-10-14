package com.incidentiq.incident;
import com.incidentiq.user.AppUser;
import jakarta.persistence.*;
import java.time.Instant;
@Entity @Table(name="incident_comments")
public class IncidentComment {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
 @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="incident_id",nullable=false) private Incident incident;
 @ManyToOne(fetch=FetchType.EAGER) @JoinColumn(name="author_id",nullable=false) private AppUser author;
 @Column(nullable=false,columnDefinition="TEXT") private String message;
 @Column(name="created_at",nullable=false) private Instant createdAt=Instant.now();
 protected IncidentComment(){} public IncidentComment(Incident i,AppUser a,String m){incident=i;author=a;message=m;}
 public Long getId(){return id;} public AppUser getAuthor(){return author;} public String getMessage(){return message;} public Instant getCreatedAt(){return createdAt;}
}
