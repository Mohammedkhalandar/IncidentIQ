package com.incidentiq.config;
import com.incidentiq.incident.*;import com.incidentiq.user.*;
import org.springframework.beans.factory.annotation.Value;import org.springframework.boot.CommandLineRunner;import org.springframework.context.annotation.Bean;import org.springframework.context.annotation.Configuration;import org.springframework.security.crypto.password.PasswordEncoder;
import java.time.Instant;import java.util.List;
@Configuration public class DemoDataInitializer {
 @Bean CommandLineRunner seed(UserRepository users,TeamRepository teams,IncidentRepository incidents,SlaPolicyRepository policies,PasswordEncoder encoder,@Value("${app.seed-demo-data:true}")boolean enabled){return args->{if(!enabled||users.count()>0)return;
 Team platform=teams.save(new Team("Platform Engineering","Core services, APIs and infrastructure"));Team app=teams.save(new Team("Application Support","Customer-facing applications and internal tools"));Team data=teams.save(new Team("Data Services","Databases, pipelines and reporting"));
 users.save(new AppUser("Alex Morgan","admin@incidentiq.local",encoder.encode("IncidentIQ@123"),Role.ADMIN,platform));AppUser engineer=users.save(new AppUser("Jordan Lee","engineer@incidentiq.local",encoder.encode("IncidentIQ@123"),Role.ENGINEER,platform));AppUser reporter=users.save(new AppUser("Taylor Reed","reporter@incidentiq.local",encoder.encode("IncidentIQ@123"),Role.REPORTER,app));AppUser engineer2=users.save(new AppUser("Sam Patel","sam@incidentiq.local",encoder.encode("IncidentIQ@123"),Role.ENGINEER,data));
 record Sample(String title,String description,IncidentPriority priority,String category,IncidentStatus status,AppUser reporter,AppUser assignee,Team team,int ageHours){}
 List<Sample> samples=List.of(
 new Sample("Payment API returning intermittent 502s","Checkout requests intermittently fail when the payment gateway connection pool saturates.",IncidentPriority.CRITICAL,"API",IncidentStatus.IN_PROGRESS,reporter,engineer,platform,1),
 new Sample("Customer portal login latency elevated","Median login latency has increased after the latest identity provider configuration.",IncidentPriority.HIGH,"AUTHENTICATION",IncidentStatus.OPEN,reporter,null,app,2),
 new Sample("Nightly data pipeline missed its window","The revenue aggregation job did not finish before the morning reporting deadline.",IncidentPriority.HIGH,"DATA",IncidentStatus.OPEN,reporter,engineer2,data,5),
 new Sample("Email notification queue backlog","Notification worker throughput dropped below normal levels.",IncidentPriority.MEDIUM,"INTEGRATION",IncidentStatus.PENDING,reporter,engineer,platform,8),
 new Sample("Admin report export formatting issue","CSV export includes an unexpected empty column for optional fields.",IncidentPriority.LOW,"REPORTING",IncidentStatus.RESOLVED,reporter,engineer2,data,12),
 new Sample("File upload retries increased","Large file uploads fail more often on unstable connections.",IncidentPriority.MEDIUM,"APPLICATION",IncidentStatus.OPEN,reporter,null,app,20),
 new Sample("Service health check timing out","The health endpoint sometimes exceeds the load balancer timeout.",IncidentPriority.HIGH,"INFRASTRUCTURE",IncidentStatus.OPEN,reporter,engineer,platform,26),
 new Sample("User profile update conflict","Concurrent profile updates can overwrite a recently changed display name.",IncidentPriority.LOW,"APPLICATION",IncidentStatus.CLOSED,reporter,engineer2,app,31),
 new Sample("Search index refresh delayed","Catalog search is missing records created in the last 15 minutes.",IncidentPriority.MEDIUM,"SEARCH",IncidentStatus.IN_PROGRESS,reporter,null,platform,40),
 new Sample("Database connection usage near limit","Connection utilization is close to the configured pool maximum during peak load.",IncidentPriority.CRITICAL,"DATABASE",IncidentStatus.OPEN,reporter,engineer2,data,50));
 int n=1;for(Sample s:samples){SlaPolicy p=policies.findByPriorityAndActiveTrue(s.priority()).orElseThrow();Instant created=Instant.now().minusSeconds(s.ageHours()*3600L);Incident i=new Incident("INC-2026-"+String.format("%04d",n++),s.title(),s.description(),s.priority(),s.category(),s.reporter(),s.team(),created,created.plusSeconds(p.getResponseMinutes()*60L),created.plusSeconds(p.getResolutionMinutes()*60L));if(s.assignee()!=null)i.setAssignee(s.assignee());if(s.status()==IncidentStatus.CLOSED){i.setStatus(IncidentStatus.RESOLVED);i.setStatus(IncidentStatus.CLOSED);}else if(s.status()!=IncidentStatus.OPEN)i.setStatus(s.status());incidents.save(i);}
 System.out.println("IncidentIQ demo data initialized.");};}
}
