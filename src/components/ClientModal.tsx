'use client';

import React, { useState, useEffect } from 'react';
import { Client, PolicyType, ClientCreatePayload } from '@/lib/types';
import { X, User, Car, Home, Building2, Shield, Calendar, Phone, Mail, FileText } from 'lucide-react';
import { format, addMonths, subDays } from 'date-fns';

interface ClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ClientCreatePayload) => Promise<boolean>;
  editingClient?: Client | null;
  onUpdatePersonal?: (id: string, data: Partial<Client>) => Promise<boolean>;
}

export function ClientModal({
  isOpen,
  onClose,
  onSave,
  editingClient,
  onUpdatePersonal
}: ClientModalProps) {
  const isEditing = Boolean(editingClient);

  // Client personal details
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [dlNumber, setDlNumber] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');

  // Initial policy (for create mode)
  const [policyType, setPolicyType] = useState<PolicyType>('auto');
  const [policyNumber, setPolicyNumber] = useState('');
  const [plateNumber, setPlateNumber] = useState('');
  const [vehicleMakeModel, setVehicleMakeModel] = useState('');
  const [propertyAddress, setPropertyAddress] = useState('');
  const [propertyType, setPropertyType] = useState('Single Family Home');
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('General Liability');
  const [termStartDate, setTermStartDate] = useState('');
  const [renewalDate, setRenewalDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [policyNotes, setPolicyNotes] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editingClient) {
      setFirstName(editingClient.firstName);
      setLastName(editingClient.lastName);
      setDateOfBirth(editingClient.dateOfBirth);
      setDlNumber(editingClient.dlNumber);
      setPhoneNumber(editingClient.phoneNumber || '');
      setEmail(editingClient.email || '');
      setNotes(editingClient.notes || '');
    } else {
      const today = new Date();
      const oneYearOut = addMonths(today, 12);
      const renew = subDays(oneYearOut, 30);

      setFirstName('');
      setLastName('');
      setDateOfBirth('');
      setDlNumber('');
      setPhoneNumber('');
      setEmail('');
      setNotes('');

      setPolicyType('auto');
      setPolicyNumber('');
      setPlateNumber('');
      setVehicleMakeModel('');
      setPropertyAddress('');
      setPropertyType('Single Family Home');
      setBusinessName('');
      setBusinessType('General Liability');
      setTermStartDate(format(today, 'yyyy-MM-dd'));
      setRenewalDate(format(renew, 'yyyy-MM-dd'));
      setExpiryDate(format(oneYearOut, 'yyyy-MM-dd'));
      setPolicyNotes('');
    }
    setErrors({});
  }, [editingClient, isOpen]);

  if (!isOpen) return null;

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!firstName.trim()) errs.firstName = 'First name is required';
    if (!lastName.trim()) errs.lastName = 'Last name is required';

    if (!dateOfBirth) {
      errs.dateOfBirth = 'Date of birth is required';
    } else {
      const dob = new Date(dateOfBirth);
      if (isNaN(dob.getTime()) || dob >= new Date()) {
        errs.dateOfBirth = 'Date of birth must be a past date';
      }
    }

    if (!dlNumber.trim()) errs.dlNumber = 'Driver license number is required';

    if (!isEditing) {
      if (policyType === 'auto' && !plateNumber.trim()) {
        errs.plateNumber = 'Plate number is required for Auto insurance';
      }
      if (policyType === 'home' && !propertyAddress.trim()) {
        errs.propertyAddress = 'Property address is required for Home insurance';
      }
      if (policyType === 'commercial' && !businessName.trim()) {
        errs.businessName = 'Business name is required for Commercial insurance';
      }

      if (!termStartDate) errs.termStartDate = 'Term start date is required';
      if (!renewalDate) errs.renewalDate = 'Renewal date is required';
      if (!expiryDate) {
        errs.expiryDate = 'Expiry date is required';
      } else if (termStartDate && expiryDate <= termStartDate) {
        errs.expiryDate = 'Expiry date must be after term start date';
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    let success = false;

    if (isEditing && editingClient && onUpdatePersonal) {
      success = await onUpdatePersonal(editingClient.id, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        dateOfBirth,
        dlNumber: dlNumber.trim().toUpperCase(),
        phoneNumber: phoneNumber.trim() || undefined,
        email: email.trim() || undefined,
        notes: notes.trim() || undefined
      });
    } else {
      success = await onSave({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        dateOfBirth,
        dlNumber: dlNumber.trim().toUpperCase(),
        phoneNumber: phoneNumber.trim() || undefined,
        email: email.trim() || undefined,
        notes: notes.trim() || undefined,
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
        policyNotes: policyNotes.trim() || undefined
      });
    }

    setIsSubmitting(false);
    if (success) {
      onClose();
    }
  };

  const handleQuickDuration = (months: number) => {
    try {
      const start = new Date(termStartDate || Date.now());
      const newExpiry = addMonths(start, months);
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
        style={{ maxWidth: '680px' }}
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
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>
              {isEditing ? 'Edit Client Details' : 'Add New Insurance Client'}
            </h2>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              {isEditing
                ? 'Update client personal and contact information'
                : 'Create client profile and set up their first insurance policy'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="btn btn-ghost btn-icon"
            style={{ borderRadius: 'var(--radius-full)' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '1.5rem 1.75rem' }}>
          {/* Section 1: Client Personal Details */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{
              fontSize: '0.8125rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'var(--brand-primary)',
              marginBottom: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem'
            }}>
              <User size={15} /> Personal Information
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                  First Name <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. John"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.75rem',
                    borderRadius: 'var(--radius-md)',
                    border: errors.firstName ? '1px solid #ef4444' : '1px solid var(--border-strong)',
                    background: 'var(--bg-input)',
                    outline: 'none'
                  }}
                />
                {errors.firstName && <span style={{ fontSize: '0.75rem', color: '#ef4444' }}>{errors.firstName}</span>}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                  Last Name <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Smith"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.75rem',
                    borderRadius: 'var(--radius-md)',
                    border: errors.lastName ? '1px solid #ef4444' : '1px solid var(--border-strong)',
                    background: 'var(--bg-input)',
                    outline: 'none'
                  }}
                />
                {errors.lastName && <span style={{ fontSize: '0.75rem', color: '#ef4444' }}>{errors.lastName}</span>}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                  Date of Birth <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.75rem',
                    borderRadius: 'var(--radius-md)',
                    border: errors.dateOfBirth ? '1px solid #ef4444' : '1px solid var(--border-strong)',
                    background: 'var(--bg-input)',
                    outline: 'none'
                  }}
                />
                {errors.dateOfBirth && <span style={{ fontSize: '0.75rem', color: '#ef4444' }}>{errors.dateOfBirth}</span>}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                  Driver's License (DL) # <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. D1234-5678-9012"
                  value={dlNumber}
                  onChange={(e) => setDlNumber(e.target.value.toUpperCase())}
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.75rem',
                    borderRadius: 'var(--radius-md)',
                    border: errors.dlNumber ? '1px solid #ef4444' : '1px solid var(--border-strong)',
                    background: 'var(--bg-input)',
                    fontFamily: 'JetBrains Mono, monospace',
                    outline: 'none'
                  }}
                />
                {errors.dlNumber && <span style={{ fontSize: '0.75rem', color: '#ef4444' }}>{errors.dlNumber}</span>}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                  Phone Number
                </label>
                <input
                  type="tel"
                  placeholder="e.g. (555) 123-4567"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
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

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="e.g. client@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                Client Overview & Notes
              </label>
              <textarea
                rows={2}
                placeholder="General client notes, communication preferences..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.55rem 0.75rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-strong)',
                  background: 'var(--bg-input)',
                  outline: 'none',
                  resize: 'vertical'
                }}
              />
            </div>
          </div>

          {/* Section 2: Initial Policy Setup (When adding new client) */}
          {!isEditing && (
            <div style={{ marginBottom: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-subtle)' }}>
              <h3 style={{
                fontSize: '0.8125rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'var(--brand-primary)',
                marginBottom: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem'
              }}>
                <Shield size={15} /> First Policy Setup
              </h3>

              {/* Policy Type Tabs */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.625rem', marginBottom: '1rem' }}>
                {[
                  { id: 'auto' as PolicyType, label: 'Auto Insurance', icon: Car },
                  { id: 'home' as PolicyType, label: 'Home Policy', icon: Home },
                  { id: 'commercial' as PolicyType, label: 'Commercial Policy', icon: Building2 }
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
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.375rem',
                        padding: '0.65rem 0.5rem',
                        borderRadius: 'var(--radius-md)',
                        border: active ? '2px solid var(--brand-primary)' : '1px solid var(--border-strong)',
                        background: active ? 'rgba(59, 130, 246, 0.08)' : 'var(--bg-surface)',
                        color: active ? 'var(--brand-primary)' : 'var(--text-primary)',
                        cursor: 'pointer',
                        fontWeight: 700,
                        fontSize: '0.8125rem'
                      }}
                    >
                      <Icon size={16} /> {item.label}
                    </button>
                  );
                })}
              </div>

              {/* Dynamic Product Fields */}
              {policyType === 'auto' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                      Plate # <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 7XYZ892"
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
                      placeholder="e.g. 2022 Honda CR-V (Silver)"
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

              {policyType === 'home' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                      Property Address <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 742 Evergreen Terrace, Springfield"
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
                      placeholder="e.g. Single Family / Condo"
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

              {policyType === 'commercial' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                      Business Entity Name <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Vance Contracting LLC"
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
                      Coverage Type
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. General Liability $2M"
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

              {/* Policy Term Dates */}
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>Policy Term Dates</span>
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
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                      Term Start <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="date"
                      value={termStartDate}
                      onChange={(e) => setTermStartDate(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.45rem 0.6rem',
                        borderRadius: 'var(--radius-md)',
                        border: errors.termStartDate ? '1px solid #ef4444' : '1px solid var(--border-strong)',
                        background: 'var(--bg-input)',
                        outline: 'none'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                      Renewal Target <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="date"
                      value={renewalDate}
                      onChange={(e) => setRenewalDate(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.45rem 0.6rem',
                        borderRadius: 'var(--radius-md)',
                        border: errors.renewalDate ? '1px solid #ef4444' : '1px solid var(--border-strong)',
                        background: 'var(--bg-input)',
                        outline: 'none'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                      Expiry Date <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="date"
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.45rem 0.6rem',
                        borderRadius: 'var(--radius-md)',
                        border: errors.expiryDate ? '1px solid #ef4444' : '1px solid var(--border-strong)',
                        background: 'var(--bg-input)',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Form Actions Footer */}
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
              {isSubmitting ? 'Saving...' : isEditing ? 'Save Client Changes' : 'Create Client & Policy'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
