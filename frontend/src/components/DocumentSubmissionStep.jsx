import { useRef } from 'react'
import { motion } from 'framer-motion'

function UploadIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 16 12 12 8 16" />
      <line x1="12" y1="12" x2="12" y2="21" />
      <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function DocUploadCard({ doc, file, onChange }) {
  const inputRef = useRef(null)
  const hasFile = Boolean(file)

  return (
    <div className={`doc-card ${hasFile ? 'doc-card--filled' : ''}`}>
      {/* Badge: required / optional */}
      <div className={`doc-card__badge ${doc.mandatory ? 'doc-card__badge--required' : 'doc-card__badge--optional'}`}>
        {doc.mandatory ? 'Required' : 'Optional'}
      </div>

      {/* Icon + label */}
      <div className="doc-card__icon-wrap">
        {hasFile ? (
          <span className="doc-card__icon doc-card__icon--done">
            <CheckIcon />
          </span>
        ) : (
          <span className="doc-card__icon">
            <UploadIcon />
          </span>
        )}
      </div>

      <div className="doc-card__label">{doc.label}</div>

      {/* File name / status */}
      <div className={`doc-card__filename ${hasFile ? 'doc-card__filename--set' : ''}`}>
        {hasFile ? file.name : 'No file selected'}
      </div>

      {/* Hidden real input */}
      <input
        ref={inputRef}
        type="file"
        name={doc.key}
        onChange={onChange}
        style={{ display: 'none' }}
        accept="image/*,.pdf"
      />

      {/* Custom button */}
      <button
        type="button"
        className={`doc-card__btn ${hasFile ? 'doc-card__btn--replace' : ''}`}
        onClick={() => inputRef.current?.click()}
      >
        {hasFile ? 'Replace file' : 'Choose file'}
      </button>
    </div>
  )
}

export default function DocumentSubmissionStep({
  requiredDocuments,
  docsFiles,
  handleDocFileChange,
  handleSubmitDocuments,
  isSubmittingDocs,
  onBack,
  docsError,
  openCancelConfirmation,
  canProceedToDocs
}) {
  const uploadedCount = requiredDocuments.filter(d => docsFiles[d.key]).length
  const requiredCount = requiredDocuments.filter(d => d.mandatory).length
  const requiredUploaded = requiredDocuments.filter(d => d.mandatory && docsFiles[d.key]).length
  const allRequiredDone = requiredUploaded === requiredCount

  return (
    <motion.div
      className="scheme-form-layout docs-submission-panel"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      style={{ marginTop: '0' }}
    >
      {/* Header */}
      <div className="docs-submission-panel__header">
        <div>
          <p className="console-eyebrow">Document submission</p>
          <h3>Supporting Documents</h3>
        </div>
        <span className="console-endpoint">Unlocked after eligibility check</span>
      </div>

      {/* Info line */}
      <p className="eligibility-console__copy">
        You have been found eligible for this scheme. Please upload the supporting documents required to complete your application.
      </p>

      {/* Progress indicator */}
      <div className="docs-progress">
        <div className="docs-progress__bar">
          <div
            className="docs-progress__fill"
            style={{ width: `${requiredCount > 0 ? (requiredUploaded / requiredCount) * 100 : 0}%` }}
          />
        </div>
        <span className="docs-progress__label">
          {requiredUploaded} / {requiredCount} required documents uploaded
        </span>
      </div>

      {/* Cards grid */}
      <div className="docs-grid">
        {requiredDocuments.map((doc) => (
          <DocUploadCard
            key={doc.key}
            doc={doc}
            file={docsFiles[doc.key] || null}
            onChange={handleDocFileChange}
          />
        ))}
      </div>

      {/* Error */}
      {docsError && (
        <div className="eligibility-error-box" style={{ marginTop: '1.25rem' }}>
          {docsError}
        </div>
      )}

      {/* Action bar */}
      <div className="form-action-navs" style={{ marginTop: '1.5rem', flexWrap: 'wrap', gap: '0.9rem' }}>
        <button
          type="button"
          className="button button--ghost"
          onClick={openCancelConfirmation}
        >
          Cancel Application
        </button>

        <button
          type="button"
          className="button button--ghost"
          onClick={onBack}
        >
          Back
        </button>

        <button
          type="button"
          className="button button--primary btn-apply"
          onClick={handleSubmitDocuments}
          disabled={!canProceedToDocs || isSubmittingDocs || !allRequiredDone}
        >
          {isSubmittingDocs ? 'Submitting…' : 'Submit Documents'}
        </button>
      </div>
    </motion.div>
  )
}
