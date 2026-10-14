package com.incidentiq.auth;
import com.incidentiq.user.AppUser;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
@RestController @RequestMapping("/api/v1/auth")
public class AuthController {
 private final AuthenticationManager manager;private final JwtService jwt;
 public AuthController(AuthenticationManager m,JwtService j){manager=m;jwt=j;}
 public record LoginRequest(@Email @NotBlank String email,@NotBlank String password){}
 public record UserView(Long id,String name,String email,String role,String team){}
 public record LoginResponse(String token,UserView user){}
 @PostMapping("/login") public LoginResponse login(@Valid @RequestBody LoginRequest r){Authentication a=manager.authenticate(new UsernamePasswordAuthenticationToken(r.email(),r.password()));AppUser u=(AppUser)a.getPrincipal();return new LoginResponse(jwt.generateToken(u),view(u));}
 @GetMapping("/me") public UserView me(@AuthenticationPrincipal AppUser u){return view(u);}
 private UserView view(AppUser u){return new UserView(u.getId(),u.getName(),u.getEmail(),u.getRole().name(),u.getTeam()==null?null:u.getTeam().getName());}
}
