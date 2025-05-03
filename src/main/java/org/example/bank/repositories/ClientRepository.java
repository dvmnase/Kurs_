package org.example.bank.repositories;


import org.example.bank.entities.Client;
import org.example.bank.models.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ClientRepository extends JpaRepository<Client, Long> {
    List<Client> findAllByOrderByIdAsc();
    Optional<Client> findByUserId(Long userId);
    Optional<Client> findByUser(User user);
}

