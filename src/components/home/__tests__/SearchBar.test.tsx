import { render, screen, fireEvent, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

const mockPush = vi.fn();

vi.mock('@/i18n/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => '/',
}));

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const map: Record<string, string> = { searchPlaceholder: 'Search therapists...' };
    return map[key] ?? key;
  },
}));

// Import after mocks
import SearchBar from '../SearchBar';

// ── helpers ──────────────────────────────────────────────────────────────────

type CardData = { name: string; city: string; specs: string };

function addCards(data: CardData[]): HTMLElement[] {
  return data.map(({ name, city, specs }) => {
    const el = document.createElement('article');
    el.dataset.therapistName = name;
    el.dataset.therapistCity = city;
    el.dataset.therapistSpecs = specs;
    document.body.appendChild(el);
    return el;
  });
}

function removeCards(cards: HTMLElement[]) {
  cards.forEach((el) => el.parentNode?.removeChild(el));
}

const SAMPLE_CARDS: CardData[] = [
  { name: 'Sarah Cohen', city: 'Tel Aviv', specs: 'paediatrics Child Development' },
  { name: 'David Levi',  city: 'Jerusalem', specs: 'hand-therapy Hand Rehabilitation' },
  { name: 'Miriam Gold', city: 'Haifa',    specs: 'neurological Neurological Rehab' },
];

// ── A. Rendering ──────────────────────────────────────────────────────────────

describe('A. Rendering', () => {
  it('A1: renders a search input with placeholder', () => {
    render(<SearchBar />);
    expect(screen.getByRole('searchbox')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search therapists...')).toBeInTheDocument();
  });

  it('A2: hero variant renders a search input', () => {
    render(<SearchBar size="hero" />);
    expect(screen.getByRole('searchbox')).toBeInTheDocument();
  });

  it('A3: pre-fills input from initialQuery prop', () => {
    render(<SearchBar initialQuery="Hand Rehab" />);
    expect(screen.getByRole('searchbox')).toHaveValue('Hand Rehab');
  });

  it('A4: clear button not shown when input is empty', () => {
    render(<SearchBar />);
    expect(screen.queryByLabelText('Clear search')).not.toBeInTheDocument();
  });

  it('A5: clear button appears after typing a non-autocomplete value', () => {
    render(<SearchBar />);
    const input = screen.getByRole('searchbox');
    fireEvent.focus(input);
    // Use a value with no autocomplete match so ghost text doesn't replace the clear button
    fireEvent.change(input, { target: { value: 'xyz123' } });
    expect(screen.getByLabelText('Clear search')).toBeInTheDocument();
  });
});

// ── B. Client-side card filtering ─────────────────────────────────────────────

describe('B. Client-side card filtering', () => {
  let cards: HTMLElement[];

  beforeEach(() => { cards = addCards(SAMPLE_CARDS); });
  afterEach(() => removeCards(cards));

  function type(value: string) {
    render(<SearchBar />);
    const input = screen.getByRole('searchbox');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value } });
    return { input, cards };
  }

  it('B1: filters cards by therapist name', () => {
    type('sarah');
    expect(cards[0].style.display).not.toBe('none'); // Sarah Cohen — visible
    expect(cards[1].style.display).toBe('none');
    expect(cards[2].style.display).toBe('none');
  });

  it('B2: filters cards by city', () => {
    type('jerusalem');
    expect(cards[0].style.display).toBe('none');
    expect(cards[1].style.display).not.toBe('none'); // David Levi in Jerusalem
    expect(cards[2].style.display).toBe('none');
  });

  it('B3: filters cards by specialisation slug', () => {
    type('neurological');
    expect(cards[0].style.display).toBe('none');
    expect(cards[1].style.display).toBe('none');
    expect(cards[2].style.display).not.toBe('none'); // Miriam Gold
  });

  it('B4: filters cards by translated specialisation label', () => {
    type('Rehab');
    // Both "Hand Rehabilitation" and "Neurological Rehab" contain "rehab"
    expect(cards[0].style.display).toBe('none');      // no match
    expect(cards[1].style.display).not.toBe('none');  // Hand Rehabilitation
    expect(cards[2].style.display).not.toBe('none');  // Neurological Rehab
  });

  it('B5: matching is case-insensitive', () => {
    type('SARAH');
    expect(cards[0].style.display).not.toBe('none');
    expect(cards[1].style.display).toBe('none');
  });

  it('B6: keeps all cards visible when nothing matches (graceful degradation)', () => {
    type('zzznomatch');
    expect(cards[0].style.display).not.toBe('none');
    expect(cards[1].style.display).not.toBe('none');
    expect(cards[2].style.display).not.toBe('none');
  });

  it('B7: single character does not filter cards (mirrors 2-char debounce minimum)', () => {
    type('s');
    // Even though "s" would match Sarah, filter requires >= 2 chars
    expect(cards[0].style.display).not.toBe('none');
    expect(cards[1].style.display).not.toBe('none');
    expect(cards[2].style.display).not.toBe('none');
  });

  it('B8: empty query restores all cards', () => {
    render(<SearchBar />);
    const input = screen.getByRole('searchbox');
    fireEvent.focus(input);
    // Hide some cards
    fireEvent.change(input, { target: { value: 'sarah' } });
    expect(cards[1].style.display).toBe('none');
    // Clear
    fireEvent.change(input, { target: { value: '' } });
    expect(cards[0].style.display).not.toBe('none');
    expect(cards[1].style.display).not.toBe('none');
    expect(cards[2].style.display).not.toBe('none');
  });

  it('B9: clear button click restores all cards', () => {
    render(<SearchBar />);
    const input = screen.getByRole('searchbox');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'sarah' } });
    expect(cards[1].style.display).toBe('none');
    fireEvent.click(screen.getByLabelText('Clear search'));
    expect(cards[0].style.display).not.toBe('none');
    expect(cards[1].style.display).not.toBe('none');
    expect(cards[2].style.display).not.toBe('none');
  });
});

