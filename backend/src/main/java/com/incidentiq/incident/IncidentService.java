package com.incidentiq.incident;

import com.incidentiq.user.AppUser;
import com.incidentiq.user.Role;
import com.incidentiq.user.Team;
import com.incidentiq.user.TeamRepository;
import com.incidentiq.user.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ThreadLocalRandom;

@Service
public class IncidentService {
    private final IncidentRepository incidents;
    private final UserRepository users;
    private final TeamRepository teams;
    private final SlaPolicyRepository policies;
    private final IncidentHistoryRepository history;
    private final IncidentCommentRepository comments;

    public IncidentService(IncidentRepository incidents, UserRepository users, TeamRepository teams,
                          SlaPolicyRepository policies, IncidentHistoryRepository history,
                          IncidentCommentRepository comments) {
        this.incidents = incidents;
        this.users = users;
        this.teams = teams;
        this.policies = policies;
        this.history = history;
        this.comments = comments;
    }

    public record IncidentView(Long id, String incidentKey, String title, String description,
            String status, String priority, String category, Long reporterId, String reporterName,
            Long assigneeId, String assigneeName, Long teamId, String teamName,
            Instant responseDueAt, Instant resolutionDueAt, Instant firstResponseAt,
            boolean responseBreached, boolean resolutionBreached, Instant createdAt,
            Instant updatedAt, Instant resolvedAt) {}
    public record CreateRequest(@NotBlank @Size(max = 180) String title,
                                @NotBlank String description,
                                @NotNull IncidentPriority priority,
                                @Size(max = 50) String category,
                                @Positive Long teamId) {}
    public record UpdateRequest(@Size(max = 180) String title,
                                @Size(max = 65535) String description,
                                IncidentPriority priority,
                                @Size(max = 50) String category) {}
    public record AssignRequest(@Positive Long assigneeId, @Positive Long teamId) {}
    public record TransitionRequest(@NotNull IncidentStatus status, @Size(max = 5000) String note) {}
    public record CommentRequest(@NotBlank @Size(max = 5000) String message) {}
    public record CommentView(Long id, String authorName, String message, Instant createdAt) {}
    public record HistoryView(Long id, String actorName, String action, String oldValue,
                              String newValue, Instant createdAt) {}

    @Transactional(readOnly = true)
    public Page<IncidentView> search(IncidentStatus status, IncidentPriority priority,
                                     String search, int page, int size) {
        if (page < 0 || size < 1 || size > 100) {
            throw new IllegalArgumentException("page must be >= 0 and size must be between 1 and 100");
        }
        String term = search == null || search.isBlank() ? null : search.trim();
        return incidents.search(status, priority, term, PageRequest.of(page, size)).map(this::view);
    }

    @Transactional(readOnly = true)
    public IncidentView get(@NonNull Long id) {
        return view(find(id));
    }

