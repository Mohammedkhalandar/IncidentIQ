package com.incidentiq.user;
import jakarta.persistence.*;
import java.time.Instant;
@Entity @Table(name="teams")
public class Team {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
 @Column(nullable=false,unique=true,length=100) private String name;
 @Column(length=500) private String description;
 @Column(name="created_at",nullable=false) private Instant createdAt=Instant.now();
 protected Team(){}
 public Team(String name,String description){this.name=name;this.description=description;}
 public Long getId(){return id;} public String getName(){return name;} public String getDescription(){return description;}
}
