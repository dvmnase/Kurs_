package org.example.bank.responses;

public class AuthResponse {
    private String token;
    private String role;

    public Object getData() {
        return data;
    }

    public void setData(Object data) {
        this.data = data;
    }

    private Object data;

    public AuthResponse(String token, String role, Object data) {
        this.token = token;
        this.role = role;
        this.data = data;
    }

    // Геттеры и сеттеры
    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }
}