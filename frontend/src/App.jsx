import Dashboard from "./pages/Dashboard.jsx";

export default function App() {
  return (
    <>
      <a className="skip" href="#main">Skip to content</a>
      <header className="app-header">
        <h1>Cloud Cost Optimization Dashboard</h1>
        <p>Demo using local sample billing data</p>
      </header>
      <main id="main"><Dashboard /></main>
    </>
  );
}
