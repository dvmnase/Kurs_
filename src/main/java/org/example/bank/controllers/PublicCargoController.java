package org.example.bank.controllers;

import org.example.bank.dto.CargoDTO;
import org.example.bank.services.CargoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/public/cargo")
public class PublicCargoController {

    @Autowired
    private CargoService cargoService;

    @GetMapping
    public ResponseEntity<List<CargoDTO>> getAllCargos(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String sortBy,
            @RequestParam(required = false) String sortOrder) {
        List<CargoDTO> cargos;
        if (search != null && !search.isEmpty()) {
            cargos = cargoService.searchCargos(search);
        } else {
            cargos = cargoService.getAllCargos();
        }
        // TODO: Применить сортировку к результатам
        return ResponseEntity.ok(cargos);
    }

    @GetMapping("/{id}")
    public ResponseEntity<CargoDTO> getCargo(@PathVariable Long id) {
        return ResponseEntity.ok(cargoService.getCargoById(id));
    }
}

