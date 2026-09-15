package com.example.gov_scheme_backend.repositories;

import com.example.gov_scheme_backend.entities.Application;
import com.example.gov_scheme_backend.enums.ApplicationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Query;
import com.example.gov_scheme_backend.enums.ReviewStage;
import java.util.List;
import java.util.Optional;

@Repository
public interface ApplicationRepo extends JpaRepository<Application, Long> {

    long countByStageAndAllocatedOfficerIsNull(ReviewStage stage);

    Optional<Application> findByApplicationCode(String applicationCode);

    @Query("SELECT a FROM Application a LEFT JOIN FETCH a.scheme s LEFT JOIN FETCH s.eligibilityRules WHERE a.id = :id")
    Optional<Application> findByIdWithSchemeAndRules(@org.springframework.data.repository.query.Param("id") Long id);

    Optional<Application> findByUser_IdAndScheme_SchemeCode(
            Long userId,
            String schemeCode
    );

    List<Application> findByUser_IdOrderByCreatedAtDesc(Long userId);

    List<Application> findAllByOrderByCreatedAtDesc();

    List<Application> findAllByStatusNotInOrderByCreatedAtDesc(List<ApplicationStatus> statuses);

    List<Application> findByScheme_SchemeCode(String schemeCode);

    List<Application> findByUser_District(String district);

    List<Application> findByUser_Region(String region);

    List<Application> findByStatus(ApplicationStatus status);

    @Query("""
    SELECT a.user.region, COUNT(a.id)
    FROM Application a
    WHERE a.status NOT IN (com.example.gov_scheme_backend.enums.ApplicationStatus.DRAFT, com.example.gov_scheme_backend.enums.ApplicationStatus.PENDING)
    GROUP BY a.user.region
    ORDER BY a.user.region
""")
    List<Object[]> countApplicationsByRegion();

    @Query("""
    SELECT
        COUNT(a),
        SUM(CASE WHEN a.status = 'APPROVED' THEN 1 ELSE 0 END),
        SUM(CASE WHEN a.status = 'REJECTED' THEN 1 ELSE 0 END),
        SUM(CASE WHEN a.status = 'UNDER_REVIEW' THEN 1 ELSE 0 END)
    FROM Application a
    WHERE a.status NOT IN (com.example.gov_scheme_backend.enums.ApplicationStatus.DRAFT, com.example.gov_scheme_backend.enums.ApplicationStatus.PENDING)
""")
    Object[] getApplicationPerformance();

    Long countByStatus(com.example.gov_scheme_backend.enums.ApplicationStatus status);

    Long countByDocumentsIsEmpty();

    @Query("""
        SELECT a.scheme.schemeCode, COUNT(a)
        FROM Application a
        WHERE a.status NOT IN (com.example.gov_scheme_backend.enums.ApplicationStatus.DRAFT, com.example.gov_scheme_backend.enums.ApplicationStatus.PENDING)
        GROUP BY a.scheme.schemeCode
    """)
    List<Object[]> countApplicationsByScheme();

    @Query(value = """
        SELECT FUNCTION('TO_CHAR', a.createdAt, 'YYYY-MM'), COUNT(a)
        FROM Application a
        WHERE a.status NOT IN (com.example.gov_scheme_backend.enums.ApplicationStatus.DRAFT, com.example.gov_scheme_backend.enums.ApplicationStatus.PENDING)
        GROUP BY FUNCTION('TO_CHAR', a.createdAt, 'YYYY-MM')
        ORDER BY 1
    """)
    List<Object[]> countApplicationsByMonth();
}
