package org.example.bank.controllers;


import org.example.bank.JwtCore;
import org.example.bank.UserDetailsImpl;
import org.example.bank.entities.Client;
import org.example.bank.models.Role;
import org.example.bank.models.User;
import org.example.bank.repositories.ClientRepository;
import org.example.bank.repositories.EmployeeRepository;
import org.example.bank.repositories.UserRepository;
import org.example.bank.requests.SigninRequest;
import org.example.bank.requests.SignupRequest;
import org.example.bank.responses.AuthResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
public class SecurityController {


    private UserRepository userRepository;
    private PasswordEncoder passwordEncoder;
    private AuthenticationManager authenticationManager;
    private ClientRepository clientRepository;
    private EmployeeRepository employeeRepository;
    private JwtCore jwtCore;




    @Autowired
    public void setAuthenticationManager(AuthenticationManager  authenticationManager) {
        this.authenticationManager = authenticationManager;
    }



    @Autowired
    public void setClientRepository(ClientRepository clientRepository) {
        this.clientRepository = clientRepository;
    }
    @Autowired
    public void setEmployeeRepository(EmployeeRepository employeeRepository) {
        this.employeeRepository = employeeRepository;
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
    public ResponseEntity<?> signup(@RequestBody SignupRequest signupRequest) {
        try {
            if (userRepository.existsByUsername(signupRequest.getUsername())) {
                return ResponseEntity.badRequest().body("Username already exists");
            }
            if (userRepository.existsByEmail(signupRequest.getEmail())) {
                return ResponseEntity.badRequest().body("Email already exists");
            }

            // создаем пользователя с ролью USER
            User user = new User();
            user.setUsername(signupRequest.getUsername());
            user.setEmail(signupRequest.getEmail());
            user.setPassword(passwordEncoder.encode(signupRequest.getPassword()));
            user.setRole(Role.USER);
            user = userRepository.save(user);

            // создаем клиента, привязываем к пользователю
            Client client = new Client();
            client.setUser(user);
            client.setFullName(signupRequest.getFullName());
            client.setPhoneNumber(signupRequest.getPhoneNumber());
            clientRepository.save(client);

            return ResponseEntity.ok("Client registered successfully");
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Registration failed: " + e.getMessage());
        }
    }
    @PostMapping("/signin")
    public ResponseEntity<AuthResponse> signin(@RequestBody SigninRequest signinRequest) {
        Authentication authentication;
        try {
            authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            signinRequest.getUsername(), signinRequest.getPassword()));
        } catch (BadCredentialsException e) {
            return new ResponseEntity<>(HttpStatus.UNAUTHORIZED);
        }

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = jwtCore.generateToken(authentication);

        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        String role = userDetails.getAuthorities().stream()
                .findFirst()
                .map(GrantedAuthority::getAuthority)
                .orElse("ROLE_USER")
                .replace("ROLE_", "");

        Long userId = userDetails.getId();

        return switch (role) {
            case "USER" -> clientRepository.findByUserId(userId)
                    .map(client -> ResponseEntity.ok(new AuthResponse(jwt, role, client)))
                    .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).body(new AuthResponse(jwt, role, null)));

            case "EMPLOYEE" -> employeeRepository.findByUserId(userId)
                    .map(employee -> ResponseEntity.ok(new AuthResponse(jwt, role, employee)))
                    .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).body(new AuthResponse(jwt, role, null)));

            case "ADMIN" -> ResponseEntity.ok(new AuthResponse(jwt, role, null));

            default -> ResponseEntity.status(HttpStatus.FORBIDDEN).body(new AuthResponse(jwt, "UNKNOWN", null));
        };
    }

    //
}
