'use client';

import React, { useState, useEffect } from 'react';
import { Client, PolicyType, PolicyCreatePayload } from '@/lib/types';
import { X, Car, Home, Building2 } from 'lucide-react';
import { format, addMonths, subDays } from 'date-fns';
import { CustomDateInput } from './CustomDateInput';

interface AddPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client | null;
  onSavePolicy: (payload: PolicyCreatePayload) => Promise<boolean>;
}

export function AddPolicyModal({
  isOpen,
  onClose,
  client,
  onSavePolicy
}: AddPolicyModalProps) {
  const [policyType, setPolicyType] = useState<PolicyType>('auto');
  const [policyNumber, setPolicyNumber] = useState('');

  // Auto fields
  const [plateNumber, setPlateNumber] = useState('');
  const [vehicleMakeModel, setVehicleMakeModel] = useState('');

  // Home fields
  const [propertyAddress, setPropertyAddress] = useState('');
  const [propertyType, setPropertyType] = useState('Single Family Home');

  // Commercial fields
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('General Liability');

  // Dates
  const [termStartDate, setTermStartDate] = useState('');
  const [renewalDate, setRenewalDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [notes, setNotes] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPolicyType('auto');
      setPolicyNumber('');
      setPlateNumber('');
      setVehicleMakeModel('');
      setPropertyAddress('');
      setPropertyType('Single Family Home');
      setBusinessName('');
      setBusinessType('General Liability');
      setTermStartDate('');
      setRenewalDate('');
      setExpiryDate('');
      setNotes('');
      setErrors({});
    }
  }, [isOpen]);

  if (!isOpen || !client) return null;

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (policyType === 'auto' && !plateNumber.trim()) {
      errs.plateNumber = 'License plate number is required for Auto insurance';
    }

    if (policyType === 'home' && !propertyAddress.trim()) {
      errs.propertyAddress = 'Property address is required for Home insurance';
    }

    if (policyType === 'commercial' && !businessName.trim()) {
      errs.businessName = 'Business entity name is required for Commercial insurance';
    }

    if (!termStartDate) errs.termStartDate = 'Term start date is required';
    if (!renewalDate) errs.renewalDate = 'Renewal date is required';

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
    const success = await onSavePolicy({
      clientId: client.id,
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

  const handleQuickDuration = (months: number) => {
    try {
      const baseStart = termStartDate ? new Date(termStartDate) : new Date();
      if (!termStartDate) {
        setTermStartDate(format(baseStart, 'yyyy-MM-dd'));
      }
      const newExpiry = addMonths(baseStart, months);
      const newRenewal = subDays(newExpiry, 30);
      setExpiryDate(format(newExpiry, 'yyyy-MM-dd'));
      setRenewalDate(format(newRenewal, 'yyyy-MM-dd'));
    } catch (e) {
      // ignore
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '600px' }}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1.25rem 1.75rem',
          borderBottom: '1px solid var(--border-subtle)',
          background: 'var(--bg-surface)'
        }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Add Insurance Policy</h2>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              Attaching new policy to: <strong style={{ color: 'var(--text-primary)' }}>{client.firstName} {client.lastName}</strong>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-ghost btn-icon"
            style={{ borderRadius: 'var(--radius-full)' }}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '1.5rem 1.75rem' }}>
          {/* Policy Type Selector */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              Select Insurance Product Type
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.625rem' }}>
              {[
                { id: 'auto' as PolicyType, label: 'Auto Insurance', icon: Car, desc: 'Vehicle & Plate' },
                { id: 'home' as PolicyType, label: 'Home Policy', icon: Home, desc: 'Residence / Property' },
                { id: 'commercial' as PolicyType, label: 'Commercial Policy', icon: Building2, desc: 'Business & Liability' }
              ].map(item => {
                const active = policyType === item.id;
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setPolicyType(item.id)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      padding: '0.75rem 0.5rem',
                      borderRadius: 'var(--radius-md)',
                      border: active ? '2px solid var(--brand-primary)' : '1px solid var(--border-strong)',
                      background: active ? 'rgba(59, 130, 246, 0.08)' : 'var(--bg-surface)',
                      color: active ? 'var(--brand-primary)' : 'var(--text-primary)',
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all var(--transition-fast)'
                    }}
                  >
                    <Icon size={20} style={{ marginBottom: '0.25rem' }} />
                    <span style={{ fontSize: '0.8125rem', fontWeight: 700 }}>{item.label}</span>
                    <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>{item.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Optional Policy Number */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.25rem' }}>
              Policy Number <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(Optional)</span>
            </label>
            <input
              type="text"
              placeholder="Policy Number"
              value={policyNumber}
              onChange={(e) => setPolicyNumber(e.target.value)}
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

          {/* Auto Specific */}
          {policyType === 'auto' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                  License Plate # <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="Plate Number"
                  value={plateNumber}
                  onChange={(e) => setPlateNumber(e.target.value.toUpperCase())}
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.75rem',
                    borderRadius: 'var(--radius-md)',
                    border: errors.plateNumber ? '1px solid #ef4444' : '1px solid var(--border-strong)',
                    background: 'var(--bg-input)',
                    fontFamily: 'JetBrains Mono, monospace',
                    fontWeight: 700,
                    outline: 'none'
                  }}
                />
                {errors.plateNumber && <span style={{ fontSize: '0.75rem', color: '#ef4444' }}>{errors.plateNumber}</span>}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                  Vehicle Make & Model
                </label>
                <input
                  type="text"
                  placeholder="Make and Model"
                  value={vehicleMakeModel}
                  onChange={(e) => setVehicleMakeModel(e.target.value)}
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

          {/* Home Specific */}
          {policyType === 'home' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                  Property Address <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="Property Address"
                  value={propertyAddress}
                  onChange={(e) => setPropertyAddress(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.75rem',
                    borderRadius: 'var(--radius-md)',
                    border: errors.propertyAddress ? '1px solid #ef4444' : '1px solid var(--border-strong)',
                    background: 'var(--bg-input)',
                    outline: 'none'
                  }}
                />
                {errors.propertyAddress && <span style={{ fontSize: '0.75rem', color: '#ef4444' }}>{errors.propertyAddress}</span>}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                  Property Type
                </label>
                <input
                  type="text"
                  placeholder="Property Type"
                  value={propertyType}
                  onChange={(e) => setPropertyType(e.target.value)}
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

          {/* Commercial Specific */}
          {policyType === 'commercial' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                  Business Legal / DBA Name <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="Business Name"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.75rem',
                    borderRadius: 'var(--radius-md)',
                    border: errors.businessName ? '1px solid #ef4444' : '1px solid var(--border-strong)',
                    background: 'var(--bg-input)',
                    outline: 'none'
                  }}
                />
                {errors.businessName && <span style={{ fontSize: '0.75rem', color: '#ef4444' }}>{errors.businessName}</span>}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                  Business / Policy Coverage
                </label>
                <input
                  type="text"
                  placeholder="Coverage Type"
                  value={businessType}
                  onChange={(e) => setBusinessType(e.target.value)}
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

          {/* Dates & Presets */}
          <div style={{ marginBottom: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 700 }}>Policy Term & Expiry</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Quick preset:</span>
                {[3, 6, 12].map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => handleQuickDuration(m)}
                    style={{
                      padding: '0.2rem 0.5rem',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-surface-subtle)',
                      border: '1px solid var(--border-subtle)',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    +{m}m
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
              <CustomDateInput
                label="Term Start"
                required
                value={termStartDate}
                onChange={setTermStartDate}
                error={errors.termStartDate}
              />

              <CustomDateInput
                label="Renewal Target"
                required
                value={renewalDate}
                onChange={setRenewalDate}
                error={errors.renewalDate}
              />

              <CustomDateInput
                label="Expiry Date"
                required
                value={expiryDate}
                onChange={setExpiryDate}
                error={errors.expiryDate}
              />
            </div>
          </div>

          {/* Notes */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.25rem' }}>
              Policy Specific Notes <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(Optional)</span>
            </label>
            <input
              type="text"
              placeholder="Coverages, deductibles, carrier name..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
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

          {/* Footer */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '0.75rem',
            paddingTop: '1rem',
            borderTop: '1px solid var(--border-subtle)'
          }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Adding Policy...' : 'Add Policy to Client'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
