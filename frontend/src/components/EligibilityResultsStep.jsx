import { motion } from 'framer-motion'

function humanizeEnum(value) {
  return String(value || '')
    .replace(/_/g, ' ')
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, char => char.toUpperCase())
}

function humanizeCondition(op, expectedValue) {
  switch (op) {
    case 'EQUALS': return `Exactly ${expectedValue}`
    case 'NOT_EQUALS': return `Cannot be ${expectedValue}`
    case 'GREATER_THAN': return `More than ${expectedValue}`
    case 'GREATER_THAN_EQUAL': return `At least ${expectedValue}`
    case 'LESS_THAN': return `Less than ${expectedValue}`
    case 'LESS_THAN_EQUAL': return `Up to ${expectedValue}`
    default: return `${op} ${expectedValue}`
  }
}

export default function EligibilityResultsStep({
  eligibilityResult,
  eligibilityError,
  eligibilityScore,
  eligibilityThreshold,
  eligibilityTotalPossible,
  onBack,
  onNext,
  canProceedToDocs
}) {
  const totalScore = Number(eligibilityTotalPossible || Math.max(eligibilityScore, eligibilityThreshold, 1));
  const fillPercent = Math.min(100, (eligibilityScore / totalScore) * 100);
  const thresholdPercent = Math.min(100, (eligibilityThreshold / totalScore) * 100);

  return (
    <motion.div
      className="scheme-form-layout eligibility-results-container"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      style={{ marginTop: '0' }}
    >
      <div className="eligibility-results-header" style={{ marginBottom: '2rem' }}>
        <h2>Eligibility Evaluation Results</h2>
        <p>Review the breakdown of your recent assessment.</p>
      </div>

      {eligibilityResult ? (
        <div className="eligibility-results-grid">
          <div className="eligibility-results-left">
            <div className={`eligibility-status-card ${eligibilityResult.status ? 'status-eligible' : 'status-ineligible'}`}>
              <div className="status-icon">
                {eligibilityResult.status ? '✓' : '✕'}
              </div>
              <h3>{eligibilityResult.status ? 'Eligible' : 'Not Eligible'}</h3>
              <p>
                {eligibilityResult.status 
                  ? 'Based on the provided information, you meet the requirements for this scheme.'
                  : 'Based on the provided information, you do not meet the minimum requirements at this time.'}
              </p>
            </div>

            <div className="eligibility-score-summary-card">
              <span className="score-summary-label">SCORE SUMMARY</span>
              <div className="score-summary-values">
                <div className="score-computed">
                  <span className="score-label">Computed Total</span>
                  <span className="score-value">
                    {Number(eligibilityScore || 0).toFixed(1)}
                    <span style={{ fontSize: '0.65em', color: 'var(--muted)', fontWeight: 'normal' }}>
                      {' '}/ {Number(eligibilityTotalPossible || 0).toFixed(1)}
                    </span>
                  </span>
                </div>
                {/* Required threshold hidden — threshold can exceed totalPossible which is misleading */}
              </div>
              <div className="score-progress-bar" style={{ position: 'relative' }}>
                <div 
                  className="score-progress-fill" 
                  style={{ width: `${fillPercent}%` }}
                ></div>
                {/* Threshold marker hidden — threshold can exceed totalPossible */}
              </div>
            </div>
          </div>

          <div className="eligibility-results-right">
            <span className="breakdown-label">EVALUATION BREAKDOWN</span>
            <div className="breakdown-cards-list">
                {eligibilityResult.fieldBreakdown?.map((field, idx) => (
                  <div key={idx} className="breakdown-field-card">
                    <div className="breakdown-field-header">
                      <h4>{humanizeEnum(field.fieldName)}</h4>
                      <span className={`breakdown-tag ${field.ruleMet ? 'tag-passed' : 'tag-failed'}`}>
                        <span className="tag-dot"></span>
                        {field.scoreDescription
                          ? field.scoreDescription
                          : `${field.ruleMet ? 'Passed' : 'Failed'} (${field.pointsAwarded}/${field.pointsPossible} pts)`}
                      </span>
                    </div>
                    <div className="breakdown-field-body">
                      <div className="breakdown-req-block">
                        <span className="block-label">Requirement</span>
                        <span className="block-value">
                          {field.requirementDescription
                            ? field.requirementDescription
                            : humanizeCondition(field.operator, field.expectedValue)}
                        </span>
                      </div>
                      <div className={`breakdown-input-block ${field.ruleMet ? 'input-passed' : 'input-failed'}`}>
                        <span className="block-label">Your Input</span>
                        <span className="block-value">{field.userValue}</span>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="eligibility-error-box">
          {eligibilityError || 'No evaluation results available.'}
        </div>
      )}

      <div className="form-action-navs" style={{ marginTop: '2rem', flexWrap: 'wrap', gap: '0.9rem' }}>
        <button 
          type="button" 
          className="button button--ghost"
          onClick={onBack}
        >
          Back
        </button>

        {canProceedToDocs && (
          <button 
            type="button" 
            className="button button--primary btn-apply"
            onClick={onNext}
          >
            Go for Docs Submission
          </button>
        )}
      </div>
    </motion.div>
  )
}
