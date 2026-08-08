import React, { useState, useEffect } from 'react';
import { 
  User, Edit, ShieldCheck, Mail, Phone, Landmark, 
  MapPin, Camera, Save, X, CheckCircle, AlertCircle 
} from 'lucide-react';

const DEFAULT_PROFILE = {
  firstName: 'Sarah',
  lastName: 'Jenkins',
  email: 'sarah.jenkins@apexexchange.com',
  phone: '+1 (555) 234-5678',
  role: 'Treasury Officer',
  region: 'United States',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120&h=120'
};

const Profile = () => {
  // Read initial details from localStorage
  const [profileData, setProfileData] = useState(() => {
    const saved = localStorage.getItem('apex_profile_info');
    return saved ? JSON.parse(saved) : DEFAULT_PROFILE;
  });

  // Page view controller states
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ ...profileData });
  const [formError, setFormError] = useState(null);

  // Success toast alerts
  const [toastMsg, setToastMsg] = useState('');
  const [showToast, setShowToast] = useState(false);

  // Synchronize initial formData if profileData changes
  useEffect(() => {
    setFormData({ ...profileData });
  }, [profileData]);

  // Trigger floating alert toast
  const triggerToast = (msg) => {
    setToastMsg(msg);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 3000);
  };

  // Form input change handlers
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Profile Save handler
  const handleSaveProfile = (e) => {
    e.preventDefault();
    setFormError(null);

    // Simple validators
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setFormError("First name and Last name are required.");
      return;
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      setFormError("Please provide a valid corporate email address.");
      return;
    }

    setProfileData(formData);
    localStorage.setItem('apex_profile_info', JSON.stringify(formData));
    setIsEditing(false);
    triggerToast("User profile details updated successfully!");
  };

  // Cancel edit changes
  const handleCancelEdit = () => {
    setFormData({ ...profileData });
    setIsEditing(false);
    setFormError(null);
  };

  // Mock Avatar picture changes
  const handleAvatarClick = () => {
    const newUrl = prompt("Enter a new image URL for your profile photo:", formData.avatar);
    if (newUrl && newUrl.trim().startsWith('http')) {
      const updated = { ...profileData, avatar: newUrl };
      setProfileData(updated);
      setFormData(updated);
      localStorage.setItem('apex_profile_info', JSON.stringify(updated));
      triggerToast("Profile picture updated!");
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">User Profile</h1>
        <p className="page-subtitle">Inspect personal credentials, operational clearing limits, and KYC compliance verifications.</p>
      </div>

      {/* Main Header card displaying profile summary */}
      <div className="profile-header-card">
        <div className="profile-avatar-wrapper">
          <img 
            src={profileData.avatar} 
            alt="Sarah Jenkins profile" 
            className="profile-avatar-img" 
          />
          <button 
            type="button" 
            className="profile-avatar-upload-overlay"
            onClick={handleAvatarClick}
            title="Upload new avatar image"
            aria-label="Change photo"
          >
            <Camera size={14} />
          </button>
        </div>

        <div className="profile-brief-details">
          <span className="profile-brief-name">
            {profileData.firstName} {profileData.lastName}
          </span>
          <span className="profile-brief-title">{profileData.role}</span>
          <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
            <span className="badge-status active" style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: 'var(--radius-full)' }}>
              KYC Level 2 Verified
            </span>
            <span className="badge-status alert-active" style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: 'var(--radius-full)' }}>
              Limit: $1M Daily
            </span>
          </div>
        </div>
      </div>

      {/* 2-column Grid: Inputs form on Left, KYC ledger checklist on Right */}
      <div className="portfolio-layout-grid">
        
        {/* Left Side: Detail form */}
        <div className="widget-card">
          <div className="widget-header">
            <div className="widget-title">
              <User size={18} color="var(--primary)" />
              Profile Information
            </div>
            
            {!isEditing && (
              <button 
                type="button" 
                className="placeholder-btn"
                style={{ fontSize: '0.75rem', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                onClick={() => setIsEditing(true)}
              >
                <Edit size={12} />
                Edit Profile
              </button>
            )}
          </div>

          <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {formError && (
              <div style={{ padding: '10px', border: '1px solid var(--danger)', backgroundColor: 'var(--danger-light)', borderRadius: 'var(--radius-sm)', color: 'var(--danger)', fontSize: '0.8rem', display: 'flex', gap: '6px' }}>
                <AlertCircle size={16} />
                <span>{formError}</span>
              </div>
            )}

            {/* Form row 1: First Name / Last Name */}
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="firstName">First Name</label>
                <input 
                  id="firstName"
                  type="text" 
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                />
              </div>
              <div className="form-group">
                <label htmlFor="lastName">Last Name</label>
                <input 
                  id="lastName"
                  type="text" 
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                />
              </div>
            </div>

            {/* Form row 2: Email / Phone */}
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input 
                  id="email"
                  type="email" 
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                />
              </div>
              <div className="form-group">
                <label htmlFor="phone">Phone Number</label>
                <input 
                  id="phone"
                  type="text" 
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                />
              </div>
            </div>

            {/* Form row 3: Role / Region */}
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="role">Corporate Role</label>
                <input 
                  id="role"
                  type="text" 
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                />
              </div>
              <div className="form-group">
                <label htmlFor="region">Country / Region</label>
                <input 
                  id="region"
                  type="text" 
                  name="region"
                  value={formData.region}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                />
              </div>
            </div>

            {/* Edit Mode Actions button */}
            {isEditing && (
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button 
                  type="button" 
                  className="placeholder-btn" 
                  style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-main)', border: '1px solid var(--border-color)', padding: '10px 20px' }}
                  onClick={handleCancelEdit}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="placeholder-btn"
                  style={{ padding: '10px 24px', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <Save size={14} />
                  Save Changes
                </button>
              </div>
            )}
          </form>
        </div>

        {/* Right Side: KYC details checklist */}
        <div className="widget-card">
          <div className="widget-header">
            <div className="widget-title">
              <ShieldCheck size={18} color="var(--primary)" />
              Sovereign KYC verification
            </div>
          </div>

          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
            In accordance with international anti-money laundering policies, your daily payment limits are determined by your completed KYC checks.
          </p>

          <div className="kyc-checklist">
            <div className="kyc-check-item">
              <CheckCircle size={18} className="kyc-check-icon" />
              <div>
                <div>Level 1: Personal ID Verification</div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Passport / National Identity Document Verified</span>
              </div>
            </div>

            <div className="kyc-check-item">
              <CheckCircle size={18} className="kyc-check-icon" />
              <div>
                <div>Level 2: Proof of Address</div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Utility Bill / Bank Ledger Verification Approved</span>
              </div>
            </div>

            <div className="kyc-check-item" style={{ opacity: 0.6 }}>
              <CheckCircle size={18} className="kyc-uncheck-icon" />
              <div>
                <div>Level 3: Corporate Asset Audits</div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Required to unlock daily limits over $10,000,000</span>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '24px', borderTop: '1px dashed var(--border-color)', paddingTop: '20px' }}>
            <button 
              className="placeholder-btn" 
              style={{ width: '100%', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              onClick={() => alert("Verification portal: Upload Level 3 asset sheet audits.")}
            >
              Verify Level 3 Status
            </button>
          </div>
        </div>

      </div>

      {/* Floating Animated Toast Banner */}
      <div className={`toast-notification ${showToast ? 'show' : ''}`}>
        <CheckCircle size={16} color="var(--accent)" />
        <span>{toastMsg}</span>
      </div>
    </div>
  );
};

export default Profile;
