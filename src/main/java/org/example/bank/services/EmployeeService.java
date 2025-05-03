package org.example.bank.services;


import org.example.bank.dto.EmployeeRequestDTO;
import org.example.bank.dto.EmployeeResponseDTO;
import org.example.bank.entities.Employee;
import org.example.bank.exceptions.ResourceNotFoundException;
import org.example.bank.models.Role;
import org.example.bank.models.User;
import org.example.bank.repositories.EmployeeRepository;
import org.example.bank.repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class EmployeeService {

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private EmployeeResponseDTO convertToDto(Employee employee) {
        EmployeeResponseDTO dto = new EmployeeResponseDTO();
        dto.setId(employee.getId());
        dto.setUsername(employee.getUser().getUsername());
        dto.setEmail(employee.getUser().getEmail());
        dto.setFullName(employee.getFullName());
        dto.setPhoneNumber(employee.getPhoneNumber());
        dto.setRole(employee.getUser().getRole().name());
        return dto;
    }

    public List<EmployeeResponseDTO> getAllEmployees() {
        return employeeRepository.findAll().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    public EmployeeResponseDTO getEmployeeById(Long id) {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found with ID: " + id));
        return convertToDto(employee);
    }

    public EmployeeResponseDTO createEmployee(EmployeeRequestDTO dto) throws IOException {
        // 1. Создаем пользователя
        User user = new User();
        user.setUsername(dto.getUsername());
        user.setEmail(dto.getEmail());
        user.setPassword(passwordEncoder.encode(dto.getPassword()));
        user.setRole(Role.EMPLOYEE);
        userRepository.save(user);

        // 2. Создаем сотрудника
        Employee employee = new Employee();
        employee.setUser(user);
        employee.setFullName(dto.getFullName());
        employee.setPhoneNumber(dto.getPhoneNumber());

        Employee savedEmployee = employeeRepository.save(employee);
        return convertToDto(savedEmployee);
    }


    public EmployeeResponseDTO updateEmployee(Long id, EmployeeRequestDTO dto) {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found with ID: " + id));

        // Обновляем данные сотрудника
        employee.setFullName(dto.getFullName());
        employee.setPhoneNumber(dto.getPhoneNumber());
        employee = employeeRepository.save(employee);

        // Обновляем данные пользователя (если нужно)
        User user = employee.getUser();
        if (dto.getEmail() != null) {
            user.setEmail(dto.getEmail());
        }
        if (dto.getPassword() != null && !dto.getPassword().isEmpty()) {
            user.setPassword(passwordEncoder.encode(dto.getPassword()));
        }
        userRepository.save(user);

        return convertToDto(employee);
    }


    public void deleteEmployee(Long id) {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found with ID: " + id));

        // Получаем связанного пользователя
        User user = employee.getUser();


        employeeRepository.delete(employee);
        userRepository.delete(user);

    }
}
