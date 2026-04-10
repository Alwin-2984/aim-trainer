import ModeSelector from '@/components/ModeSelector';

export default function Home() {
  return (
    <div id="overlay" style={{ opacity: 1, visibility: 'visible' }}>
      <div className="hero-content">
        <h1 className="hero-title">train your skills here</h1>
        <ModeSelector />
      </div>
    </div>
  );
}
