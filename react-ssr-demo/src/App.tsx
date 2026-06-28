import heroImg from './assets/hero.png';
import './App.css';
import { Helmet, HelmetProvider } from 'react-helmet-async';

function App() {
  return (
   <HelmetProvider> 
      <Helmet>
        <title> React Vite Demo SEO</title>
        <meta name="description" content="React Vite demo SEO testing" />
        <meta name="keywords" content="React, Vite, SEO" />
        <meta name="property" content="og:title" content="React Vite Demo SEO" />
        <meta name="property" content="og:description" content="React Vite demo SEO" />
        <meta name="property" content="og:image" content={heroImg} />
      </Helmet>

     <section id="center">
        <h1>React Vite Demo SEO</h1>
        <p>This is a demo for React Vite SEO testing.</p>
      </section>
   </HelmetProvider>
  );
}

export default App;
