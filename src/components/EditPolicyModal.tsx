'use client';

import React, { useState, useEffect } from 'react';
import { Client, Policy, PolicyType } from '@/lib/types';
import { CustomDateInput } from './CustomDateInput';
import { X, Calendar, Shield, Car, Home, Building2, Save } from 'lucide-react';
import { addMonths, format, parseISO, isValid } from 'date-fns';

interface EditPolicyModalProps {
  isOpen: boolean;
  client: Client | null;
  policy: Policy | null;
  onClose: () => void;
  onSave: (policyId: string, updatedData: Partial<Policy>) => Promise<boolean>;
}

export function EditPolicyModal({
  isOpen,
  client,
  policy,
  onClose,
  onSave
}: EditPolicyModalProps) {
  const [policyType, setPolicyType] = useState<PolicyType>('auto');
  const [policyNumber, setPolicyNumber] = useState('');
  const [plateNumber, setPlateNumber] = useState('');
  const [vehicleMakeModel, setVehicleMakeModel] = useState('');
  const [propertyAddress, setPropertyAddress] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [termStartDate, setTermStartDate] = useState('');
  const [renewalDate, setRenewalDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [notes, setNotes] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (policy && isOpen) {
      setPolicyType(policy.policyType);
      setPolicyNumber(policy.policyNumber || '');
      setPlateNumber(policy.plateNumber || '');
      setVehicleMakeModel(policy.vehicleMakeModel || '');
      setPropertyAddress(policy.propertyAddress || '');
      setPropertyType(policy.propertyType || '');
      setBusinessName(policy.businessName || '');
      setBusinessType(policy.businessType || '');
      setTermStartDate(policy.termStartDate || '');
      setRenewalDate(policy.renewalDate || '');
      setExpiryDate(policy.expiryDate || '');
      setNotes(policy.notes || '');
      setErrors({});
    }
  }, [policy, isOpen]);

  if (!isOpen || !client || !policy) return null;

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (policyType === 'auto' && !plateNumber.trim()) {
      errs.plateNumber = 'Plate number is required for Auto policy';
    }
    if (policyType === 'home' && !propertyAddress.trim()) {
      errs.propertyAddress = 'Property address is required for Home policy';
    }
    if (policyType === 'commercial' && !businessName.trim()) {
      errs.businessName = 'Business name is required for Commercial policy';
    }

    if (!termStartDate) errs.termStartDate = 'Term start date is required';
    if (!renewalDate) errs.renewalDate = 'Renewal target date is required';
    if (!expiryDate) {
      errs.expiryDate = 'Expiry date is required';
    } else if (termStartDate && expiryDate <= termStartDate) {
      errs.expiryDate = 'Expiry date must be after term start date';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    const success = await onSave(policy.id, {
      policyType,
      policyNumber: policyNumber.trim() || undefined,
      plateNumber: plateNumber.trim().toUpperCase() || undefined,
      vehicleMakeModel: vehicleMakeModel.trim() || undefined,
      propertyAddress: propertyAddress.trim() || undefined,
      propertyType: propertyType.trim() || undefined,
      businessName: businessName.trim() || undefined,
      businessType: businessType.trim() || undefined,
      termStartDate,
      renewalDate,
      expiryDate,
      notes: notes.trim() || undefined
    });

    setIsSubmitting(false);
    if (success) {
      onClose();
    }
  };

  const handleQuickPreset = (months: number) => {
    try {
      const baseStart = termStartDate ? parseISO(termStartDate) : new Date();
      const validStart = isValid(baseStart) ? baseStart : new Date();
      const formattedStart = format(validStart, 'yyyy-MM-dd');
      setTermStartDate(formattedStart);

      const targetDate = addMonths(validStart, months);
      const renewalTarget = addMonths(targetDate, -1);

      setRenewalDate(format(renewalTarget, 'yyyy-MM-dd'));
      setExpiryDate(format(targetDate, 'yyyy-MM-dd'));
    } catch (e) {
      console.error('Error applying date preset', e);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content scale-in"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '640px', width: '92vw' }}
      >
        {/* Modal Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Shield size={20} style={{ color: 'var(--brand-primary)' }} />
              Edit Policy Details
            </h2>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
              Updating policy for <strong style={{ color: 'var(--text-primary)' }}>{client.firstName} {client.lastName}</strong>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary btn-icon"
            style={{ borderRadius: 'var(--radius-full)', padding: '0.45rem' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Policy Type Badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Policy Product:</span>
              <span className="badge badge-active" style={{ textTransform: 'uppercase', fontWeight: 700, fontSize: '0.75rem' }}>
                {policyType === 'auto' && <Car size={13} style={{ marginRight: '0.25rem' }} />}
                {policyType === 'home' && <Home size={13} style={{ marginRight: '0.25rem' }} />}
                {policyType === 'commercial' && <Building2 size={13} style={{ marginRight: '0.25rem' }} />}
                {policyType} Insurance
              </span>
            </div>

            {/* Auto Specific Fields */}
            {policyType === 'auto' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                    Plate # <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={plateNumber}
                    onChange={(e) => setPlateNumber(e.target.value.toUpperCase())}
                    placeholder="e.g. A374NB"
                    style={{
                      width: '100%',
                      padding: '0.55rem 0.75rem',
                      borderRadius: 'var(--radius-md)',
                      border: errors.plateNumber ? '1px solid #ef4444' : '1px solid var(--border-strong)',
                      background: 'var(--bg-input)',
                      fontFamily: 'JetBrains Mono, monospace',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      outline: 'none'
                    }}
                  />
                  {errors.plateNumber && <span style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '0.2rem', display: 'block' }}>{errors.plateNumber}</span>}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                    Vehicle Make & Model
                  </label>
                  <input
                    type="text"
                    value={vehicleMakeModel}
                    onChange={(e) => setVehicleMakeModel(e.target.value)}
                    placeholder="e.g. 2008 Lexus RX350"
                    style={{
                      width: '100%',
                      padding: '0.55rem 0.75rem',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-strong)',
                      background: 'var(--bg-input)',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>
            )}

            {/* Home Specific Fields */}
            {policyType === 'home' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                    Property Address <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={propertyAddress}
                    onChange={(e) => setPropertyAddress(e.target.value)}
                    placeholder="e.g. 742 Evergreen Terrace"
                    style={{
                      width: '100%',
                      padding: '0.55rem 0.75rem',
                      borderRadius: 'var(--radius-md)',
                      border: errors.propertyAddress ? '1px solid #ef4444' : '1px solid var(--border-strong)',
                      background: 'var(--bg-input)',
                      outline: 'none'
                    }}
                  />
                  {errors.propertyAddress && <span style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '0.2rem', display: 'block' }}>{errors.propertyAddress}</span>}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                    Property Type
                  </label>
                  <input
                    type="text"
                    value={propertyType}
                    onChange={(e) => setPropertyType(e.target.value)}
                    placeholder="Single Family / Condo"
                    style={{
                      width: '100%',
                      padding: '0.55rem 0.75rem',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-strong)',
                      background: 'var(--bg-input)',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>
            )}

            {/* Commercial Specific Fields */}
            {policyType === 'commercial' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                    Business Name <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="e.g. Acme Contracting LLC"
                    style={{
                      width: '100%',
                      padding: '0.55rem 0.75rem',
                      borderRadius: 'var(--radius-md)',
                      border: errors.businessName ? '1px solid #ef4444' : '1px solid var(--border-strong)',
                      background: 'var(--bg-input)',
                      outline: 'none'
                    }}
                  />
                  {errors.businessName && <span style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '0.2rem', display: 'block' }}>{errors.businessName}</span>}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                    Business / Coverage Type
                  </label>
                  <input
                    type="text"
                    value={businessType}
                    onChange={(e) => setBusinessType(e.target.value)}
                    placeholder="General Liability / BOP"
                    style={{
                      width: '100%',
                      padding: '0.55rem 0.75rem',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-strong)',
                      background: 'var(--bg-input)',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>
            )}

            {/* Optional Policy Reference Number */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                Policy Number <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(Optional)</span>
              </label>
              <input
                type="text"
                value={policyNumber}
                onChange={(e) => setPolicyNumber(e.target.value)}
                placeholder="Optional policy reference #"
                style={{
                  width: '100%',
                  padding: '0.55rem 0.75rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-strong)',
                  background: 'var(--bg-input)',
                  fontFamily: 'JetBrains Mono, monospace',
                  outline: 'none'
                }}
              />
            </div>

            {/* Term Dates Card + Quick Presets */}
            <div style={{
              background: 'var(--bg-surface-subtle)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '1rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.8125rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Calendar size={14} style={{ color: 'var(--brand-primary)' }} />
                  Policy Term & Renewal Dates
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginRight: '0.2rem' }}>Quick preset:</span>
                  <button type="button" onClick={() => handleQuickPreset(3)} className="btn btn-sm btn-secondary" style={{ padding: '0.15rem 0.4rem', fontSize: '0.6875rem' }}>+3m</button>
                  <button type="button" onClick={() => handleQuickPreset(6)} className="btn btn-sm btn-secondary" style={{ padding: '0.15rem 0.4rem', fontSize: '0.6875rem' }}>+6m</button>
                  <button type="button" onClick={() => handleQuickPreset(12)} className="btn btn-sm btn-secondary" style={{ padding: '0.15rem 0.4rem', fontSize: '0.6875rem' }}>+12m</button>
                </div>
              </div>

              {/* 3 Custom Date Inputs in 3 Columns */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                    Term Start <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <CustomDateInput
                    value={termStartDate}
                    onChange={setTermStartDate}
                    error={errors.termStartDate}
                  />
                  {errors.termStartDate && <span style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '0.2rem', display: 'block' }}>{errors.termStartDate}</span>}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                    Renewal Target <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <CustomDateInput
                    value={renewalDate}
                    onChange={setRenewalDate}
                    error={errors.renewalDate}
                  />
                  {errors.renewalDate && <span style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '0.2rem', display: 'block' }}>{errors.renewalDate}</span>}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                    Expiry Date <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <CustomDateInput
                    value={expiryDate}
                    onChange={setExpiryDate}
                    error={errors.expiryDate}
                  />
                  {errors.expiryDate && <span style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '0.2rem', display: 'block' }}>{errors.expiryDate}</span>}
                </div>
              </div>
            </div>

            {/* Policy Notes */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                Policy Notes <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(Optional)</span>
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Endorsements, discounts, special coverage instructions..."
                rows={3}
                style={{
                  width: '100%',
                  padding: '0.55rem 0.75rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-strong)',
                  background: 'var(--bg-input)',
                  outline: 'none',
                  resize: 'vertical',
                  fontFamily: 'inherit',
                  fontSize: '0.875rem'
                }}
              />
            </div>
          </div>

          {/* Form Actions */}
          <div style={{
            marginTop: '1.5rem',
            paddingTop: '1.25rem',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '0.75rem'
          }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <Save size={16} />
              <span>{isSubmitting ? 'Saving Changes...' : 'Save Policy Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
