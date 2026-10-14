package com.incidentiq;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.lang.NonNull;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.MySQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.Objects;
import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers(disabledWithoutDocker = true)
class IncidentApiIntegrationTest {
    @Container
    private static final MySQLContainer<?> MYSQL = new MySQLContainer<>("mysql:8.4");

    @DynamicPropertySource
    static void configureDatabase(DynamicPropertyRegistry properties) {
        properties.add("spring.datasource.url", MYSQL::getJdbcUrl);
        properties.add("spring.datasource.username", MYSQL::getUsername);
        properties.add("spring.datasource.password", MYSQL::getPassword);
    }

    @Autowired
    private MockMvc mvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void protectedEndpointsRejectAnonymousAndInvalidCredentials() throws Exception {
        mvc.perform(get("/api/v1/auth/me"))
                .andExpect(status().isUnauthorized());

        mvc.perform(post("/api/v1/auth/login")
                        .contentType(jsonContentType())
                        .content(jsonBytes(Map.of(
                                "email", "admin@incidentiq.local",
                                "password", "incorrect"))))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.detail").value("Invalid email or password"));
    }

    @Test
    void loginCreatesAuthenticatedSessionAndRoleRestrictionsAreEnforced() throws Exception {
        String reporterToken = login("reporter@incidentiq.local");
        String adminToken = login("admin@incidentiq.local");

        mvc.perform(get("/api/v1/auth/me")
                        .header("Authorization", "Bearer " + reporterToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("REPORTER"));

        String incidentResponse = mvc.perform(post("/api/v1/incidents")
                        .header("Authorization", "Bearer " + reporterToken)
                        .contentType(jsonContentType())
                        .content(jsonBytes(Map.of(
                                "title", "Integration test incident",
                                "description", "Created by the API integration test.",
                                "priority", "MEDIUM",
                                "category", "TEST"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Integration test incident"))
                .andReturn()
                .getResponse()
                .getContentAsString();

        int incidentId = objectMapper.readTree(incidentResponse).get("id").asInt();

        mvc.perform(post("/api/v1/incidents/{id}/assign", incidentId)
                        .header("Authorization", "Bearer " + reporterToken)
                        .contentType(jsonContentType())
                        .content(jsonBytes(Map.of("assigneeId", 2))))
                .andExpect(status().isForbidden());

        mvc.perform(post("/api/v1/incidents/{id}/transition", incidentId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(jsonContentType())
                        .content(jsonBytes(Map.of("status", "IN_PROGRESS"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("IN_PROGRESS"));
    }

    @Test
    void invalidIncidentPayloadReturnsBadRequest() throws Exception {
        String token = login("reporter@incidentiq.local");

        mvc.perform(post("/api/v1/incidents")
                        .header("Authorization", "Bearer " + token)
                        .contentType(jsonContentType())
                        .content("""
                                {"title":"  ","description":"","priority":null}
                                """))
                .andExpect(status().isBadRequest());
    }

    private String login(String email) throws Exception {
        String response = mvc.perform(post("/api/v1/auth/login")
                        .contentType(jsonContentType())
                        .content(jsonBytes(Map.of(
                                "email", email,
                                "password", "IncidentIQ@123"))))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        return objectMapper.readTree(response).get("token").asText();
    }

    @NonNull
    private static MediaType jsonContentType() {
        return Objects.requireNonNull(MediaType.APPLICATION_JSON);
    }

    @NonNull
    private byte[] jsonBytes(Object value) throws Exception {
        return Objects.requireNonNull(objectMapper.writeValueAsBytes(value));
    }
}
