package org.example.bank.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.example.bank.entities.Account;
import org.example.bank.entities.Client;
import org.example.bank.entities.Application;
import org.example.bank.models.ApplicationStatus;
import org.example.bank.models.ApplicationType;
import org.example.bank.models.User;

import java.sql.Timestamp;

@Data
@NoArgsConstructor
public class FullApplicationInfoDTO {
    private Long id;
    private Long userId;
    private ApplicationType type;
    private Long accountId;
    private ApplicationStatus status;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public ApplicationType getType() {
        return type;
    }

    public void setType(ApplicationType type) {
        this.type = type;
    }

    public Long getAccountId() {
        return accountId;
    }

    public void setAccountId(Long accountId) {
        this.accountId = accountId;
    }

    public ApplicationStatus getStatus() {
        return status;
    }

    public void setStatus(ApplicationStatus status) {
        this.status = status;
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

    public AccountInfoDTO getAccount() {
        return account;
    }

    public void setAccount(AccountInfoDTO account) {
        this.account = account;
    }

    public ClientInfoDTO getClient() {
        return client;
    }

    public void setClient(ClientInfoDTO client) {
        this.client = client;
    }

    private String comment;
    private Timestamp createdAt;
    private Timestamp updatedAt;

    private AccountInfoDTO account;
    private ClientInfoDTO client;

    public FullApplicationInfoDTO(Application application, Account account, Client client, User user) {
        this.id = application.getId();
        this.userId = application.getUserId();
        this.type = application.getType();
        this.accountId = application.getAccountId();
        this.status = application.getStatus();
        this.comment = application.getComment();
        this.createdAt = application.getCreatedAt();
        this.updatedAt = application.getUpdatedAt();

        this.account = new AccountInfoDTO(account);
        this.client = new ClientInfoDTO(client, user);
    }

    @Data
    @NoArgsConstructor
    public static class AccountInfoDTO {
        private Long id;

        public Long getId() {
            return id;
        }

        public void setId(Long id) {
            this.id = id;
        }

        public String getAccountNumber() {
            return accountNumber;
        }

        public void setAccountNumber(String accountNumber) {
            this.accountNumber = accountNumber;
        }

        public Double getBalance() {
            return balance;
        }

        public void setBalance(Double balance) {
            this.balance = balance;
        }

        public String getStatus() {
            return status;
        }

        public void setStatus(String status) {
            this.status = status;
        }

        private String accountNumber;
        private Double balance;
        private String status;

        public AccountInfoDTO(Account account) {
            this.id = account.getId();
            this.accountNumber = account.getAccountNumber();
            this.balance = account.getBalance();
            this.status = account.getStatus().name();
        }
    }

    @Data
    @NoArgsConstructor
    public static class ClientInfoDTO {
        public Long getId() {
            return id;
        }

        public void setId(Long id) {
            this.id = id;
        }

        public String getFullName() {
            return fullName;
        }

        public void setFullName(String fullName) {
            this.fullName = fullName;
        }

        public String getPhoneNumber() {
            return phoneNumber;
        }

        public void setPhoneNumber(String phoneNumber) {
            this.phoneNumber = phoneNumber;
        }

        public String getEmail() {
            return email;
        }

        public void setEmail(String email) {
            this.email = email;
        }

        public Boolean getBlocked() {
            return blocked;
        }

        public void setBlocked(Boolean blocked) {
            this.blocked = blocked;
        }

        private Long id;
        private String fullName;
        private String phoneNumber;
        private String email;
        private Boolean blocked;

        public ClientInfoDTO(Client client, User user) {
            this.id = client.getId();
            this.fullName = client.getFullName();
            this.phoneNumber = client.getPhoneNumber();
            this.email = user.getEmail();
            this.blocked = client.getBlocked();
        }
    }
}