// ── C. Inline ghost-text autocomplete ─────────────────────────────────────────

describe('C. Inline autocomplete', () => {
  it('C1: no Tab hint for 1-char query', () => {
    render(<SearchBar />);
    const input = screen.getByRole('searchbox');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'C' } });
    expect(screen.queryByText('Tab')).not.toBeInTheDocument();
  });

  it('C2: Tab hint appears for 2+-char query that matches a term', () => {
    render(<SearchBar />);
    const input = screen.getByRole('searchbox');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'Ch' } });
    expect(screen.getByText('Tab')).toBeInTheDocument();
  });

  it('C3: Tab key accepts suggestion and fills input', () => {
    render(<SearchBar />);
    const input = screen.getByRole('searchbox');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'Ch' } });
    fireEvent.keyDown(input, { key: 'Tab' });
    expect(input).toHaveValue('Child Development');
    expect(screen.queryByText('Tab')).not.toBeInTheDocument();
  });

  it('C4: Tab key on accepted suggestion triggers navigation', () => {
    vi.useFakeTimers();
    render(<SearchBar />);
    const input = screen.getByRole('searchbox');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'Ch' } });
    fireEvent.keyDown(input, { key: 'Tab' });
    expect(mockPush).toHaveBeenCalledWith('/?q=Child%20Development', { scroll: false });
    vi.useRealTimers();
  });

  it('C5: Escape dismisses ghost text without changing value', () => {
    render(<SearchBar />);
    const input = screen.getByRole('searchbox');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'Ch' } });
    expect(screen.getByText('Tab')).toBeInTheDocument();
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(screen.queryByText('Tab')).not.toBeInTheDocument();
    expect(input).toHaveValue('Ch'); // value unchanged
  });

  it('C6: blurring clears ghost text', () => {
    render(<SearchBar />);
    const input = screen.getByRole('searchbox');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'Ch' } });
    expect(screen.getByText('Tab')).toBeInTheDocument();
    fireEvent.blur(input);
    expect(screen.queryByText('Tab')).not.toBeInTheDocument();
  });

  it('C7: case-insensitive autocomplete matching', () => {
    render(<SearchBar />);
    const input = screen.getByRole('searchbox');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'child' } }); // lowercase
    expect(screen.getByText('Tab')).toBeInTheDocument();
  });

  it('C8: typing the exact term shows no ghost', () => {
    render(<SearchBar />);
    const input = screen.getByRole('searchbox');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'Geriatrics' } });
    expect(screen.queryByText('Tab')).not.toBeInTheDocument();
  });

  it('C9: no ghost text when input is not focused', () => {
    render(<SearchBar initialQuery="Ch" />);
    // Component renders but is not focused
    expect(screen.queryByText('Tab')).not.toBeInTheDocument();
  });

  it('C10: ArrowRight at end of input accepts suggestion', () => {
    render(<SearchBar />);
    const input = screen.getByRole('searchbox');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'Ge' } });
    // Simulate cursor at end
    Object.defineProperty(input, 'selectionStart', { value: 2, configurable: true });
    fireEvent.keyDown(input, { key: 'ArrowRight' });
    expect(input).toHaveValue('Geriatrics');
  });
});

