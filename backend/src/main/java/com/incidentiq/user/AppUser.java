package com.incidentiq.user;
import jakarta.persistence.*;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import java.time.Instant;
import java.util.Collection;
import java.util.List;
@Entity @Table(name="users")
public class AppUser implements UserDetails {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
 @Column(nullable=false,length=120) private String name;
 @Column(nullable=false,unique=true,length=190) private String email;
 @Column(name="password_hash",nullable=false,length=100) private String passwordHash;
 @Enumerated(EnumType.STRING) @Column(nullable=false,length=30) private Role role;
 @ManyToOne(fetch=FetchType.EAGER) @JoinColumn(name="team_id") private Team team;
 @Column(nullable=false) private boolean active=true;
 @Column(name="created_at",nullable=false) private Instant createdAt=Instant.now();
 protected AppUser(){}
 public AppUser(String name,String email,String passwordHash,Role role,Team team){this.name=name;this.email=email;this.passwordHash=passwordHash;this.role=role;this.team=team;}
 public Long getId(){return id;} public String getName(){return name;} public String getEmail(){return email;} public Role getRole(){return role;} public Team getTeam(){return team;} public boolean isActive(){return active;}
 @Override public Collection<? extends GrantedAuthority> getAuthorities(){return List.of(new SimpleGrantedAuthority("ROLE_"+role.name()));}
 @Override public String getPassword(){return passwordHash;} @Override public String getUsername(){return email;}
 @Override public boolean isAccountNonExpired(){return true;} @Override public boolean isAccountNonLocked(){return active;} @Override public boolean isCredentialsNonExpired(){return true;} @Override public boolean isEnabled(){return active;}
}
