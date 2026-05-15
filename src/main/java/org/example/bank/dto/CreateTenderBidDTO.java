package org.example.bank.dto;

import java.math.BigDecimal;
import java.sql.Date;

public class CreateTenderBidDTO {
    private BigDecimal price;
    private Date deliveryDate;
    private String comment;

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
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
}
