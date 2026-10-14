package com.incidentiq.dashboard;
import com.incidentiq.incident.IncidentService;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
@RestController @RequestMapping("/api/v1/dashboard")
public class DashboardController {private final IncidentService service;public DashboardController(IncidentService s){service=s;}@GetMapping("/summary") public Map<String,Object> summary(){return service.summary();}}
