package com.example.gov_scheme_backend.repositories;

import com.example.gov_scheme_backend.entities.DisbursementMilestone;
import com.example.gov_scheme_backend.entities.DisbursementPlan;
import com.example.gov_scheme_backend.enums.MilestoneStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DisbursementMilestoneRepo
        extends JpaRepository<DisbursementMilestone, Long> {

    List<DisbursementMilestone> findByPlanOrderByStageNumberAsc(
            DisbursementPlan plan
    );

    List<DisbursementMilestone> findByPlanInOrderByStageNumberAsc(
            java.util.Collection<DisbursementPlan> plans
    );

    Optional<DisbursementMilestone> findByPlanAndStageNumber(
            DisbursementPlan plan,
            Integer stageNumber
    );

    List<DisbursementMilestone> findByCompletionStatus(
            MilestoneStatus completionStatus
    );

    List<DisbursementMilestone> findByCompletionStatusAndDueDateBetween(
            MilestoneStatus status,
            java.time.LocalDate startDate,
            java.time.LocalDate endDate
    );

    List<DisbursementMilestone> findByCompletionStatusAndDueDateBefore(
            MilestoneStatus status,
            java.time.LocalDate date
    );

    List<DisbursementMilestone> findByPlan_PlanId(
            Long planId
    );

    Long countByCompletionStatus(com.example.gov_scheme_backend.enums.MilestoneStatus status);

    @Query(value = """
        SELECT COALESCE(m.resolvedReason, 'Unspecified'), COUNT(m)
        FROM DisbursementMilestone m
        WHERE m.completionStatus = com.example.gov_scheme_backend.enums.MilestoneStatus.OVERDUE
        GROUP BY COALESCE(m.resolvedReason, 'Unspecified')
        ORDER BY COUNT(m) DESC
    """)
    List<Object[]> countOverdueByReason();

    @Query(value = """
        SELECT FUNCTION('TO_CHAR', m.releaseDate, 'YYYY-MM'), COUNT(m)
        FROM DisbursementMilestone m
        WHERE m.completionStatus = com.example.gov_scheme_backend.enums.MilestoneStatus.RELEASED
          AND m.releaseDate IS NOT NULL
        GROUP BY FUNCTION('TO_CHAR', m.releaseDate, 'YYYY-MM')
        ORDER BY 1
    """)
    List<Object[]> countReleasedMilestonesByMonth();

    @Query("""
        SELECT m, a
        FROM DisbursementMilestone m
        JOIN m.plan p
        JOIN Application a ON p.applicationId = a.id
        JOIN FETCH a.user u
        JOIN FETCH a.scheme s
        WHERE m.completionStatus = com.example.gov_scheme_backend.enums.MilestoneStatus.OVERDUE
    """)
    List<Object[]> findOverdueMilestonesWithApplication();

    @Query("""
        SELECT m, a
        FROM DisbursementMilestone m
        JOIN m.plan p
        JOIN Application a ON p.applicationId = a.id
        JOIN FETCH a.user
        WHERE m.completionStatus = com.example.gov_scheme_backend.enums.MilestoneStatus.PENDING 
          AND m.dueDate BETWEEN :startDate AND :endDate
    """)
    List<Object[]> findUpcomingPendingMilestonesWithApplication(
            @org.springframework.data.repository.query.Param("startDate") java.time.LocalDate startDate,
            @org.springframework.data.repository.query.Param("endDate") java.time.LocalDate endDate
    );

    @Query("""
        SELECT m, a
        FROM DisbursementMilestone m
        JOIN m.plan p
        JOIN Application a ON p.applicationId = a.id
        JOIN FETCH a.user
        WHERE m.completionStatus = com.example.gov_scheme_backend.enums.MilestoneStatus.PENDING 
          AND m.dueDate < :date
    """)
    List<Object[]> findOverduePendingMilestonesWithApplication(
            @org.springframework.data.repository.query.Param("date") java.time.LocalDate date
    );
}
