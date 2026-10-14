package com.incidentiq.common;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;
import java.util.stream.Collectors;
@RestControllerAdvice
public class ApiExceptionHandler {
 @ExceptionHandler(AuthenticationException.class) public ProblemDetail authentication(){return ProblemDetail.forStatusAndDetail(HttpStatus.UNAUTHORIZED,"Invalid email or password");}
 @ExceptionHandler(ResponseStatusException.class) public ProblemDetail status(ResponseStatusException e){return ProblemDetail.forStatusAndDetail(e.getStatusCode(),e.getReason()==null?"Request failed":e.getReason());}
 @ExceptionHandler(MethodArgumentNotValidException.class) public ProblemDetail validation(MethodArgumentNotValidException e){String m=e.getBindingResult().getFieldErrors().stream().map(x->x.getField()+": "+x.getDefaultMessage()).collect(Collectors.joining("; "));return ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST,m);}
 @ExceptionHandler(IllegalArgumentException.class) public ProblemDetail illegal(IllegalArgumentException e){return ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST,e.getMessage());}
}