    @Transactional
    public IncidentView create(CreateRequest request, AppUser actor) {
        if (request.title() == null || request.title().isBlank() || request.title().length() > 180) {
            throw new IllegalArgumentException("Title is required and must be at most 180 characters");
        }
        if (request.description() == null || request.description().isBlank()) {
            throw new IllegalArgumentException("Description is required");
        }
        if (request.priority() == null) throw new IllegalArgumentException("Priority is required");

        String category = request.category() == null || request.category().isBlank()
                ? "APPLICATION" : request.category().trim().toUpperCase();
        Long requestedTeamId = request.teamId();
        Team team = requestedTeamId == null ? actor.getTeam() : teams.findById(requestedTeamId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Team not found"));
        SlaPolicy policy = policies.findByPriorityAndActiveTrue(request.priority())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "SLA policy missing"));
        Instant now = Instant.now();
        String key = "INC-" + now.toEpochMilli() + "-" + ThreadLocalRandom.current().nextInt(100, 999);
        Incident incident = incidents.save(new Incident(key, request.title().trim(),
                request.description().trim(), request.priority(), category, actor, team,
                now.plusSeconds(policy.getResponseMinutes() * 60L),
                now.plusSeconds(policy.getResolutionMinutes() * 60L)));
        log(incident, actor, "CREATED", null, "OPEN");
        return view(incident);
    }

    @Transactional
    public IncidentView update(@NonNull Long id, UpdateRequest request, AppUser actor) {
        Incident incident = find(id);
        if (request.title() != null && !request.title().isBlank()) incident.setTitle(request.title().trim());
        if (request.description() != null && !request.description().isBlank()) incident.setDescription(request.description().trim());
        if (request.priority() != null && request.priority() != incident.getPriority()) {
            IncidentPriority old = incident.getPriority();
            SlaPolicy policy = policies.findByPriorityAndActiveTrue(request.priority())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "SLA policy missing"));
            incident.setPriority(request.priority());
            incident.updateSlaDeadlines(
                    incident.getCreatedAt().plusSeconds(policy.getResponseMinutes() * 60L),
                    incident.getCreatedAt().plusSeconds(policy.getResolutionMinutes() * 60L));
            log(incident, actor, "PRIORITY_CHANGED", old.name(), request.priority().name());
        }
        if (request.category() != null && !request.category().isBlank()) {
            incident.setCategory(request.category().trim().toUpperCase());
        }
        return view(incidents.save(incident));
    }

    @Transactional
    public IncidentView assign(@NonNull Long id, AssignRequest request, AppUser actor) {
        Incident incident = find(id);
        String oldAssignee = incident.getAssignee() == null ? "Unassigned" : incident.getAssignee().getName();
        Long assigneeId = request.assigneeId();
        if (assigneeId == null) {
            incident.setAssignee(null);
        } else {
            AppUser assignee = users.findById(assigneeId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Assignee not found"));
            if (!assignee.isActive()) throw new IllegalArgumentException("Cannot assign an inactive user");
            incident.setAssignee(assignee);
        }
        Long teamId = request.teamId();
        if (teamId != null) {
            Team team = teams.findById(teamId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Team not found"));
            incident.setTeam(team);
        }
        Incident saved = incidents.save(incident);
        String newAssignee = saved.getAssignee() == null ? "Unassigned" : saved.getAssignee().getName();
        log(saved, actor, "ASSIGNED", oldAssignee, newAssignee);
        return view(saved);
    }

    @Transactional
    public IncidentView transition(@NonNull Long id, TransitionRequest request, AppUser actor) {
        if (request.status() == null) throw new IllegalArgumentException("Status is required");
        Incident incident = find(id);
        IncidentStatus oldStatus = incident.getStatus();
        IncidentStatus nextStatus = request.status();
        if (oldStatus == nextStatus) return view(incident);
        if (!IncidentWorkflow.canTransition(oldStatus, nextStatus)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Invalid status transition: " + oldStatus + " -> " + nextStatus);
        }
        incident.setStatus(nextStatus);
        Incident saved = incidents.save(incident);
        log(saved, actor, "STATUS_CHANGED", oldStatus.name(), nextStatus.name());
        if (request.note() != null && !request.note().isBlank()) {
            comments.save(new IncidentComment(saved, actor, request.note().trim()));
        }
        return view(saved);
    }

    @Transactional(readOnly = true)
    public List<CommentView> comments(@NonNull Long id) {
        find(id);
        return comments.findByIncidentIdOrderByCreatedAtAsc(id).stream()
                .map(c -> new CommentView(c.getId(), c.getAuthor().getName(), c.getMessage(), c.getCreatedAt()))
                .toList();
    }

    @Transactional
    public CommentView addComment(@NonNull Long id, CommentRequest request, AppUser actor) {
        if (request.message() == null || request.message().isBlank() || request.message().length() > 5000) {
            throw new IllegalArgumentException("Comment must contain 1–5000 characters");
        }
        Incident incident = find(id);
        IncidentComment comment = comments.save(new IncidentComment(incident, actor, request.message().trim()));
        if (actor.getRole() != Role.REPORTER) {
            incident.markFirstResponse();
            incidents.save(incident);
        }
        log(incident, actor, "COMMENT_ADDED", null, "Comment added");
        return new CommentView(comment.getId(), actor.getName(), comment.getMessage(), comment.getCreatedAt());
    }

    @Transactional(readOnly = true)
    public List<HistoryView> history(@NonNull Long id) {
        find(id);
        return history.findByIncidentIdOrderByCreatedAtDesc(id).stream()
                .map(h -> new HistoryView(h.getId(), h.getActor() == null ? "System" : h.getActor().getName(),
                        h.getAction(), h.getOldValue(), h.getNewValue(), h.getCreatedAt()))
                .toList();
    }

    @Transactional(readOnly = true)
    public Map<String, Object> summary() {
        long open = incidents.countByStatus(IncidentStatus.OPEN);
        long inProgress = incidents.countByStatus(IncidentStatus.IN_PROGRESS);
        long pending = incidents.countByStatus(IncidentStatus.PENDING);
        long resolved = incidents.countByStatus(IncidentStatus.RESOLVED) + incidents.countByStatus(IncidentStatus.CLOSED);
        long total = incidents.count();
        long responseBreaches = incidents.countByResponseBreachedTrue();
        long resolutionBreaches = incidents.countByResolutionBreachedTrue();
        long breaches = responseBreaches + resolutionBreaches;
        double compliance = total == 0 ? 100 : Math.max(0,
                Math.round((1.0 - (double) breaches / Math.max(1, total * 2)) * 1000.0) / 10.0);
        return Map.ofEntries(
                Map.entry("total", total), Map.entry("open", open), Map.entry("inProgress", inProgress),
                Map.entry("pending", pending), Map.entry("resolved", resolved),
                Map.entry("critical", incidents.countByPriority(IncidentPriority.CRITICAL)),
                Map.entry("high", incidents.countByPriority(IncidentPriority.HIGH)),
                Map.entry("medium", incidents.countByPriority(IncidentPriority.MEDIUM)),
                Map.entry("low", incidents.countByPriority(IncidentPriority.LOW)),
                Map.entry("responseBreaches", responseBreaches), Map.entry("resolutionBreaches", resolutionBreaches),
                Map.entry("slaCompliance", compliance));
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> users() {
        return users.findAll().stream().map(u -> Map.<String, Object>of(
                "id", u.getId(), "name", u.getName(), "email", u.getEmail(), "role", u.getRole().name(),
                "team", u.getTeam() == null ? "Unassigned" : u.getTeam().getName())).toList();
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> policies() {
        return policies.findAll().stream().map(p -> Map.<String, Object>of(
                "priority", p.getPriority().name(), "responseMinutes", p.getResponseMinutes(),
                "resolutionMinutes", p.getResolutionMinutes(), "active", p.isActive())).toList();
    }

    @Transactional
    public void checkSla() {
        Instant now = Instant.now();
        for (Incident incident : incidents.findAll()) {
            boolean changed = false;
            boolean responseMissed = incident.getResponseDueAt().isBefore(now)
                    && (incident.getFirstResponseAt() == null
                    || incident.getFirstResponseAt().isAfter(incident.getResponseDueAt()));
            if (!incident.isResponseBreached() && responseMissed) {
                incident.markResponseBreach();
                log(incident, null, "RESPONSE_SLA_BREACHED", null, incident.getResponseDueAt().toString());
                changed = true;
            }
            boolean resolutionMissed = incident.getResolvedAt() == null
                    ? incident.getResolutionDueAt().isBefore(now)
                    : incident.getResolvedAt().isAfter(incident.getResolutionDueAt());
            if (!incident.isResolutionBreached() && resolutionMissed) {
                incident.markResolutionBreach();
                log(incident, null, "RESOLUTION_SLA_BREACHED", null, incident.getResolutionDueAt().toString());
                changed = true;
            }
            if (changed) incidents.save(incident);
        }
    }

    @NonNull
    private Incident find(@NonNull Long id) {
        Incident incident = incidents.findById(id).orElse(null);
        if (incident == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Incident not found");
        }
        return incident;
    }

    private IncidentView view(Incident i) {
        return new IncidentView(i.getId(), i.getIncidentKey(), i.getTitle(), i.getDescription(),
                i.getStatus().name(), i.getPriority().name(), i.getCategory(), i.getReporter().getId(),
                i.getReporter().getName(), i.getAssignee() == null ? null : i.getAssignee().getId(),
                i.getAssignee() == null ? null : i.getAssignee().getName(),
                i.getTeam() == null ? null : i.getTeam().getId(), i.getTeam() == null ? null : i.getTeam().getName(),
                i.getResponseDueAt(), i.getResolutionDueAt(), i.getFirstResponseAt(), i.isResponseBreached(),
                i.isResolutionBreached(), i.getCreatedAt(), i.getUpdatedAt(), i.getResolvedAt());
    }

    private void log(Incident incident, AppUser actor, String action, String oldValue, String newValue) {
        history.save(new IncidentHistory(incident, actor, action, oldValue, newValue));
    }
}
