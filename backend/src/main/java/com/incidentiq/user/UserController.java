package com.incidentiq.user;
import com.incidentiq.incident.IncidentService;
import org.springframework.web.bind.annotation.*;
import java.util.List;import java.util.Map;
@RestController @RequestMapping("/api/v1")
public class UserController {
 private final IncidentService service;private final TeamRepository teams;public UserController(IncidentService s,TeamRepository t){service=s;teams=t;}
 @GetMapping("/users") public List<Map<String,Object>> users(){return service.users();}
 @GetMapping("/teams") public List<Map<String,Object>> teams(){return teams.findAll().stream().map(t->Map.<String,Object>of("id",t.getId(),"name",t.getName(),"description",t.getDescription()==null?"":t.getDescription())).toList();}
 @GetMapping("/sla/policies") public List<Map<String,Object>> policies(){return service.policies();}
}
