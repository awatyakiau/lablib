import React from 'react';
import logo from './logo.svg';
import './App.css';
import { useEffect, useState } from 'react';

function App() {
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch("/api/hello")
      .then(res => res.text())
      .then(setMsg);
  }, []);
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.tsx</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
          {msg}
        </a>
      </header>
    </div>
  );
}

export default App;
