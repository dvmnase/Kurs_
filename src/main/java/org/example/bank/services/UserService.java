package org.example.bank.services;


import org.example.bank.UserDetailsImpl;
import org.example.bank.models.User;
import org.example.bank.repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class UserService implements UserDetailsService {


    private UserRepository userRepository;

    @Autowired
    public void setUserRepository(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public UserDetails loadUserByUsername (String username)  throws UsernameNotFoundException {
        User user = userRepository.findUserByUsername(username).orElseThrow(() -> new UsernameNotFoundException(
                String.format("User %s not found", username)
        ));
        return UserDetailsImpl.build(user);
    }
    public List<User> getAllUsers() {
        return userRepository.findAllByOrderByIdAsc();
    }
    public Optional<User> findByUsername(String username) {
        return userRepository.findUserByUsername(username);
    }
    public Optional<User> findById(Long id) {
        return userRepository.findById(id);
    }
}
