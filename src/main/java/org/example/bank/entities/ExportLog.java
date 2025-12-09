package org.example.bank.entities;

import jakarta.persistence.*;
import lombok.Data;
import org.example.bank.models.ExportType;
import org.example.bank.models.User;

import java.sql.Timestamp;

@Entity
@Table(name = "export_logs")
@Data
public class ExportLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false)
    private ExportType type;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Timestamp createdAt = new Timestamp(System.currentTimeMillis());

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public ExportType getType() {
        return type;
    }

    public void setType(ExportType type) {
        this.type = type;
    }

    public Timestamp getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Timestamp createdAt) {
        this.createdAt = createdAt;
    }
}


