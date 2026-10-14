package com.incidentiq.incident;
import com.incidentiq.user.AppUser;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.lang.NonNull;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;
@RestController @RequestMapping("/api/v1/incidents")
public class IncidentController {
 private final IncidentService service; public IncidentController(IncidentService s){service=s;}
 @GetMapping public Page<IncidentService.IncidentView> search(@RequestParam(required=false) IncidentStatus status,@RequestParam(required=false) IncidentPriority priority,@RequestParam(required=false) String search,@RequestParam(defaultValue="0") int page,@RequestParam(defaultValue="10") int size){return service.search(status,priority,search,page,size);}
 @PostMapping public IncidentService.IncidentView create(@Valid @RequestBody IncidentService.CreateRequest r,@AuthenticationPrincipal AppUser actor){return service.create(r,actor);}
 @GetMapping("/{id}") public IncidentService.IncidentView get(@PathVariable @NonNull Long id){return service.get(id);}
 @PreAuthorize("hasAnyRole('ADMIN','SUPPORT_LEAD','ENGINEER')") @PatchMapping("/{id}") public IncidentService.IncidentView update(@PathVariable @NonNull Long id,@Valid @RequestBody IncidentService.UpdateRequest r,@AuthenticationPrincipal AppUser actor){return service.update(id,r,actor);}
 @PreAuthorize("hasAnyRole('ADMIN','SUPPORT_LEAD')") @PostMapping("/{id}/assign") public IncidentService.IncidentView assign(@PathVariable @NonNull Long id,@Valid @RequestBody IncidentService.AssignRequest r,@AuthenticationPrincipal AppUser actor){return service.assign(id,r,actor);}
 @PreAuthorize("hasAnyRole('ADMIN','SUPPORT_LEAD','ENGINEER')") @PostMapping("/{id}/transition") public IncidentService.IncidentView transition(@PathVariable @NonNull Long id,@Valid @RequestBody IncidentService.TransitionRequest r,@AuthenticationPrincipal AppUser actor){return service.transition(id,r,actor);}
 @GetMapping("/{id}/comments") public List<IncidentService.CommentView> comments(@PathVariable @NonNull Long id){return service.comments(id);}
 @PostMapping("/{id}/comments") public IncidentService.CommentView comment(@PathVariable @NonNull Long id,@Valid @RequestBody IncidentService.CommentRequest r,@AuthenticationPrincipal AppUser actor){return service.addComment(id,r,actor);}
 @GetMapping("/{id}/history") public List<IncidentService.HistoryView> history(@PathVariable @NonNull Long id){return service.history(id);}
}
