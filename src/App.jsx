import React from 'react';
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import Footer from './components/layout/Footer';
import ActivityBar from './components/features/ActivityBar';
import PricingList from './components/features/PricingList';
import ServiceStats from './components/features/ServiceStats';
import { pricingPlans, usageStats, breadcrumbs } from './data/mockData';

function App() {
  return (
    <div className="ide">
      <ActivityBar />
      
      <Sidebar title="Cloud Explorer">
        <section className="sidebar__section">
          <div className="sidebar__section-title">Subscription Plans</div>
          <div style={{ padding: '15px' }}>
            <PricingList plans={pricingPlans} />
          </div>
        </section>
        
        <ServiceStats stats={usageStats} />
      </Sidebar>

      <Header breadcrumbs={breadcrumbs} />

      <main className="ide__main main">
        <section className="main__editor editor">
          <div className="editor__line-numbers">1<br/>2<br/>3<br/>4<br/>5</div>
          <div className="editor__content">
            {`graph TD
    A[Start] --> B{Is it working?}
    B -->|Yes| C[Great!]
    B -->|No| D[Debug]
    D --> B`}
          </div>
        </section>
        <section className="main__preview">
          <div className="canvas">
            <div className="loader">Diagram Preview (React Component)</div>
          </div>
        </section>
      </main>

      <section className="ide__terminal terminal">
        <div className="terminal__tabs">
          <div className="terminal__tab terminal__tab--active">Terminal</div>
          <div className="terminal__tab">Problems</div>
          <div className="terminal__tab">Output</div>
        </div>
        <div className="terminal__output">
          > Initializing VisualDSL React Engine...<br/>
          > Components loaded successfully.<br/>
          > Ready.
        </div>
      </section>

      <footer className="ide__status status-bar">
        <div className="status-bar__left">
          <div className="status-bar__item">main*</div>
          <div className="status-bar__item">0 ⚠ 0 ✘</div>
        </div>
        <div className="status-bar__right">
          <div className="status-bar__item">Ln 5, Col 12</div>
          <div className="status-bar__item">UTF-8</div>
          <div className="status-bar__item">React SPA</div>
        </div>
      </footer>

      <Footer 
        version="v1.0.0-react" 
        copyright="© 2026 VisualDSL Studio" 
      />
    </div>
  );
}

export default App;
