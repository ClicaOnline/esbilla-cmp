// esbilla-dashboard/src/components/BadgeEstado.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BadgeEstado } from './BadgeEstado';

describe('BadgeEstado', () => {
  describe('Plan badges', () => {
    it('renders plan-free badge with correct label', () => {
      render(<BadgeEstado name="plan-free" />);
      expect(screen.getByText('Free')).toBeInTheDocument();
    });

    it('renders plan-pro badge with correct label', () => {
      render(<BadgeEstado name="plan-pro" />);
      expect(screen.getByText('Pro')).toBeInTheDocument();
    });

    it('renders plan-enterprise badge with correct label', () => {
      render(<BadgeEstado name="plan-enterprise" />);
      expect(screen.getByText('Enterprise')).toBeInTheDocument();
    });

    it('accepts custom label', () => {
      render(<BadgeEstado name="plan-pro" label="Profesional" />);
      expect(screen.getByText('Profesional')).toBeInTheDocument();
    });
  });

  describe('Email badges', () => {
    it('renders email-verified badge with green styling', () => {
      const { container } = render(<BadgeEstado name="email-verified" />);
      const badge = container.firstChild as HTMLElement;
      expect(badge).toHaveClass('bg-green-100', 'text-green-700');
      expect(screen.getByText('Verificado')).toBeInTheDocument();
    });

    it('renders email-pending badge with gray styling', () => {
      const { container } = render(<BadgeEstado name="email-pending" />);
      const badge = container.firstChild as HTMLElement;
      expect(badge).toHaveClass('bg-stone-100', 'text-stone-600');
      expect(screen.getByText('Pendiente')).toBeInTheDocument();
    });
  });

  describe('SMTP badge', () => {
    it('renders smtp-configured badge', () => {
      render(<BadgeEstado name="smtp-configured" />);
      expect(screen.getByText('SMTP OK')).toBeInTheDocument();
    });

    it('accepts custom label for SMTP', () => {
      render(<BadgeEstado name="smtp-configured" label="SMTP Propio" />);
      expect(screen.getByText('SMTP Propio')).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('applies custom className', () => {
      const { container } = render(<BadgeEstado name="plan-free" className="custom-class" />);
      const badge = container.firstChild as HTMLElement;
      expect(badge).toHaveClass('custom-class');
    });

    it('has correct base classes for badges', () => {
      const { container } = render(<BadgeEstado name="plan-pro" />);
      const badge = container.firstChild as HTMLElement;
      expect(badge).toHaveClass('inline-flex', 'items-center', 'gap-1.5', 'px-2', 'py-1', 'rounded-full', 'text-xs', 'font-semibold');
    });
  });

  describe('SVG icons', () => {
    it('renders SVG icon for each badge', () => {
      const { container } = render(<BadgeEstado name="plan-free" />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });
  });
});
