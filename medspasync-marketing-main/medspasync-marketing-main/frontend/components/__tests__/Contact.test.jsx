import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { ToastProvider } from '../../context/ToastContext';
import Contact from '../Contact';

// Mock the toast context
const mockShowToast = vi.fn();

const renderWithProviders = (component) => {
  return render(
    <BrowserRouter>
      <ToastProvider>
        {component}
      </ToastProvider>
    </BrowserRouter>
  );
};

// Mock the useToast hook
vi.mock('../../context/ToastContext', async () => {
  const actual = await vi.importActual('../../context/ToastContext');
  return {
    ...actual,
    useToast: () => ({
      showToast: mockShowToast
    })
  };
});

describe('Contact Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders contact form', () => {
    renderWithProviders(<Contact />);
    
    expect(screen.getByText('Ready to Stop Losing Revenue?')).toBeInTheDocument();
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/spa name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/message/i)).toBeInTheDocument();
  });

  it('displays trust indicators', () => {
    renderWithProviders(<Contact />);
    
    expect(screen.getByText('97% match rate accuracy from real medical spas')).toBeInTheDocument();
    expect(screen.getByText('24-hour implementation timeline')).toBeInTheDocument();
    expect(screen.getByText('HIPAA-conscious security')).toBeInTheDocument();
    expect(screen.getByText('Built by 10-year medical spa veteran')).toBeInTheDocument();
  });

  it('displays testimonial', () => {
    renderWithProviders(<Contact />);
    
    expect(screen.getByText(/We reduced reconciliation from 6 hours weekly to just 15 minutes/)).toBeInTheDocument();
    expect(screen.getByText(/Multi-location Med Spa, Atlanta/)).toBeInTheDocument();
  });

  it('handles form input changes', () => {
    renderWithProviders(<Contact />);
    
    const nameInput = screen.getByLabelText(/full name/i);
    const emailInput = screen.getByLabelText(/email address/i);
    
    fireEvent.change(nameInput, { target: { value: 'John Doe' } });
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
    
    expect(nameInput.value).toBe('John Doe');
    expect(emailInput.value).toBe('john@example.com');
  });

  it('submits form successfully', async () => {
    renderWithProviders(<Contact />);
    
    // Fill out required fields
    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'john@example.com' } });
    
    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /start reconciling/i }));
    
    // Check loading state
    expect(screen.getByText('Sending...')).toBeInTheDocument();
    
    // Wait for submission to complete
    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith(
        'Message sent successfully! We\'ll get back to you within 24 hours.',
        'success'
      );
    });
    
    // Check form is reset
    expect(screen.getByLabelText(/full name/i).value).toBe('');
    expect(screen.getByLabelText(/email address/i).value).toBe('');
  });

  it('handles form submission error', async () => {
    // Mock a failed submission
    const mockSubmit = vi.fn().mockRejectedValue(new Error('Network error'));
    
    renderWithProviders(<Contact />);
    
    // Fill out required fields
    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'john@example.com' } });
    
    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /start reconciling/i }));
    
    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith(
        'Failed to send message. Please try again.',
        'error'
      );
    });
  });

  it('validates required fields', () => {
    renderWithProviders(<Contact />);
    
    const submitButton = screen.getByRole('button', { name: /start reconciling/i });
    const nameInput = screen.getByLabelText(/full name/i);
    const emailInput = screen.getByLabelText(/email address/i);
    
    // Check required attributes
    expect(nameInput).toHaveAttribute('required');
    expect(emailInput).toHaveAttribute('required');
  });

  it('has proper form structure', () => {
    renderWithProviders(<Contact />);
    
    const form = screen.getByRole('form');
    expect(form).toBeInTheDocument();
    
    // Check all form inputs are present
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/spa name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/message/i)).toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    renderWithProviders(<Contact />);
    
    // Check labels are properly associated with inputs
    const nameInput = screen.getByLabelText(/full name/i);
    const emailInput = screen.getByLabelText(/email address/i);
    
    expect(nameInput).toHaveAttribute('id', 'name');
    expect(emailInput).toHaveAttribute('id', 'email');
  });
}); 