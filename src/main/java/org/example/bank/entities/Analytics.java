package org.example.bank.entities;

import jakarta.persistence.*;
import lombok.Data;

import java.math.BigDecimal;
import java.sql.Timestamp;

@Entity
@Table(name = "analytics")
@Data
public class Analytics {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "metric", nullable = false)
    private String metric;

    @Column(name = "value", precision = 20, scale = 2)
    private BigDecimal value;

    @Column(name = "calculated_at", nullable = false, updatable = false)
    private Timestamp calculatedAt = new Timestamp(System.currentTimeMillis());

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getMetric() {
        return metric;
    }

    public void setMetric(String metric) {
        this.metric = metric;
    }

    public BigDecimal getValue() {
        return value;
    }

    public void setValue(BigDecimal value) {
        this.value = value;
    }

    public Timestamp getCalculatedAt() {
        return calculatedAt;
    }

    public void setCalculatedAt(Timestamp calculatedAt) {
        this.calculatedAt = calculatedAt;
    }
}


