package com.incidentiq.config;
import com.incidentiq.auth.JwtAuthenticationFilter;
import com.incidentiq.user.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ProblemDetail;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
@Configuration @EnableWebSecurity @EnableMethodSecurity
public class SecurityConfig {
 @Bean UserDetailsService userDetailsService(UserRepository users){return email->users.findByEmailIgnoreCase(email).orElseThrow(()->new UsernameNotFoundException("User not found"));}
 @Bean PasswordEncoder passwordEncoder(){return new BCryptPasswordEncoder();}
 @Bean DaoAuthenticationProvider authenticationProvider(UserDetailsService users,PasswordEncoder encoder){DaoAuthenticationProvider p=new DaoAuthenticationProvider();p.setUserDetailsService(users);p.setPasswordEncoder(encoder);return p;}
 @Bean AuthenticationManager authenticationManager(AuthenticationConfiguration c)throws Exception{return c.getAuthenticationManager();}
 @Bean SecurityFilterChain securityFilterChain(HttpSecurity http,JwtAuthenticationFilter filter,DaoAuthenticationProvider provider,ObjectMapper objectMapper)throws Exception{return http.csrf(c->c.disable()).cors(c->{}).sessionManagement(s->s.sessionCreationPolicy(SessionCreationPolicy.STATELESS)).httpBasic(h->h.disable()).formLogin(f->f.disable()).exceptionHandling(e->e.authenticationEntryPoint((request,response,exception)->{response.setStatus(HttpStatus.UNAUTHORIZED.value());response.setContentType(MediaType.APPLICATION_PROBLEM_JSON_VALUE);String detail="/api/v1/auth/login".equals(request.getRequestURI())?"Invalid email or password":"Authentication required";objectMapper.writeValue(response.getOutputStream(),ProblemDetail.forStatusAndDetail(HttpStatus.UNAUTHORIZED,detail));}).accessDeniedHandler((request,response,exception)->response.sendError(HttpStatus.FORBIDDEN.value()))).authenticationProvider(provider).authorizeHttpRequests(a->a.requestMatchers("/api/v1/auth/login","/actuator/health","/swagger-ui/**","/v3/api-docs/**").permitAll().anyRequest().authenticated()).addFilterBefore(filter,UsernamePasswordAuthenticationFilter.class).build();}
 @Bean CorsConfigurationSource corsConfigurationSource(@Value("${app.cors.allowed-origins}")String origins){CorsConfiguration c=new CorsConfiguration();List<String> allowedOrigins=new ArrayList<>();for(String origin:origins.split(",")){if(origin!=null){String trimmed=origin.trim();if(!trimmed.isEmpty())allowedOrigins.add(trimmed);}}c.setAllowedOrigins(allowedOrigins);c.setAllowedMethods(Arrays.asList("GET","POST","PUT","PATCH","DELETE","OPTIONS"));c.setAllowedHeaders(Arrays.asList("Authorization","Content-Type","Accept"));UrlBasedCorsConfigurationSource s=new UrlBasedCorsConfigurationSource();s.registerCorsConfiguration("/**",c);return s;}
}
