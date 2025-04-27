package org.example.bank.controllers;


import org.example.bank.JwtCore;
import org.example.bank.models.User;
import org.example.bank.repositories.UserRepository;
import org.example.bank.requests.SigninRequest;
import org.example.bank.requests.SignupRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
public class SecurityController {


    private UserRepository userRepository;
    private PasswordEncoder passwordEncoder;
    private AuthenticationManager authenticationManager;
    private JwtCore jwtCore;


   @Autowired
    public void setAuthenticationManager(AuthenticationManager  authenticationManager) {
        this.authenticationManager = authenticationManager;
    }



    @Autowired
    public void setPasswordEncoder(PasswordEncoder passwordEncoder) {
        this.passwordEncoder = passwordEncoder;
    }


    @Autowired
    public void setUserRepository(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Autowired
    public void setJwtCore(JwtCore jwtCore) {
        this.jwtCore = jwtCore;
    }


    @PostMapping("/signup")
    ResponseEntity<?> signup(@RequestBody SignupRequest signupRequest) {
        if (userRepository.existsByUsername(signupRequest.getUsername())){
           return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Username already exists");
       }
       if (userRepository.existsByEmail(signupRequest.getEmail())){
           return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Email already exists");
       }
       User user = new User();
       user.setUsername(signupRequest.getUsername());
       user.setPassword(passwordEncoder.encode(signupRequest.getPassword()));
       user.setEmail( signupRequest.getEmail());
       userRepository.save(user);
       return ResponseEntity.status(HttpStatus.CREATED).body(user);
    }
    @PostMapping("/signin")
    ResponseEntity<?> signin(@RequestBody SigninRequest signinRequest) {
       Authentication authentication = null;
       try {
           authentication = authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(signinRequest.getUsername(), signinRequest.getPassword()));

       } catch (BadCredentialsException e) {
           return new ResponseEntity<>(HttpStatus.UNAUTHORIZED);
       }
       SecurityContextHolder.getContext().setAuthentication(authentication);
       String jwt = jwtCore.generateToken(authentication);
       return ResponseEntity.ok(jwt);

    }
 //
}
