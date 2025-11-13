import { render, screen, fireEvent } from '@testing-library/react';
import VersionSwitcher from '../../src/components/VersionSwitcher.jsx';

describe('VersionSwitcher', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with current version', () => {
    render(<VersionSwitcher version="6" context="docs" />);
    const buttons = screen.getAllByRole('button');
    expect(buttons[0]).toHaveTextContent('v6');
  });

  it('opens dropdown when button is clicked', () => {
    render(<VersionSwitcher version="6" context="docs" />);
    const button = screen.getAllByRole('button')[0];
    
    fireEvent.click(button);
    
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    expect(button).toHaveAttribute('aria-expanded', 'true');
  });

  it('shows all version options in dropdown', () => {
    render(<VersionSwitcher version="6" context="docs" />);
    const mainButton = screen.getAllByRole('button')[0];
    
    fireEvent.click(mainButton);
    
    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(4);
    expect(options[0]).toHaveTextContent('v6');
    expect(options[1]).toHaveTextContent('v5');
    expect(options[2]).toHaveTextContent('v4');
    expect(options[3]).toHaveTextContent('v3');
  });

  it('marks current version as active', () => {
    render(<VersionSwitcher version="5" context="docs" />);
    const button = screen.getAllByRole('button')[0];
    
    fireEvent.click(button);
    
    const options = screen.getAllByRole('option');
    const activeOption = options.find(opt => opt.textContent.includes('v5'));
    expect(activeOption).toHaveAttribute('aria-selected', 'true');
  });

  it('closes dropdown when clicking same version', () => {
    render(<VersionSwitcher version="6" context="docs" />);
    const mainButton = screen.getAllByRole('button')[0];
    
    fireEvent.click(mainButton);
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    
    // Click the active version button (first one after main button)
    const allButtons = screen.getAllByRole('button');
    const firstDropdownButton = allButtons[1];
    fireEvent.click(firstDropdownButton);
    
    expect(mainButton).toHaveAttribute('aria-expanded', 'false');
  });

  it('toggles dropdown on multiple clicks', () => {
    render(<VersionSwitcher version="6" context="docs" />);
    const button = screen.getAllByRole('button')[0];
    
    fireEvent.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'true');
    
    fireEvent.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'false');
    
    fireEvent.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'true');
  });

  it('renders chevron icon', () => {
    render(<VersionSwitcher version="6" context="docs" />);
    expect(screen.getByText('▼')).toBeInTheDocument();
  });

  it('uses correct version in dropdown for different props', () => {
    const { rerender } = render(<VersionSwitcher version="3" context="docs" />);
    
    let buttons = screen.getAllByRole('button');
    expect(buttons[0]).toHaveTextContent('v3');
    
    rerender(<VersionSwitcher version="4" context="docs" />);
    
    buttons = screen.getAllByRole('button');
    expect(buttons[0]).toHaveTextContent('v4');
  });
});
