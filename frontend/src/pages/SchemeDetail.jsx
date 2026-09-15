import '../styles/SchemeDetail.css';
import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { getSchemes } from '../services/schemeService'
import { getApplications, submitApplicationBySchemeCode, cancelApplicationById, uploadApplicationDocuments } from '../services/applicationService'
import { runEligibilityEngine } from '../services/eligibilityService'
import api from '../services/api'
import ApplicationFormStep from '../components/ApplicationFormStep'
import EligibilityResultsStep from '../components/EligibilityResultsStep'
import DocumentSubmissionStep from '../components/DocumentSubmissionStep'

function normalizeRuleField(fieldName) {
  return String(fieldName || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
}

function getProfileSeedValue(profile, fieldName) {
  switch (normalizeRuleField(fieldName)) {
    case 'AGE':
      return profile?.age ?? profile?.dobAge ?? profile?.yearsOld ?? ''
    case 'INCOME':
      return profile?.annualIncome ?? profile?.monthlyIncome ?? ''
    case 'CGPA':
      return profile?.cgpa ?? profile?.educationScore ?? profile?.marksPercentage ?? ''
    case 'CASTE':
      return profile?.caste || profile?.category || ''
    case 'STATE':
      return profile?.state || ''
    case 'GENDER':
      return profile?.gender || ''
    default:
      return profile?.[String(fieldName || '').toLowerCase()] || ''
  }
}

function getApplicationStatus(application) {
  return String(application?.applicationStatus || application?.status || '').toUpperCase()
}

function isDraftStatus(status) {
  return status === 'DRAFT' || status === 'PENDING'
}

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

function getDocumentDefinitions(scheme) {
  const configuredDocuments = Array.isArray(scheme?.documents) ? scheme.documents : []

  if (configuredDocuments.length === 0) {
    return [
      { key: 'AADHAAR', documentType: 'AADHAAR', label: 'Identity proof', hint: 'Aadhaar, voter ID, or equivalent', mandatory: true },
      { key: 'INCOME_CERTIFICATE', documentType: 'INCOME_CERTIFICATE', label: 'Income proof', hint: 'Certificate or salary slip', mandatory: true },
      { key: 'LAND_RECORD', documentType: 'LAND_RECORD', label: 'Supporting document', hint: 'Land record, category proof, or scheme-specific file', mandatory: true },
    ]
  }

  return configuredDocuments.map((doc, index) => {
    const documentType = String(doc.documentType || `DOCUMENT_${index + 1}`).trim().toUpperCase()
    return {
      key: documentType,
      documentType,
      label: humanizeEnum(documentType),
      hint: doc.mandatory === false ? 'Optional document' : 'Required document',
      mandatory: doc.mandatory !== false,
    }
  })
}

export default function SchemeDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [schemes, setSchemes] = useState([])
  const [loadingSchemes, setLoadingSchemes] = useState(true)
  const scheme = schemes.find(s => s.schemeCode === id)
  const [profile, setProfile] = useState(null)
  const [applications, setApplications] = useState([])
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [loadingApplications, setLoadingApplications] = useState(true)
  
  // UI views: 'detail' | 'apply' | 'success'
  const [viewState, setViewState] = useState('detail')
  const [wizardStep, setWizardStep] = useState(1)
  
  // Terms agreement state
  const [agreed, setAgreed] = useState(false)
  
  // Application Form Inputs
  const [formInputs, setFormInputs] = useState({})
  const [eligibilityResult, setEligibilityResult] = useState(null)
  const [eligibilityError, setEligibilityError] = useState('')
  const [isCheckingScore, setIsCheckingScore] = useState(false)
  const [docsError, setDocsError] = useState('')
  const [isSubmittingDocs, setIsSubmittingDocs] = useState(false)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [docsFiles, setDocsFiles] = useState({})

  useEffect(() => {
    async function loadSchemes() {
      try {
        setLoadingSchemes(true)
        const data = await getSchemes()
        setSchemes(Array.isArray(data) ? data : [])
      } catch (error) {
        console.error('Failed to load schemes:', error.message)
        setSchemes([])
      } finally {
        setLoadingSchemes(false)
      }
    }
    loadSchemes()
  }, [])

  useEffect(() => {
    async function loadProfile() {
      try {
        setLoadingProfile(true)
        const res = await api.get('/gov/auth/profile/get')
        const profileData = res.data?.data || res.data || null
        setProfile(profileData)
      } catch {
        setProfile(null)
      } finally {
        setLoadingProfile(false)
      }
    }
    loadProfile()
  }, [])

  useEffect(() => {
    async function loadApplications() {
      try {
        setLoadingApplications(true)
        const data = await getApplications()
        const list = Array.isArray(data) ? data : data?.data || []
        setApplications(list)
      } catch {
        setApplications([])
      } finally {
        setLoadingApplications(false)
      }
    }
    loadApplications()
  }, [])

  const refreshApplications = async () => {
    try {
      setLoadingApplications(true)
      const data = await getApplications()
      const list = Array.isArray(data) ? data : data?.data || []
      setApplications(list)
      return list
    } catch {
      setApplications([])
      return []
    } finally {
      setLoadingApplications(false)
    }
  }

  useEffect(() => {
    if (!scheme?.natureInputs?.length) return
    const initial = {}
    
    // First, try to seed from user's profile
    scheme.natureInputs.forEach(input => {
      initial[input.name] = getProfileSeedValue(profile, input.name)
    })

    // Then, override with any previously saved draft/application data
    const existingApp = applications.find(app => {
      const appSchemeCode = app?.schemeCode || app?.schemeId || app?.scheme?.schemeCode
      return appSchemeCode === scheme.schemeCode
    })
    
    if (existingApp && existingApp.fields) {
      Object.entries(existingApp.fields).forEach(([key, value]) => {
        const match = scheme.natureInputs.find(i => String(i.name).toUpperCase() === String(key).toUpperCase())
        if (match) {
          initial[match.name] = value
        } else {
          initial[String(key).toLowerCase()] = value
        }
      })
    }

    setFormInputs(initial)
  }, [scheme?.schemeCode, profile, applications])

  useEffect(() => {
    if (viewState !== 'success') return

    const redirectTimer = setTimeout(() => {
      navigate('/dashboard', { replace: true })
    }, 1800)

    return () => clearTimeout(redirectTimer)
  }, [navigate, viewState])

  if (loadingSchemes || loadingProfile) return null
  if (!scheme) return null

  const requiredDocuments = getDocumentDefinitions(scheme)

  const matchingApplication = applications.find(app => {
    const appSchemeCode = app?.schemeCode || app?.schemeId || app?.scheme?.schemeCode
    return appSchemeCode === scheme.schemeCode
  })
  const currentApplicationStatus = getApplicationStatus(matchingApplication)
  const isDraftApplication = matchingApplication ? isDraftStatus(currentApplicationStatus) : false
  const hasProfile = !!profile
  const eligibilityPayload = {
    schemeCode: scheme.schemeCode,
    fields: Object.entries(formInputs)
      .filter(([, value]) => value !== '' && value !== null && value !== undefined)
      .map(([fieldName, value]) => ({
        fieldName: normalizeRuleField(fieldName),
        value: String(value),
      })),
  }
  const eligibilityScore = eligibilityResult?.score ?? 0
  const eligibilityTotalPossible = eligibilityResult?.totalPossibleScore ?? 0
  const eligibilityThreshold = Number(scheme.minimumEligibleScore || 0)
  const eligibilityGap = eligibilityScore - eligibilityThreshold
  const eligibilityState = !eligibilityResult
    ? 'idle'
    : eligibilityResult.status
      ? 'pass'
      : 'fail'
  const scoreRingProgress = eligibilityTotalPossible > 0
      ? Math.max(0, Math.min(100, Math.round((eligibilityScore / eligibilityTotalPossible) * 100)))
      : eligibilityThreshold > 0
        ? Math.max(0, Math.min(100, Math.round((eligibilityScore / eligibilityThreshold) * 100)))
        : 0
  // canProceedToDocs relies purely on the backend-set status flag
  const canProceedToDocs = Boolean(eligibilityResult && eligibilityResult.status)
  const hasInitiatedScoring = Boolean(eligibilityResult || eligibilityError || isCheckingScore)

  // Handle Form Change
  const handleInputChange = (e) => {
    setFormInputs(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setEligibilityResult(null)
  }

  const handleCheckScore = async () => {
    if (!scheme?.rules?.length) {
      setEligibilityError('No eligibility rules are configured for this scheme yet.')
      setEligibilityResult(null)
      return
    }

    setIsCheckingScore(true)
    setEligibilityError('')
    setEligibilityResult(null)
    setViewState('apply')

    try {
      const response = await runEligibilityEngine(eligibilityPayload)
      setEligibilityResult(response)
      await refreshApplications()
      setWizardStep(2)
    } catch (error) {
      console.error('Failed to check score:', error.message)
      setEligibilityError(error.message || 'Eligibility engine request failed.')
    } finally {
      setIsCheckingScore(false)
    }
  }

  const handleGoForDocsSubmission = () => {
    if (!canProceedToDocs) return
    setDocsError('')
    setWizardStep(3)
  }

  const handleCancelApplicationProcess = async () => {
    try {
      const applicationId = matchingApplication?.id || matchingApplication?.applicationId
      if (applicationId) {
        await cancelApplicationById(applicationId)
      }
      setDocsFiles({})
      setEligibilityResult(null)
      setEligibilityError('')
      setDocsError('')
      setAgreed(false)
      setShowCancelConfirm(false)
      setViewState('detail')
      setWizardStep(1)
      navigate('/dashboard', { replace: true })
    } catch (error) {
      setDocsError(error.message || 'Failed to cancel the application process.')
    }
  }

  const handleDocFileChange = (e) => {
    const { name, files } = e.target
    setDocsFiles(prev => ({ ...prev, [name]: files?.[0] || null }))
  }

  const handleSubmitDocuments = async () => {
    if (!canProceedToDocs) return

    const missingDocs = requiredDocuments.filter(doc => doc.mandatory && !docsFiles[doc.key])

    if (missingDocs.length > 0) {
      setDocsError(`Please upload all required documents before submitting: ${missingDocs.map(doc => doc.label).join(', ')}.`)
      return
    }

    setDocsError('')
    setIsSubmittingDocs(true)

    try {
      const selectedDocs = requiredDocuments
        .map(doc => ({ ...doc, file: docsFiles[doc.key] }))
        .filter(doc => doc.file)

      if (selectedDocs.length > 0) {
        await uploadApplicationDocuments(
          scheme.schemeCode,
          selectedDocs.map(doc => doc.file),
          selectedDocs.map(doc => doc.documentType)
        )
      }

      await submitApplicationBySchemeCode(scheme.schemeCode)
      await refreshApplications()
      setViewState('success')
      setDocsFiles({})
    } catch (error) {
      setDocsError(error.message || 'Failed to upload documents and submit the application.')
    } finally {
      setIsSubmittingDocs(false)
    }
  }

  const openCancelConfirmation = () => {
    setShowCancelConfirm(true)
    setDocsError('')
  }

  return (
    <div className="scheme-detail-layout">
      {/* Sticky Header */}
      <header className="topbar">
        <div className="topbar__brand">
          <Link to="/dashboard" className="brand-back-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            Back to Dashboard
          </Link>
        </div>

        <div className="topbar__user-info">
          <span className="user-badge">
            <span className="user-badge__dot"></span>
            {profile?.fullName || 'Beneficiary'}
          </span>
        </div>
      </header>

      <main className="scheme-main">
        {viewState === 'detail' ? (
          /* ========================================= */
          /* VIEW 1: SCHEME DETAILS & TERMS AGREEMENT  */
          /* ========================================= */
          <motion.div 
            className="scheme-grid-detail"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {/* Left side details */}
            <div className="scheme-info-panel">
              <span className={`scheme-card__category category--${String(scheme.category || '').toLowerCase()}`}>
                {scheme.category}
              </span>
              
              <h1 className="scheme-title">{scheme.name}</h1>
              <p className="scheme-desc-long">{scheme.description}</p>

              {scheme.benefit !== null && scheme.benefit !== undefined && scheme.benefit !== '' && (
                <div className="scheme-benefit-block">
                  <h3 className="section-subtitle-detail">Benefit Amount</h3>
                  <p className="scheme-desc-long">₹{Number(scheme.benefit).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
              )}

              {/* Dynamic Nature-specific info details */}
              <h3 className="section-subtitle-detail">Scheme Specific Specifications</h3>
              <div className="nature-detail-grid">
                {(scheme.natureDetails || []).map((det, index) => (
                  <div className="nature-detail-card" key={index}>
                    <span className="nature-detail-label">{det.label}</span>
                    <span className="nature-detail-val">{det.value}</span>
                  </div>
                ))}
              </div>

              <div className="detail-section-block">
                <h3>Eligibility Requirements</h3>
                {(!scheme.rules || scheme.rules.length === 0) ? (
                  <p className="eligibility-desc">No specific eligibility rules configured for this scheme.</p>
                ) : (
                  <ul className="eligibility-desc" style={{ listStyle: 'none', paddingLeft: 0 }}>
                    {scheme.rules.map((rule, idx) => (
                      <li key={idx} style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '8px',
                        marginBottom: '8px',
                        padding: '8px 12px',
                        backgroundColor: '#f8fafc',
                        borderRadius: '6px',
                        border: '1px solid #e2e8f0'
                      }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                        <span style={{ fontWeight: 500, color: '#334155' }}>
                          {humanizeEnum(rule.fieldName)}
                        </span> 
                        <span style={{ color: '#64748b' }}>
                          {humanizeCondition(rule.operator, rule.expectedValue).toLowerCase()}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="eligibility-status-large" style={{ marginTop: '16px' }}>
                  <span className="elig-label">Review Mode:</span>
                  <span className="badge-status-large status-applied">Details only, no profile check on this page</span>
                </div>

                <div className="elig-reasons-box">
                  <p className="box-title">What happens next:</p>
                  <ul>
                    <li>You can read the scheme details and rules without any age or profile validation here.</li>
                    <li>Application-specific checks, if any, happen only when you submit the form.</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Right side interactive application gateway */}
            <div className="scheme-action-panel">
              <div className="gate-card">
                <h3>Application Gateway</h3>
                
                {loadingApplications ? (
                  <div className="ineligible-gateway-info">
                    <p>Checking application status...</p>
                  </div>
                ) : hasProfile && matchingApplication ? (
                  <div className="applied-gateway-info">
                    <p>
                      {isDraftApplication
                        ? 'You have a saved draft application for this subsidy scheme.'
                        : 'You have already submitted an application for this subsidy scheme.'}
                    </p>
                    <div className="action-row">
                      <span className="label">Current Status:</span>
                      <span className={`val badge-status--${String(currentApplicationStatus || 'draft').toLowerCase()}`}>
                        {currentApplicationStatus || 'DRAFT'}
                      </span>
                    </div>

                    {isDraftApplication ? (
                      <button
                        type="button"
                        className="button button--primary btn-apply"
                        onClick={() => setViewState('apply')}
                        style={{ width: '100%', marginTop: '0.8rem' }}
                      >
                        Continue Application
                      </button>
                    ) : (
                      <Link to="/dashboard" className="button button--ghost" style={{ width: '100%', marginTop: '0.8rem', textAlign: 'center' }}>
                        Track Application
                      </Link>
                    )}
                  </div>
                ) : !hasProfile ? (
                  <div className="ineligible-gateway-info">
                    <p>You can view the scheme details right now.</p>
                    <p className="advice">Sign in to continue with the application flow.</p>
                  </div>
                ) : (
                  <div className="terms-agreement-gate">
                    <p className="notice">To apply, please review and accept the official government terms and conditions below.</p>
                    
                    {/* Terms Scroll Area */}
                    <div className="terms-scroll-area">
                      <h4>Subsidy Sanction Agreement (Form-4A)</h4>
                      <p>1. <strong>Direct Benefit Transfer (DBT)</strong>: I understand that funds under this program are disbursed exclusively through Aadhaar Enabled Payment Systems (AEPS) linked directly to the bank account specified in my profile.</p>
                      <p>2. <strong>Verification Right</strong>: I authorize the Ministry of Finance and Agriculture to cross-reference my Aadhaar identity card and land records registry to audit eligibility parameters.</p>
                      <p>3. <strong>Field Inspection Approval</strong>: I agree to facilitate inspection of assets (e.g., cultivable land, building site) by designated government field officers upon request.</p>
                      <p>4. <strong>Falsification Penalty</strong>: I declare that all information submitted is accurate. Falsification of documents will result in cancellation of status and recovery of disbursed amounts under the Civil Penalties Act.</p>
                    </div>

                    <label className="terms-checkbox-wrap">
                      <input 
                        type="checkbox" 
                        checked={agreed}
                        onChange={(e) => setAgreed(e.target.checked)}
                      />
                      <span>I agree to the terms, conditions, and DBT auditing regulations.</span>
                    </label>

                    {hasProfile && (
                      <button 
                        onClick={() => setViewState('apply')}
                        disabled={!agreed}
                        className="button button--primary btn-apply"
                        style={{ width: '100%', marginTop: '1rem' }}
                      >
                        Proceed towards Application Form
                      </button>
                    )}
                  </div>
                )}
              </div>

            </div>
          </motion.div>
        ) : hasProfile ? (
          /* ========================================= */
          /* VIEW 2: DETAILED QUALITY PHOTO FORM       */
          /* ========================================= */
          <div className="wizard-container">
            {/* Step progress indicator */}
            <div className="wizard-stepper">
              {[
                { step: 1, label: 'Application Form' },
                { step: 2, label: 'Eligibility Check' },
                { step: 3, label: 'Documents' },
              ].map(({ step, label }, i) => (
                <div key={step} className="wizard-stepper__item">
                  <div className={`wizard-stepper__circle ${wizardStep === step ? 'is-active' : wizardStep > step ? 'is-done' : ''}`}>
                    {wizardStep > step ? '✓' : step}
                  </div>
                  <span className={`wizard-stepper__label ${wizardStep === step ? 'is-active' : ''}`}>{label}</span>
                  {i < 2 && <div className={`wizard-stepper__line ${wizardStep > step ? 'is-done' : ''}`} />}
                </div>
              ))}
            </div>
            <AnimatePresence mode="wait">
              {wizardStep === 1 && (
                <ApplicationFormStep
                  key="step1"
                  scheme={scheme}
                  formInputs={formInputs}
                  handleInputChange={handleInputChange}
                  handleCheckScore={handleCheckScore}
                  openCancelConfirmation={openCancelConfirmation}
                  isCheckingScore={isCheckingScore}
                  eligibilityResult={eligibilityResult}
                  onNext={() => setWizardStep(2)}
                />
              )}
              {wizardStep === 2 && (
                <EligibilityResultsStep
                  key="step2"
                  eligibilityResult={eligibilityResult}
                  eligibilityError={eligibilityError}
                  eligibilityScore={eligibilityScore}
                  eligibilityThreshold={eligibilityThreshold}
                  eligibilityTotalPossible={eligibilityTotalPossible}
                  onBack={() => setWizardStep(1)}
                  onNext={handleGoForDocsSubmission}
                  canProceedToDocs={canProceedToDocs}
                />
              )}
              {wizardStep === 3 && (
                <DocumentSubmissionStep
                  key="step3"
                  requiredDocuments={requiredDocuments}
                  docsFiles={docsFiles}
                  handleDocFileChange={handleDocFileChange}
                  handleSubmitDocuments={handleSubmitDocuments}
                  isSubmittingDocs={isSubmittingDocs}
                  onBack={() => setWizardStep(2)}
                  docsError={docsError}
                  openCancelConfirmation={openCancelConfirmation}
                  canProceedToDocs={canProceedToDocs}
                />
              )}
            </AnimatePresence>
            {viewState === 'success' && (
              <motion.div
                className="scheme-form-layout docs-submission-panel"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="docs-submission-panel__header">
                  <div>
                    <p className="console-eyebrow">Application submitted</p>
                    <h3>Application submitted successfully</h3>
                  </div>
                  <span className="console-endpoint">Redirecting to dashboard</span>
                </div>

                <p className="eligibility-console__copy">
                  Your supporting documents have been recorded. You will be returned to the Dashboard shortly.
                </p>
              </motion.div>
            )}

            {showCancelConfirm && (
              <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="cancel-application-title">
                <motion.div
                  className="modal-panel modal-panel--danger"
                  initial={{ opacity: 0, scale: 0.96, y: 8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                >
                  <h3 id="cancel-application-title">Cancel application process?</h3>
                  <p className="danger-text">
                    If you continue, we will delete the saved application record, generated application code, form fields, and uploaded documents from the database.
                  </p>

                  <div className="modal-actions">
                    <button
                      type="button"
                      className="button button--ghost"
                      onClick={() => setShowCancelConfirm(false)}
                    >
                      Keep Application
                    </button>
                    <button
                      type="button"
                      className="btn-danger-confirm"
                      onClick={handleCancelApplicationProcess}
                    >
                      Yes, Cancel and Delete
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </div>
        ) : null}
      </main>
    </div>
  )
}
