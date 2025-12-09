package org.example.bank.controllers;


import org.example.bank.JwtCore;
import org.example.bank.UserDetailsImpl;
import org.example.bank.entities.Owner;
import org.example.bank.entities.Carrier;
import org.example.bank.models.Role;
import org.example.bank.models.User;
import org.example.bank.repositories.OwnerRepository;
import org.example.bank.repositories.CarrierRepository;
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

import java.util.Map;


@RestController
@RequestMapping("/auth")
public class SecurityController {


    private UserRepository userRepository;
    private PasswordEncoder passwordEncoder;
    private AuthenticationManager authenticationManager;
    private OwnerRepository ownerRepository;
    private CarrierRepository carrierRepository;
    private JwtCore jwtCore;




    @Autowired
    public void setAuthenticationManager(AuthenticationManager  authenticationManager) {
        this.authenticationManager = authenticationManager;
    }



    @Autowired
    public void setOwnerRepository(OwnerRepository ownerRepository) {
        this.ownerRepository = ownerRepository;
    }
    @Autowired
    public void setCarrierRepository(CarrierRepository carrierRepository) {
        this.carrierRepository = carrierRepository;
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

            // Определяем роль
            Role role = Role.OWNER; // по умолчанию
            if (signupRequest.getRole() != null) {
                try {
                    role = Role.valueOf(signupRequest.getRole().toUpperCase());
                } catch (IllegalArgumentException e) {
                    return ResponseEntity.badRequest().body("Invalid role");
                }
            }

            // создаем пользователя
            User user = new User();
            user.setUsername(signupRequest.getUsername());
            user.setEmail(signupRequest.getEmail());
            user.setPassword(passwordEncoder.encode(signupRequest.getPassword()));
            user.setRole(role);
            user.setCreatedAt(new java.sql.Timestamp(System.currentTimeMillis()));
            user = userRepository.save(user);

            // создаем соответствующую сущность в зависимости от роли
            if (role == Role.OWNER) {
                Owner owner = new Owner();
                owner.setUser(user);
                owner.setFullName(signupRequest.getFullName());
                owner.setPhone(signupRequest.getPhoneNumber());
                ownerRepository.save(owner);
                return ResponseEntity.ok("Owner registered successfully");
            } else if (role == Role.CARRIER) {
                Carrier carrier = new Carrier();
                carrier.setUser(user);
                carrier.setCompanyName(signupRequest.getCompanyName());
                carrier.setPhone(signupRequest.getPhoneNumber());
                carrierRepository.save(carrier);
                return ResponseEntity.ok("Carrier registered successfully");
            } else {
                return ResponseEntity.badRequest().body("Invalid role for registration");
            }
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
                .orElse("ROLE_USER");

        System.out.println("11111111111111111");
        System.out.println(role);
        Long userId = userDetails.getId();

        return switch (role) {
            case "ROLE_OWNER" -> ownerRepository.findByUserId(userId)
                    .map(owner -> ResponseEntity.ok(new AuthResponse(jwt, "OWNER", Map.of(
                            "id", owner.getId(),
                            "fullName", owner.getFullName(),
                            "phone", owner.getPhone()
                    ))))
                    .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).body(new AuthResponse(jwt, "OWNER", null)));

            case "ROLE_CARRIER" -> carrierRepository.findByUserId(userId)
                    .map(carrier -> ResponseEntity.ok(new AuthResponse(jwt, "CARRIER", Map.of(
                            "id", carrier.getId(),
                            "companyName", carrier.getCompanyName() != null ? carrier.getCompanyName() : "",
                            "phone", carrier.getPhone() != null ? carrier.getPhone() : ""
                    ))))
                    .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).body(new AuthResponse(jwt, "CARRIER", null)));

            case "ROLE_ADMIN" -> ResponseEntity.ok(new AuthResponse(jwt, "ADMIN", null));

            default -> ResponseEntity.status(HttpStatus.FORBIDDEN).body(new AuthResponse(jwt, "UNKNOWN", null));
        };
    }

    //
}
