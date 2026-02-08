// esbilla-dashboard/src/components/IntegrationIcon.test.tsx
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { IntegrationIcon, IntegrationBadge } from './IntegrationIcon';

describe('IntegrationIcon', () => {
  describe('Analytics integrations', () => {
    it('renders Google Analytics icon', () => {
      const { container } = render(<IntegrationIcon name="googleanalytics" />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute('role', 'img');
    });

    it('renders Hotjar icon', () => {
      const { container } = render(<IntegrationIcon name="hotjar" />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('renders Microsoft Clarity icon', () => {
      const { container } = render(<IntegrationIcon name="microsoftclarity" />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });
  });

  describe('Marketing integrations', () => {
    it('renders Facebook icon', () => {
      const { container } = render(<IntegrationIcon name="facebook" />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('renders LinkedIn icon', () => {
      const { container } = render(<IntegrationIcon name="linkedin" />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('renders TikTok icon', () => {
      const { container } = render(<IntegrationIcon name="tiktok" />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });
  });

  describe('Functional integrations', () => {
    it('renders Intercom icon', () => {
      const { container } = render(<IntegrationIcon name="intercom" />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('renders Zendesk icon', () => {
      const { container } = render(<IntegrationIcon name="zendesk" />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });
  });

  describe('Size customization', () => {
    it('applies default size of 32px', () => {
      const { container } = render(<IntegrationIcon name="googleanalytics" />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveStyle({ width: '32px', height: '32px' });
    });

    it('applies custom size', () => {
      const { container } = render(<IntegrationIcon name="facebook" size={48} />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveStyle({ width: '48px', height: '48px' });
    });
  });

  describe('Custom className', () => {
    it('applies custom className', () => {
      const { container } = render(<IntegrationIcon name="googleanalytics" className="custom-class" />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('custom-class');
    });
  });

  describe('Fallback for unknown icons', () => {
    it('renders fallback icon for unknown integration', () => {
      // @ts-ignore - Testing invalid name
      const { container } = render(<IntegrationIcon name="unknown-service" />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
      // Fallback should render a generic clock icon
      expect(svg?.querySelector('circle')).toBeInTheDocument();
    });
  });
});

describe('IntegrationBadge', () => {
  it('renders icon with label', () => {
    const { container, getByText } = render(<IntegrationBadge name="googleanalytics" showLabel={true} />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    // Simple Icons provides the title for Google Analytics
    expect(getByText(/google/i)).toBeInTheDocument();
  });

  it('hides label when showLabel is false', () => {
    const { container, queryByText } = render(<IntegrationBadge name="facebook" showLabel={false} />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(queryByText(/facebook/i)).not.toBeInTheDocument();
  });

  it('accepts custom label', () => {
    const { getByText } = render(<IntegrationBadge name="facebook" label="Meta Pixel" showLabel={true} />);
    expect(getByText('Meta Pixel')).toBeInTheDocument();
  });

  it('applies correct badge styling', () => {
    const { container } = render(<IntegrationBadge name="hotjar" />);
    const badge = container.firstChild as HTMLElement;
    expect(badge).toHaveClass('inline-flex', 'items-center', 'gap-2', 'px-2', 'py-1', 'rounded-lg', 'bg-stone-50', 'border', 'border-stone-200');
  });
});
