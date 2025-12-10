package org.example.bank.dto;

import org.example.bank.models.RequestStatus;

import java.sql.Date;
import java.sql.Timestamp;

public class RequestDTO {
    private Long id;
    private Long cargoId;
    private Long ownerId;
    private Long carrierId;
    private RequestStatus status;
    private Date pickupDate;
    private Date deliveryDate;
    private String comment;
    private Timestamp createdAt;
    private Timestamp updatedAt;
    private CargoDTO cargo;
    private String ownerName;
    private String carrierName;
    private Boolean hasRoute; // есть ли подтвержденный маршрут

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

    public Long getOwnerId() {
        return ownerId;
    }

    public void setOwnerId(Long ownerId) {
        this.ownerId = ownerId;
    }

    public Long getCarrierId() {
        return carrierId;
    }

    public void setCarrierId(Long carrierId) {
        this.carrierId = carrierId;
    }

    public RequestStatus getStatus() {
        return status;
    }

    public void setStatus(RequestStatus status) {
        this.status = status;
    }

    public Date getPickupDate() {
        return pickupDate;
    }

    public void setPickupDate(Date pickupDate) {
        this.pickupDate = pickupDate;
    }

    public Date getDeliveryDate() {
        return deliveryDate;
    }

    public void setDeliveryDate(Date deliveryDate) {
        this.deliveryDate = deliveryDate;
    }

    public String getComment() {
        return comment;
    }

    public void setComment(String comment) {
        this.comment = comment;
    }

    public Timestamp getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Timestamp createdAt) {
        this.createdAt = createdAt;
    }

    public Timestamp getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Timestamp updatedAt) {
        this.updatedAt = updatedAt;
    }

    public CargoDTO getCargo() {
        return cargo;
    }

    public void setCargo(CargoDTO cargo) {
        this.cargo = cargo;
    }

    public String getOwnerName() {
        return ownerName;
    }

    public void setOwnerName(String ownerName) {
        this.ownerName = ownerName;
    }

    public String getCarrierName() {
        return carrierName;
    }

    public void setCarrierName(String carrierName) {
        this.carrierName = carrierName;
    }

    public Boolean getHasRoute() {
        return hasRoute;
    }

    public void setHasRoute(Boolean hasRoute) {
        this.hasRoute = hasRoute;
    }
}




