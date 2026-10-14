package com.incidentiq.auth;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
@Service
public class JwtService {
 private final SecretKey key; private final long expirationMinutes;
 public JwtService(@Value("${app.jwt.secret}") String secret,@Value("${app.jwt.expiration-minutes:480}") long expirationMinutes){byte[] bytes=secret.getBytes(StandardCharsets.UTF_8);if(bytes.length<32)throw new IllegalArgumentException("JWT_SECRET must contain at least 32 bytes");if(expirationMinutes<1)throw new IllegalArgumentException("JWT_EXPIRATION_MINUTES must be positive");key=Keys.hmacShaKeyFor(bytes);this.expirationMinutes=expirationMinutes;}
 public String generateToken(UserDetails user){Instant now=Instant.now();return Jwts.builder().subject(user.getUsername()).issuedAt(Date.from(now)).expiration(Date.from(now.plusSeconds(expirationMinutes*60))).signWith(key).compact();}
 public String extractUsername(String token){return claims(token).getSubject();}
 public boolean isValid(String token,UserDetails user){try{Claims claims=claims(token);return user.isEnabled()&&user.getUsername().equals(claims.getSubject())&&claims.getExpiration().after(new Date());}catch(JwtException|IllegalArgumentException e){return false;}}
 private Claims claims(String token){return Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload();}
}
