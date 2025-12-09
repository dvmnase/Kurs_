package org.example.bank.dto;

import java.math.BigDecimal;
import java.sql.Timestamp;

public class CargoDTO {
    private Long id;
    private Long ownerId;
    private String name;
    private String description;
    private BigDecimal weight;
    private Timestamp createdAt;
    private CargoLocationDTO location;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getOwnerId() {
        return ownerId;
    }

    public void setOwnerId(Long ownerId) {
        this.ownerId = ownerId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public BigDecimal getWeight() {
        return weight;
    }

    public void setWeight(BigDecimal weight) {
        this.weight = weight;
    }

    public Timestamp getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Timestamp createdAt) {
        this.createdAt = createdAt;
    }

    public CargoLocationDTO getLocation() {
        return location;
    }

    public void setLocation(CargoLocationDTO location) {
        this.location = location;
    }
}


