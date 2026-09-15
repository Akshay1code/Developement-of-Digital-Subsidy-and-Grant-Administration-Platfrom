import { motion } from 'framer-motion'

export default function ApplicationFormStep({
  scheme,
  formInputs,
  handleInputChange,
  handleCheckScore,
  openCancelConfirmation,
  isCheckingScore,
  eligibilityResult,
  onNext
}) {
  const getTooltipText = (input) => {
    if (input.placeholder && input.placeholder.trim() !== '') {
      return `Requirement: Enter your ${input.label}. (Example: ${input.placeholder})`;
    }
    
    const name = String(input.name || '').toUpperCase();
    if (name.includes('AGE')) return `Eligibility details: Enter your exact age in years as per your Aadhaar or official Birth Certificate.`;
    if (name.includes('INCOME')) return `Eligibility details: Provide your total annual family income in Rupees as stated in your official Income Certificate.`;
    if (name.includes('LAND')) return `Eligibility details: Enter the total land area owned by you (usually in Hectares or Acres, refer to scheme guidelines) as per official land records.`;
    if (name.includes('CASTE') || name.includes('CATEGORY')) return `Eligibility details: Select your official caste/category. You will be required to provide a valid Caste Certificate if claiming benefits under reserved categories.`;
    if (name.includes('STATE')) return `Eligibility details: Select your domicile state.`;
    if (name.includes('GENDER')) return `Eligibility details: Select your gender as per official identity documents.`;
    
    if (input.type === 'select') {
      return `Requirement: Please select the most accurate option for your ${input.label} from the dropdown menu.`;
    }
    if (input.type === 'number') {
      return `Requirement: Please enter a valid numerical value for your ${input.label}.`;
    }
    
    return `Requirement: Please provide accurate information for your ${input.label} as it may be verified against your supporting documents.`;
  };

  return (
    <motion.div 
      className="scheme-form-layout"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
    >
      <div className="form-header-bar">
        <h2>Official Application Form</h2>
        <p>Scheme: {scheme.name}</p>
      </div>

      <form onSubmit={(e) => e.preventDefault()} className="application-form">
        <div className="form-flex-columns">
          
          <div className="form-column-inputs">
            <h3>1. Scheme-Specific Information</h3>
            <p className="helper-text">
              Fill only the fields configured by the scheme administrator for this scheme.
            </p>

            <div className="scheme-dynamic-inputs">
              {(scheme.natureInputs || []).length > 0 ? (
                (scheme.natureInputs || []).map((input) => (
                  <div className="form-group" key={input.name}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>{input.label} {input.required && <span className="req">*</span>}</span>
                      <span 
                        title={getTooltipText(input)}
                        style={{ cursor: 'help', color: '#888', display: 'flex' }}
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10"></circle>
                          <line x1="12" y1="16" x2="12" y2="12"></line>
                          <line x1="12" y1="8" x2="12.01" y2="8"></line>
                        </svg>
                      </span>
                    </label>
                    {input.type === 'select' ? (
                      <select 
                        name={input.name}
                        value={formInputs[input.name] || ''}
                        onChange={handleInputChange}
                        required={input.required}
                      >
                        <option value="">-- Select option --</option>
                        {input.options.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    ) : (
                      <input 
                        type={input.type}
                        name={input.name}
                        placeholder={input.placeholder}
                        value={formInputs[input.name] || ''}
                        onChange={handleInputChange}
                        required={input.required}
                      />
                    )}
                  </div>
                ))
              ) : (
                <div className="elig-reasons-box" style={{ marginTop: 0 }}>
                  <p className="box-title">No additional fields configured</p>
                  <p className="box-tip">This scheme does not currently require any admin-defined input fields.</p>
                </div>
              )}
            </div>
          </div>

          <div className="form-column-actions">
            <div className="form-action-navs" style={{ marginTop: '1.6rem', flexWrap: 'wrap', gap: '0.9rem' }}>
              <button 
                type="button" 
                className="button button--ghost"
                onClick={openCancelConfirmation}
              >
                Cancel Application Process
              </button>

              {eligibilityResult ? (
                <>
                  <button 
                    type="button" 
                    className="button button--ghost"
                    onClick={handleCheckScore}
                    disabled={isCheckingScore}
                  >
                    {isCheckingScore ? 'Checking...' : 'Re-check Score'}
                  </button>
                  <button 
                    type="button" 
                    className="button button--primary btn-apply"
                    onClick={onNext}
                  >
                    Next
                  </button>
                </>
              ) : (
                <button 
                  type="button" 
                  className="button button--primary btn-apply"
                  onClick={handleCheckScore}
                  disabled={isCheckingScore}
                >
                  {isCheckingScore ? 'Checking Score...' : 'Check Score'}
                </button>
              )}
            </div>
          </div>

        </div>
      </form>
    </motion.div>
  )
}
