package com.example.gov_scheme_backend.dto.request.schemes;

import com.example.gov_scheme_backend.enums.RuleOperator;
import lombok.Data;

@Data
public class SchemeEligibilityRuleRequestDTO {

    private Integer schemeId;
    private String fieldName;

    private RuleOperator operator;

    private String expectedValue;

    private Integer points;

    private Double partialPercentage;
}
