import React from 'react';

interface ConfirmEndGameModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  message: string;
}

export default function ConfirmEndGameModal({ 
  open, 
  onClose, 
  onConfirm, 
  message 
}: ConfirmEndGameModalProps) {
  if (!open) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(245, 247, 250, 0.95)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 3000
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '32px',
        borderRadius: '20px',
        maxWidth: '380px',
        width: '90%',
        textAlign: 'center',
        border: '2px solid #0052FF',
        boxShadow: '0 20px 60px rgba(0, 82, 255, 0.2)',
        fontFamily: "'Inter', 'Poppins', sans-serif"
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          backgroundColor: '#0052FF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px',
          boxShadow: '0 4px 16px rgba(0, 82, 255, 0.3)'
        }}>
          <span style={{ fontSize: '24px', color: 'white' }}>⚠️</span>
        </div>
        <h3 style={{ 
          marginBottom: '12px',
          color: '#0052FF',
          fontSize: '24px',
          fontWeight: '700'
        }}>Confirm Action</h3>
        <p style={{ 
          marginBottom: '24px',
          color: '#6B7280',
          fontSize: '15px',
          lineHeight: '1.5'
        }}>{message}</p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button
            onClick={onClose}
            style={{
              padding: '12px 24px',
              backgroundColor: 'white',
              border: '2px solid #E5E7EB',
              borderRadius: '12px',
              cursor: 'pointer',
              fontSize: '15px',
              fontWeight: '600',
              color: '#6B7280',
              transition: 'all 0.3s ease',
              fontFamily: "'Inter', 'Poppins', sans-serif"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#F5F7FA';
              e.currentTarget.style.borderColor = '#D1D5DB';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'white';
              e.currentTarget.style.borderColor = '#E5E7EB';
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: '12px 24px',
              backgroundColor: '#0052FF',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              fontSize: '15px',
              fontWeight: '600',
              boxShadow: '0 4px 16px rgba(0, 82, 255, 0.3)',
              transition: 'all 0.3s ease',
              fontFamily: "'Inter', 'Poppins', sans-serif"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#0041CC';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 82, 255, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#0052FF';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 82, 255, 0.3)';
            }}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
