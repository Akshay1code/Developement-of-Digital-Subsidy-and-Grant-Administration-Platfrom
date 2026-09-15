package com.example.gov_scheme_backend.dto.request.application;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FieldValueRequestDTO {
    private String fieldName;
    private String value;
}