// ── D. Navigation / debounce ──────────────────────────────────────────────────

describe('D. Navigation', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockPush.mockClear();
  });
  afterEach(() => {
    vi.runAllTimers();
    vi.useRealTimers();
  });

  it('D1: form submit triggers immediate navigation with query', () => {
    render(<SearchBar />);
    const input = screen.getByRole('searchbox');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'sarah cohen' } });
    fireEvent.submit(input.closest('form')!);
    expect(mockPush).toHaveBeenCalledWith('/?q=sarah%20cohen', { scroll: false });
  });

  it('D2: debounce fires router.push after 500ms', () => {
    render(<SearchBar />);
    const input = screen.getByRole('searchbox');
    act(() => { fireEvent.focus(input); });
    act(() => { fireEvent.change(input, { target: { value: 'sarah' } }); });
    expect(mockPush).not.toHaveBeenCalled();
    act(() => { vi.advanceTimersByTime(500); });
    expect(mockPush).toHaveBeenCalledWith('/?q=sarah', { scroll: false });
  });

  it('D3: debounce resets timer on each keystroke', () => {
    render(<SearchBar />);
    const input = screen.getByRole('searchbox');
    act(() => { fireEvent.focus(input); });
    act(() => { fireEvent.change(input, { target: { value: 's' } }); });
    act(() => { vi.advanceTimersByTime(300); });
    act(() => { fireEvent.change(input, { target: { value: 'sa' } }); });
    act(() => { vi.advanceTimersByTime(300); }); // only 300ms since last change
    expect(mockPush).not.toHaveBeenCalled();
    act(() => { vi.advanceTimersByTime(200); }); // now 500ms since last change
    expect(mockPush).toHaveBeenCalledTimes(1);
  });

  it('D4: debounce navigates to "/" for queries shorter than 2 chars', () => {
    render(<SearchBar />);
    const input = screen.getByRole('searchbox');
    act(() => { fireEvent.focus(input); });
    act(() => { fireEvent.change(input, { target: { value: 's' } }); });
    act(() => { vi.advanceTimersByTime(500); });
    expect(mockPush).toHaveBeenCalledWith('/', { scroll: false });
  });

  it('D5: debounce navigates to "/" when input is cleared', () => {
    render(<SearchBar initialQuery="sarah" />);
    const input = screen.getByRole('searchbox');
    act(() => { fireEvent.focus(input); });
    act(() => { fireEvent.change(input, { target: { value: '' } }); });
    act(() => { vi.advanceTimersByTime(500); });
    expect(mockPush).toHaveBeenCalledWith('/', { scroll: false });
  });

  it('D6: debounce does NOT navigate when input is not focused', () => {
    render(<SearchBar />);
    const input = screen.getByRole('searchbox');
    act(() => { fireEvent.focus(input); });
    act(() => { fireEvent.change(input, { target: { value: 'sarah' } }); });
    act(() => { fireEvent.blur(input); }); // lose focus before debounce fires
    act(() => { vi.advanceTimersByTime(500); });
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('D7: clear button navigates to home immediately', () => {
    render(<SearchBar initialQuery="Sarah" />);
    const input = screen.getByRole('searchbox');
    fireEvent.focus(input);
    fireEvent.click(screen.getByLabelText('Clear search'));
    expect(mockPush).toHaveBeenCalledWith('/', { scroll: false });
  });

  it('D8: form submit cancels pending debounce', () => {
    render(<SearchBar />);
    const input = screen.getByRole('searchbox');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'sarah' } });
    // Submit before debounce fires
    fireEvent.submit(input.closest('form')!);
    act(() => { vi.advanceTimersByTime(500); });
    // router.push should only be called once (from submit), not twice
    expect(mockPush).toHaveBeenCalledTimes(1);
  });
});
