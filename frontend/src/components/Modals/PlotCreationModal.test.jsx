import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PlotCreationModal } from './PlotCreationModal';

describe('PlotCreationModal Component', () => {
  it('does not render when isOpen is false', () => {
    const { container } = render(
      <PlotCreationModal
        isOpen={false}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        areaM2={1500}
        isSubmitting={false}
        error={null}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('renders modal with calculated area and form inputs when open', () => {
    render(
      <PlotCreationModal
        isOpen={true}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        areaM2={25000}
        isSubmitting={false}
        error={null}
      />
    );

    expect(screen.getByText('Register New Land Plot')).toBeInTheDocument();
    expect(screen.getByText(/2.50 ha/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Total Price/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Contact Information/i)).toBeInTheDocument();
  });

  it('validates required fields before submitting', () => {
    const onSubmit = vi.fn();
    render(
      <PlotCreationModal
        isOpen={true}
        onClose={vi.fn()}
        onSubmit={onSubmit}
        areaM2={1500}
        isSubmitting={false}
        error={null}
      />
    );

    // Submit form with empty fields
    const submitBtn = screen.getByRole('button', { name: /Register Plot/i });
    const form = submitBtn.closest('form');
    fireEvent.submit(form);

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText(/Please enter a valid total price/i)).toBeInTheDocument();

    // Now fill price with valid, but empty description
    fireEvent.change(screen.getByLabelText(/Total Price/i), { target: { value: '100' } });
    fireEvent.submit(form);
    expect(screen.getByText(/Please enter a description for the land plot/i)).toBeInTheDocument();

    // Now fill description, but empty contact
    fireEvent.change(screen.getByLabelText(/Description/i), { target: { value: 'Some plot' } });
    fireEvent.submit(form);
    expect(screen.getByText(/Please provide contact information/i)).toBeInTheDocument();
  });

  it('submits valid form data', () => {
    const onSubmit = vi.fn();
    render(
      <PlotCreationModal
        isOpen={true}
        onClose={vi.fn()}
        onSubmit={onSubmit}
        areaM2={1500}
        isSubmitting={false}
        error={null}
      />
    );

    fireEvent.change(screen.getByLabelText(/Total Price/i), { target: { value: '180000' } });
    fireEvent.change(screen.getByLabelText(/Description/i), { target: { value: 'Great residential plot' } });
    fireEvent.change(screen.getByLabelText(/Contact Information/i), { target: { value: 'owner@example.com' } });

    fireEvent.click(screen.getByRole('button', { name: /Register Plot/i }));

    expect(onSubmit).toHaveBeenCalledWith({
      totalPrice: 180000,
      description: 'Great residential plot',
      contactInfo: 'owner@example.com',
    });
  });

  it('renders spatial conflict error banner when error is conflict', () => {
    const conflictError = {
      isConflict: true,
      message: 'Land plot overlaps with an existing registered plot',
      details: 'Overlaps with plot uuid-555',
    };

    render(
      <PlotCreationModal
        isOpen={true}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        areaM2={1500}
        isSubmitting={false}
        error={conflictError}
      />
    );

    expect(screen.getByText('Spatial Overlap Rejected')).toBeInTheDocument();
    expect(screen.getByText('Land plot overlaps with an existing registered plot')).toBeInTheDocument();
    expect(screen.getByText('Overlaps with plot uuid-555')).toBeInTheDocument();
  });

  it('handles cancel button click and closes', () => {
    const onClose = vi.fn();
    render(
      <PlotCreationModal
        isOpen={true}
        onClose={onClose}
        onSubmit={vi.fn()}
        areaM2={1500}
        isSubmitting={false}
        error={null}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('resets form fields when reopened after previously entered data', () => {
    const { rerender } = render(
      <PlotCreationModal
        isOpen={true}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        areaM2={1500}
        isSubmitting={false}
        error={null}
      />
    );

    // Fill form
    fireEvent.change(screen.getByLabelText(/Total Price/i), { target: { value: '99999' } });
    fireEvent.change(screen.getByLabelText(/Description/i), { target: { value: 'Previous plot description' } });
    fireEvent.change(screen.getByLabelText(/Contact Information/i), { target: { value: 'previous@landmark.com' } });

    expect(screen.getByLabelText(/Total Price/i)).toHaveValue(99999);
    expect(screen.getByLabelText(/Description/i)).toHaveValue('Previous plot description');

    // Simulate modal close (e.g. plot was registered or cancelled)
    rerender(
      <PlotCreationModal
        isOpen={false}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        areaM2={1500}
        isSubmitting={false}
        error={null}
      />
    );

    // Simulate reopening for second plot registration
    rerender(
      <PlotCreationModal
        isOpen={true}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        areaM2={2000}
        isSubmitting={false}
        error={null}
      />
    );

    // Fields must now be clean and empty
    expect(screen.getByLabelText(/Total Price/i)).toHaveValue(null);
    expect(screen.getByLabelText(/Description/i)).toHaveValue('');
    expect(screen.getByLabelText(/Contact Information/i)).toHaveValue('');
  });
});

