package org.example.bank.dto;

import java.math.BigDecimal;
import java.sql.Timestamp;

public class RouteDTO {
    private Long id;
    private Long cargoId;
    private String startAddress;
    private String endAddress;
    private BigDecimal startLat;
    private BigDecimal startLng;
    private BigDecimal endLat;
    private BigDecimal endLng;
    private Timestamp createdAt;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getCargoId() {
        return cargoId;
    }

    public void setCargoId(Long cargoId) {
        this.cargoId = cargoId;
    }

    public String getStartAddress() {
        return startAddress;
    }

    public void setStartAddress(String startAddress) {
        this.startAddress = startAddress;
    }

    public String getEndAddress() {
        return endAddress;
    }

    public void setEndAddress(String endAddress) {
        this.endAddress = endAddress;
    }

    public BigDecimal getStartLat() {
        return startLat;
    }

    public void setStartLat(BigDecimal startLat) {
        this.startLat = startLat;
    }

    public BigDecimal getStartLng() {
        return startLng;
    }

    public void setStartLng(BigDecimal startLng) {
        this.startLng = startLng;
    }

    public BigDecimal getEndLat() {
        return endLat;
    }

    public void setEndLat(BigDecimal endLat) {
        this.endLat = endLat;
    }

    public BigDecimal getEndLng() {
        return endLng;
    }

    public void setEndLng(BigDecimal endLng) {
        this.endLng = endLng;
    }

    public Timestamp getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Timestamp createdAt) {
        this.createdAt = createdAt;
    }
}


